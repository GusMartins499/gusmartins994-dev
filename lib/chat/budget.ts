/**
 * Guardrails de cota — o que garante que o chat nunca saia do free tier.
 *
 * O limite real do Groq free tier NÃO é request, é token:
 *   30 req/min · 1.000 req/dia · 8.000 tokens/min · 200.000 tokens/dia
 *
 * Rate limit por IP sozinho não protege nada disso: dez visitantes legítimos
 * e distintos estouram a cota sem nenhum deles passar do limite individual.
 * Por isso existem três camadas, e a que importa é o contador GLOBAL de tokens.
 *
 * Trabalhamos com 75% dos limites do Groq para nunca encostar no 429 dele —
 * preferimos recusar em casa, com uma mensagem boa, a receber erro de fora.
 *
 * Sem env vars do Upstash, cai num limitador em memória: serve para
 * desenvolvimento local e degrada sozinho (uma instância só) em produção.
 */
import { Redis } from "@upstash/redis";

export const LIMITS = {
  /** 75% de 200.000 tokens/dia */
  tokensPerDay: 150_000,
  /** 75% de 8.000 tokens/min */
  tokensPerMinute: 6_000,
  /**
   * Por visitante, por hora.
   *
   * 25, não 8. O valor antigo foi calibrado quando cada pergunta custava
   * ~3.875 tokens (contexto inteiro no prompt). Com retrieval ela custa
   * ~1.295, e o teto diário de 150k já limita a ~115 perguntas/dia — ou
   * seja, um visitante sozinho não consegue mais derrubar o dia, o
   * contador global barra antes.
   *
   * Então este limite deixou de ser a defesa principal e virou freio
   * anti-script. 25 continua barrando um script (que faria centenas) e
   * não atrapalha uma conversa exploratória de verdade, que chega fácil
   * a 6 ou 7 perguntas.
   */
  asksPerIpPerHour: 25,
  /**
   * Teto duro da resposta — torna o custo por pergunta previsível.
   *
   * 600, não 400: com 400 a resposta cortava no meio da url da note
   * citada, porque o raciocínio do gpt-oss sai do mesmo orçamento.
   * Resposta truncada é pior do que uma pergunta a menos por minuto.
   */
  maxOutputTokens: 600,
  /** Pares (pergunta+resposta) reenviados como histórico. */
  historyWindow: 3,
  /** Tamanho máximo de uma pergunta, em chars. */
  maxQuestionChars: 500,
  /**
   * Teto de cada mensagem do histórico, em chars.
   *
   * O histórico vem do cliente e nada garante que é o que o modelo
   * respondeu de verdade. 3.000 cobre com folga uma resposta legítima
   * (600 tokens ≈ 2.400 chars) e corta o que passar disso.
   */
  maxHistoryMessageChars: 3_000,
} as const;

export type Refusal = {
  ok: false;
  reason: "day" | "minute" | "ip";
  retryAfter: number;
};

/**
 * Tokens reservados para uma pergunta. Guarda as chaves da janela em que a
 * reserva foi feita: o acerto no fim do stream tem que cair na mesma janela,
 * mesmo que o minuto (ou o dia) já tenha virado.
 */
export type Reservation = {
  tokens: number;
  dayKey: string;
  minuteKey: string;
};

export type ReserveVerdict =
  | { ok: true; reservation: Reservation }
  | Refusal;

/**
 * Estimativa de tokens a partir do texto.
 *
 * "chars ÷ 4" vale para inglês e português, mas CJK e emoji saem perto de
 * um token por caractere, ou mais. Dividir tudo por 4 deixaria um atacante
 * passar 4× mais token do que a estimativa diz. Então caractere fora do
 * ASCII conta um token inteiro. Exagera um pouco nos acentos do português,
 * e não tem problema: o acerto real vem depois, em `settle`.
 */
export function estimateTokens(text: string): number {
  let ascii = 0;
  let other = 0;
  for (const char of text) {
    if (char.charCodeAt(0) < 128) ascii++;
    else other++;
  }
  return Math.ceil(ascii / 4) + other;
}

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export const usingRedis = redis !== null;

/**
 * Fora de produção o limite por IP é pulado: em dev o desenvolvedor é o
 * visitante e o testador ao mesmo tempo, e bater o teto atrapalha o
 * trabalho sem provar nada. Os limites de TOKEN continuam valendo — são
 * eles que protegem a cota de verdade.
 */
const skipIpLimit = process.env.NODE_ENV !== "production";

// ── Fallback em memória (dev local / instância única) ────────────────────
const memory = new Map<string, { value: number; expiresAt: number }>();

function memIncr(key: string, by: number, ttlSeconds: number): number {
  const now = Date.now();
  const cur = memory.get(key);
  if (!cur || cur.expiresAt <= now) {
    memory.set(key, { value: by, expiresAt: now + ttlSeconds * 1000 });
    return by;
  }
  cur.value += by;
  return cur.value;
}

function memGet(key: string): number {
  const cur = memory.get(key);
  if (!cur || cur.expiresAt <= Date.now()) return 0;
  return cur.value;
}

// ── Chaves com janela embutida ───────────────────────────────────────────
const dayKey = () => `chat:tok:day:${new Date().toISOString().slice(0, 10)}`;
const minuteKey = () => `chat:tok:min:${Math.floor(Date.now() / 60_000)}`;
const ipKey = (ip: string) =>
  `chat:ip:${ip}:${Math.floor(Date.now() / 3_600_000)}`;

async function get(key: string): Promise<number> {
  if (!redis) return memGet(key);
  return Number((await redis.get<number>(key)) ?? 0);
}

async function incr(key: string, by: number, ttl: number): Promise<number> {
  if (!redis) return memIncr(key, by, ttl);
  const value = await redis.incrby(key, by);
  if (value === by) await redis.expire(key, ttl); // só na criação
  return value;
}

/**
 * Conta a pergunta no limite por IP. É a primeira coisa da rota, antes de
 * qualquer chamada externa: o embedding do Gemini também custa cota, e um
 * IP bloqueado não pode continuar chamando ele.
 *
 * Incrementa e só depois compara. Ler e incrementar em dois passos deixaria
 * uma rajada em paralelo passar inteira pela leitura antes do primeiro
 * incremento.
 */
export async function checkIp(ip: string): Promise<{ ok: true } | Refusal> {
  if (skipIpLimit) return { ok: true };
  const count = await incr(ipKey(ip), 1, 3_600);
  if (count > LIMITS.asksPerIpPerHour) {
    return { ok: false, reason: "ip", retryAfter: secondsToNextHour() };
  }
  return { ok: true };
}

/**
 * Reserva a estimativa nos contadores globais ANTES de chamar o Groq.
 *
 * Antes a rota lia os contadores e só gravava o consumo no fim do stream.
 * No meio disso, qualquer número de requisições em paralelo passava pela
 * mesma leitura, e uma requisição abortada nunca gravava nada. Com a reserva,
 * o token conta na hora: se a soma passar do teto, a reserva é desfeita e a
 * pergunta, recusada.
 */
export async function reserveTokens(tokens: number): Promise<ReserveVerdict> {
  const reservation: Reservation = {
    tokens,
    dayKey: dayKey(),
    minuteKey: minuteKey(),
  };

  const [day, minute] = await Promise.all([
    incr(reservation.dayKey, tokens, 86_400),
    incr(reservation.minuteKey, tokens, 120),
  ]);

  const overDay = day > LIMITS.tokensPerDay;
  const overMinute = minute > LIMITS.tokensPerMinute;
  if (!overDay && !overMinute) return { ok: true, reservation };

  await release(reservation);
  return overDay
    ? { ok: false, reason: "day", retryAfter: secondsToMidnightUTC() }
    : { ok: false, reason: "minute", retryAfter: secondsToNextMinute() };
}

/**
 * Troca a reserva pelo consumo REAL, vindo do onFinish do streamText.
 *
 * Só roda quando o stream termina. Se a requisição for abortada ou der erro,
 * a reserva fica como está: na dúvida, conta-se o token como gasto.
 */
export async function settle(
  reservation: Reservation,
  totalTokens: number | undefined,
): Promise<void> {
  if (totalTokens === undefined || !Number.isFinite(totalTokens)) return;
  const delta = totalTokens - reservation.tokens;
  if (delta === 0) return;
  await Promise.all([
    incr(reservation.dayKey, delta, 86_400),
    incr(reservation.minuteKey, delta, 120),
  ]);
}

/** Desfaz uma reserva inteira: a pergunta não chegou a gastar token. */
export async function release(reservation: Reservation): Promise<void> {
  await Promise.all([
    incr(reservation.dayKey, -reservation.tokens, 86_400),
    incr(reservation.minuteKey, -reservation.tokens, 120),
  ]);
}

/** Para a linha de status do boot. */
export async function remainingToday(): Promise<number> {
  return Math.max(0, LIMITS.tokensPerDay - (await get(dayKey())));
}

function secondsToNextMinute(): number {
  return 60 - Math.floor((Date.now() % 60_000) / 1000);
}
function secondsToNextHour(): number {
  return 3_600 - Math.floor((Date.now() % 3_600_000) / 1000);
}
function secondsToMidnightUTC(): number {
  const now = new Date();
  const midnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return Math.floor((midnight - now.getTime()) / 1000);
}

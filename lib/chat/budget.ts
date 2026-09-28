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
  /** Por visitante, por hora. */
  asksPerIpPerHour: 8,
  /** Teto duro da resposta — torna o custo por pergunta previsível. */
  maxOutputTokens: 400,
  /** Pares (pergunta+resposta) reenviados como histórico. */
  historyWindow: 3,
  /** Tamanho máximo de uma pergunta, em chars. */
  maxQuestionChars: 500,
} as const;

export type BudgetVerdict =
  | { ok: true; remainingToday: number }
  | { ok: false; reason: "day" | "minute" | "ip"; retryAfter: number };

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export const usingRedis = redis !== null;

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
 * Checa se cabe mais uma pergunta. Chamado ANTES de falar com o Groq,
 * usando uma estimativa; o consumo real é gravado depois por `recordUsage`.
 */
export async function checkBudget(
  ip: string,
  estimatedTokens: number,
): Promise<BudgetVerdict> {
  const [day, minute, ipCount] = await Promise.all([
    get(dayKey()),
    get(minuteKey()),
    get(ipKey(ip)),
  ]);

  if (ipCount >= LIMITS.asksPerIpPerHour) {
    return { ok: false, reason: "ip", retryAfter: secondsToNextHour() };
  }
  if (day + estimatedTokens > LIMITS.tokensPerDay) {
    return { ok: false, reason: "day", retryAfter: secondsToMidnightUTC() };
  }
  if (minute + estimatedTokens > LIMITS.tokensPerMinute) {
    return { ok: false, reason: "minute", retryAfter: secondsToNextMinute() };
  }

  await incr(ipKey(ip), 1, 3_600);
  return { ok: true, remainingToday: LIMITS.tokensPerDay - day };
}

/** Grava o consumo REAL, vindo do onFinish do streamText. */
export async function recordUsage(totalTokens: number): Promise<void> {
  if (!Number.isFinite(totalTokens) || totalTokens <= 0) return;
  await Promise.all([
    incr(dayKey(), totalTokens, 86_400),
    incr(minuteKey(), totalTokens, 120),
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

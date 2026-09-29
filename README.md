# gusmartinsdev.com.br

[![CI](https://github.com/GusMartins499/gusmartins994-dev/actions/workflows/ci.yml/badge.svg)](https://github.com/GusMartins499/gusmartins994-dev/actions/workflows/ci.yml)

Portfólio pessoal com estética de terminal — navegável, não um terminal
interativo. Bilíngue (pt/en), com mini-blog em MDX e um chat que responde
sobre o conteúdo do próprio site.

🔗 <https://gusmartinsdev.com.br>

As decisões de design e arquitetura — paleta, tipografia, gramática dos
cards, acessibilidade — estão em [DESIGN.md](DESIGN.md). Este arquivo é
sobre **rodar e manter** o projeto.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
daisyUI 5 · MDX (`next-mdx-remote` + `gray-matter`) · AI SDK 7 ·
Groq (`gpt-oss-120b`) · Gemini (embeddings) · Upstash Redis · Vercel

## Rodando local

Precisa de Node 24 (a versão que a CI usa).

```bash
npm ci
cp .env.example .env.local
npm run dev
```

O site sobe em <http://localhost:3000> e redireciona para `/pt` ou `/en`
conforme cookie, `Accept-Language` ou o padrão (`pt`).

**Nenhuma variável de ambiente é obrigatória.** Sem chave nenhuma o site
roda inteiro e o chat entra em modo mock, com respostas simuladas e a UX
completa (streaming, cursor, spinner, `esc` para cancelar). Cada chave
adiciona uma camada:

| Variável | Sem ela |
| --- | --- |
| `GROQ_API_KEY` | chat em modo mock |
| `GOOGLE_GENERATIVE_AI_API_KEY` | sem retrieval: o contexto inteiro vai no prompt (~3x mais token por pergunta) |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | orçamento de cota em memória, por instância |

As três são de free tier e nenhuma pede cartão — os links estão no
[.env.example](.env.example).

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | dev server (roda `build:context` antes) |
| `npm run build` | build de produção (roda `build:context` antes) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run build:context` | gera o contexto e os embeddings do chat |

## O chat

`build:context` lê `content/` e `lib/site.ts` e gera
`lib/chat/generated-context.ts` — que é **gitignorado**, nasce a cada
build. Ler os arquivos em runtime não funcionaria: o output file tracing
da Vercel não enxerga o `readdirSync`, então o que roda em dev quebraria
em produção.

O mesmo script gera os embeddings dos chunks. Eles são caros e imutáveis
entre deploys, então ficam num cache versionado
(`lib/chat/embeddings-cache.json`) — um build que não mexeu no conteúdo
faz **zero** chamada à API, e um clone novo constrói sem chave do Gemini.

Em runtime, só a pergunta é embedada. Os chunks acima do piso de
similaridade viram o contexto, e as fontes mostradas embaixo da resposta
saem desse ranking — não do modelo, que é proibido de escrever url.

Três camadas seguram o escopo e a cota:

- **Escopo.** Nenhum chunk acima do piso significa pergunta fora do
  assunto: a rota devolve um texto constante e não chama o modelo. A
  recusa é do servidor, não do prompt — um prompt pode ser contornado.
- **Entrada.** Só mensagens `user`/`assistant` vindas do corpo
  sobrevivem, e a última tem que ser `user`.
- **Cota.** Contador global de tokens (é o que o free tier do Groq
  limita, não requisições) + rate limit por IP, em
  [lib/chat/budget.ts](lib/chat/budget.ts).

## Alimentando o site

Conteúdo mora no repositório: adicionar é criar ou editar um arquivo e
dar push.

- **Projetos** — `content/projects.ts`
- **Notes** — um `.mdx` por post em `content/notes/`. Se o arquivo
  existe, o post está publicado; não há flag de rascunho
- **Nome, e-mail, redes, stack** — `lib/site.ts`
- **Textos da interface** — `i18n/pt.ts` e `i18n/en.ts`

Os dois dicionários compartilham o tipo `Dictionary`, então esquecer uma
chave na tradução quebra o typecheck em vez de sumir na tela.

## Estrutura

```
app/[locale]/     rotas (home, projects, notes/[slug], chat)
app/api/chat/     rota do chat (streaming, retrieval, orçamento)
components/       ui — chat/ tem o terminal e seus pedaços
content/          projects.ts + notes/*.mdx
i18n/             config de locale + dicionários pt/en
lib/              site.ts, notes.ts, seo.ts, theme.ts + chat/
proxy.ts          detecta o idioma e prefixa a rota
scripts/          build-context.ts
```

## Deploy e CI

Deploy pela integração Git da Vercel: PR gera preview, merge em `main`
vai para produção.

A CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) roda
typecheck, lint e build em todo PR — ela **não** deploya, só valida.

## Um aviso sobre o AGENTS.md

[AGENTS.md](AGENTS.md) é escrito e reescrito pelo próprio `next dev`, não
à mão. Se ele aparecer modificado sem você ter mexido, foi isso.

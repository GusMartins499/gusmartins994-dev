# DESIGN.md — gusmartinsdev.com.br

A planta do portfólio. Decisões de design e arquitetura tomadas antes do código,
para servir de referência ao longo do tempo.

## Conceito

Portfólio pessoal com **estética de terminal** (navegável, não um terminal
interativo). Breve, direto, alimentável ao longo do tempo via arquivos no
próprio repositório.

## Tecnologia

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **daisyUI 5** (plugin CSS puro, zero dependência de runtime)
- **MDX** para os posts do mini-blog (`next-mdx-remote` + `gray-matter`)
- Fonte via `next/font` (JetBrains Mono)
- Deploy alvo: Vercel (push → deploy automático)

## Tipografia

- **JetBrains Mono em todo o site** (títulos, corpo, código).
- Marcadores com cara de terminal, usados de forma consistente:
  - `~ ` / `~/` → prompt / identidade (hero, logo)
  - `// ` → comentário (o cargo/role)
  - `## ` → cabeçalho de seção
  - `> ` → item/projeto
- Dois pesos apenas: 400 (regular) e 500 (medium). Nada de 700.
- Caixa baixa como padrão estético (sentence case), reforçando o tom.

## Cores — paleta "rubro-negro"

Fugimos de roxo/azul/verde. Base preto + vermelho (aceno ao Flamengo), com
**âmbar** como secundário (aceno ao amarelo do JS). Dois temas com toggle
claro/escuro; escuro é o padrão.

Todos os pares que carregam texto passam no mínimo **WCAG AA**. Regra de ouro:
**vermelho nunca em corpo de texto longo** — só título, link, prompt e detalhe.

### Tema escuro (padrão)

| Token            | Hex       | Contraste (sobre bg) |
| ---------------- | --------- | -------------------- |
| `base-100` (bg)  | `#0f0c0c` | —                    |
| `base-200` (surf)| `#191313` | —                    |
| `base-300` (bord)| `#322323` | —                    |
| `base-content`   | `#ece7df` | 15.8:1 · AAA         |
| `--muted`        | `#a4988e` | 6.9:1 · AA           |
| `--faint` (hint) | `#6b625c` | 3.3:1 (não-essencial)|
| `primary` (red)  | `#ef4136` | 5.1:1 · AA           |
| `primary-hover`  | `#ff5c50` | 6.0:1 · AA           |
| `--accent-soft`  | `#231010` | fundo de tag         |
| `secondary`(amber)| `#ffb000`| 10.6:1 · AAA         |
| `success`        | `#3fcf8e` | 9.8:1 · AAA          |
| `error`          | `#ff7b6b` | 7.7:1 · AAA          |

### Tema claro (terminal de papel)

| Token            | Hex       | Contraste (sobre bg) |
| ---------------- | --------- | -------------------- |
| `base-100` (bg)  | `#f4f1ea` | —                    |
| `base-200` (surf)| `#fffefb` | —                    |
| `base-300` (bord)| `#ddd6c8` | —                    |
| `base-content`   | `#1a1a1a` | 15.4:1 · AAA         |
| `--muted`        | `#6a655c` | 5.1:1 · AA           |
| `--faint` (hint) | `#8f887c` | 3.1:1 (não-essencial)|
| `primary` (red)  | `#b4341f` | 5.4:1 · AA           |
| `primary-hover`  | `#9a2c1a` | 6.8:1 · AA           |
| `--accent-soft`  | `#f7ddd7` | fundo de tag         |
| `secondary`(amber)| `#8a5800`| 5.4:1 · AA           |
| `success`        | `#166b3d` | 5.8:1 · AA           |
| `error`          | `#b4341f` | 5.4:1 · AA           |

> No claro, o âmbar escurece bastante para virar texto legível — nesse tema ele
> funciona melhor como preenchimento (fundo de badge) do que como texto fino.

Os temas são definidos em `app/globals.css` via `@plugin "daisyui/theme"` e
trocados por `data-theme` no `<html>`.

## Interação

### Paleta de comandos (⌘K / ctrl+K / `/`)

Um só painel para navegar, executar ações locais (tema, idioma, copiar
e-mail, redes) e perguntar ao chat. Texto livre com mais de uma palavra sobe
a opção "perguntar ao chat" para o topo; qualquer outra coisa filtra os
comandos (busca sem acento/caixa). Não duplica o chat: entrega a pergunta a
`/chat?q=`. Fica indisponível na própria página do chat, onde o terminal já
captura o teclado. Chrome de janela de terminal, `↑↓` navega, `↵` executa,
`esc` fecha.

### Gramática dos cards

Projetos e notes usam a mesma estrutura, para que um card seja sempre lido
do mesmo jeito:

```
> título                         data / ação
  caminho real (repo ou arquivo .mdx)
  descrição
  tokens de stack / #tags
```

O hover não levanta o card: uma barra vermelha de 2px desce pela borda
esquerda (`.card-term`) — é o cursor do terminal entrando no item. Só em
elementos clicáveis; blocos estáticos (grupos da stack) não têm hover.

### Hero

Comando e saída: `~/gusmartins $ whoami` é digitado e o resto "imprime" em
cascata (`.boot-line`, ~100ms entre linhas). Fecha com três ações — ver
projetos (primária), perguntar à ia, currículo — os números reais do site
(projetos/notes/techs) e a dica do ⌘K.

### Leitura das notes

Barra de progresso no topo, tempo de leitura ao lado da data, sumário
quando o post tem 2+ seções, `#` copiável em cada heading e, no fim,
anterior/próximo. Sem `text-justify`: em monoespaçada com medida estreita
ele abre buracos entre palavras.

### Citações do chat

As fontes da resposta saem do **retrieval**, não do modelo: a rota manda os
links dos chunks que casaram como data part, antes do primeiro token, e a
UI os mostra embaixo da resposta. O system prompt proíbe escrever url — url
inventada é o erro mais fácil de um llm cometer, e com isso ele fica
impossível. No fim de cada note há um atalho que abre o chat com a pergunta
sobre aquele post já escrita.

### Navegação

`j`/`k` percorrem as listas movendo o foco de verdade (então `enter` abre e
o card acende pelo `:focus-within`). Troca de rota entra com um fade curto
(`.page-enter`, remontado por `key={pathname}`) — o `<ViewTransition>` do
React ainda é canary e aqui roda React 19 estável. 404 é uma tela de
terminal com o caminho que falhou.

### Header

Sticky com `backdrop-blur`. A rota ativa ganha o chevron `›` em vermelho.
O gatilho da paleta fica visível também no mobile (onde não há atalho de
teclado). Tema e idioma vivem no DOM (`data-theme`, cookie `NEXT_LOCALE`) e
são lidos como store externo, então header e paleta nunca divergem.

### Fundo

Uma camada fixa atrás do conteúdo: a grade, em duas escalas — fina de 32px
e forte a cada 128px. A hierarquia entre as duas é o que a faz parecer papel
milimetrado (claro) / grade de caracteres (escuro) em vez de ruído. Some em
degradê rumo ao rodapé.

Tokens `--grid` e `--grid-major` por tema, em `app/globals.css`.

> Já teve brilho no topo, vinheta e scanline de CRT junto. Ficou sujo: fundo
> decorado competindo com conteúdo simples. A regra que sobrou é **o fundo
> sustenta o conteúdo, não disputa com ele**.

## Estrutura de conteúdo (como "alimentar" o site)

Conteúdo mora no repositório — adicionar = criar/editar arquivo e dar `git push`.

- **Projetos:** `content/projects.ts` (array tipado). Cada card **abre o
  repositório no GitHub em nova aba** (`target="_blank"`), sem página de detalhe.
- **Notes (mini-blog):** um arquivo `.mdx` por post em `content/notes/`.
  Sem flags de visibilidade: se o arquivo existe, o post está publicado e listado.
  "Ainda não publicar" = simplesmente não commitar o arquivo ainda.
- **Config geral:** `lib/site.ts` (nome, role, about, e-mail, redes, skills/stack).

Frontmatter de um post:

```mdx
---
title: primeiro log
description: Uma linha de resumo.
date: 2026-08-21
tags: [meta, terminal]
---
```

## Rotas

| Rota              | Conteúdo                                             |
| ----------------- | ---------------------------------------------------- |
| `/`               | hero/about → skills & stack → projetos → notes → footer |
| `/projects`       | todos os projetos (cards que linkam pro GitHub)      |
| `/notes`          | lista de posts (mais recente primeiro)               |
| `/notes/[slug]`   | post renderizado a partir do MDX (SSG)               |

## Acessibilidade

- Landmarks semânticos: `header`/`nav`(rotulada)/`main`/`footer`, um único `banner`.
- Skip link "Pular para o conteúdo".
- Foco sempre visível (`:focus-visible` com outline no `primary`).
- Todo par de cores de texto ≥ AA (ver tabelas acima); `--faint` só p/ hints.
- Cursor piscante respeita `prefers-reduced-motion`.
- Links externos: `target="_blank"` + `rel="noopener noreferrer"` + `aria-label`.
- `lang="pt-BR"`.

## Estrutura de pastas

```
app/            rotas (layout, home, projects, notes/[slug])
components/     header, footer, theme-toggle, cards, mdx, section
content/        projects.ts + notes/*.mdx
lib/            site.ts (config) + notes.ts (leitura do MDX)
```

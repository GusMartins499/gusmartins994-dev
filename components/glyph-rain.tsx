"use client";

import { useEffect, useRef } from "react";

// Chuva de caracteres nas margens: colunas de letras caindo e se embaralhando,
// tipo "bug na matrix". Inspiração confessa no fundo da tela inicial do Claude
// Code — lá é monocromático e quase apagado, e é esse o tom: textura, não show.
// De lá também vem a onda do clique: cada clique solta um anel que se espalha
// acendendo a grade de caracteres por onde passa e apaga logo atrás.
//
// Canvas e não DOM: são centenas de glyphs trocando a cada quadro, e num canvas
// isso é um `fillText` por célula, sem layout nem reconciliação do React.
//
// Mesmas regras do resto do fundo (DESIGN.md): só nas margens laterais (a
// coluna de leitura fica limpa — monoespaçada atrás de monoespaçada vira
// ruído), nada abaixo de `lg`, e nada pra quem prefere menos movimento.

const GLYPHS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const FONT_PX = 12;
const COL_W = 16;
const ROW_H = 18;
// Metade da clareira central, em rem: a seção é max-w-3xl (24rem de cada lado
// do centro) e o resto é folga pra máscara desvanecer antes do texto.
const CLEAR_HALF_REM = 27;
// 30 quadros bastam pra uma queda lenta e poupam metade da bateria.
const FRAME_S = 1 / 30;

// A onda: anda sem pressa (~550px/s, dá pra acompanhar o anel abrindo),
// deixa um rastro que apaga em ~200px e morre inteira em 2.4s. Cliques em
// rajada não acumulam além de quatro ondas.
const WAVE_SPEED = 550; // px/s
const WAVE_TRAIL = 200; // px
const WAVE_LIFE = 2.4; // s
const MAX_WAVES = 4;

type Drop = {
  col: number;
  x: number;
  y: number; // linha da cabeça, fracionária
  speed: number; // linhas por segundo
  len: number; // tamanho do rastro
  wait: number; // segundos até reaparecer
};

type Wave = { x: number; y: number; age: number };

const pick = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

export function GlyphRain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const wide = window.matchMedia("(width >= 64rem)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Uma grade só de caracteres pra chuva e pra onda: quando as duas passam
    // pela mesma célula, desenham a mesma letra e o encontro só acende, em
    // vez de empilhar dois glyphs diferentes no mesmo lugar.
    let field: string[] = [];
    let drops: Drop[] = [];
    const waves: Wave[] = [];
    let cols = 0;
    let rows = 0;
    let clear = 0;
    let width = 0;
    let height = 0;
    let raf = 0;
    let last = 0;
    let tail = "";
    let head = "";
    let alpha = 0.15;

    // Cores vêm do CSS pra acompanhar o tema sem duplicar a paleta aqui.
    const readTheme = () => {
      const s = getComputedStyle(document.documentElement);
      tail = s.getPropertyValue("--rain").trim();
      head = s.getPropertyValue("--rain-head").trim();
      alpha = parseFloat(s.getPropertyValue("--rain-alpha")) || 0.15;
    };

    const respawn = (d: Drop, initial: boolean) => {
      d.speed = 4 + Math.random() * 8;
      d.len = 6 + ((Math.random() * 18) | 0);
      // Na largada já espalha as cabeças pela tela, senão o fundo começa
      // vazio e todas as colunas descem juntas do topo.
      d.y = initial ? Math.random() * rows : -1;
      // Espera longa = poucas colunas acesas ao mesmo tempo.
      d.wait = initial ? Math.random() * 6 : 1 + Math.random() * 7;
    };

    const colX = (c: number) => c * COL_W + COL_W / 2;
    // Coluna que cairia na clareira nem é desenhada: a máscara do CSS só
    // suaviza a borda, não precisa apagar o que não foi desenhado.
    const inClearing = (x: number) => Math.abs(x - width / 2) < clear;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(width / COL_W);
      rows = Math.ceil(height / ROW_H) + 1;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      clear = CLEAR_HALF_REM * rem;
      field = Array.from({ length: cols * rows }, pick);
      drops = [];
      for (let c = 0; c < cols; c++) {
        const x = colX(c);
        if (inClearing(x)) continue;
        const d: Drop = { col: c, x, y: 0, speed: 0, len: 0, wait: 0 };
        respawn(d, true);
        drops.push(d);
      }
    };

    const drawRain = (step: number) => {
      for (const d of drops) {
        if (d.wait > 0) {
          d.wait -= step;
          continue;
        }
        const base = d.col * rows;
        const before = Math.floor(d.y);
        d.y += d.speed * step;
        const top = Math.floor(d.y);
        if (top - d.len > rows) {
          respawn(d, false);
          continue;
        }
        // Linha nova da cabeça ganha caractere novo: é o "digitando" descendo.
        for (let r = before + 1; r <= top; r++) {
          if (r >= 0 && r < rows) field[base + r] = pick();
        }

        for (let k = 0; k < d.len; k++) {
          const r = top - k;
          if (r < 0 || r >= rows) continue;
          // O embaralhado: de vez em quando um caractere do rastro troca.
          if (Math.random() < 0.04) field[base + r] = pick();
          if (k === 0) {
            ctx.fillStyle = head;
            ctx.globalAlpha = Math.min(1, alpha * 2);
          } else {
            ctx.fillStyle = tail;
            ctx.globalAlpha = alpha * (1 - k / d.len) ** 1.5;
          }
          ctx.fillText(field[base + r], d.x, r * ROW_H);
        }
      }
    };

    const drawWaves = (step: number) => {
      for (const w of waves) w.age += step;
      while (waves.length && waves[0].age > WAVE_LIFE) waves.shift();
      if (!waves.length) return;

      const peak = Math.min(1, alpha * 4);
      for (let c = 0; c < cols; c++) {
        const x = colX(c);
        if (inClearing(x)) continue;
        for (let r = 0; r < rows; r++) {
          const y = r * ROW_H + ROW_H / 2;
          // De várias ondas sobre a célula, vale a mais acesa.
          let glow = 0;
          let front = false;
          for (const w of waves) {
            const behind = w.age * WAVE_SPEED - Math.hypot(x - w.x, y - w.y);
            if (behind < 0) continue;
            const g = Math.exp(-behind / WAVE_TRAIL) * (1 - w.age / WAVE_LIFE);
            if (g > glow) {
              glow = g;
              front = behind < ROW_H * 1.5;
            }
          }
          if (glow < 0.02) continue;
          const i = c * rows + r;
          // Embaralha mais que a chuva: a onda é o momento "bug".
          if (Math.random() < 0.2) field[i] = pick();
          ctx.fillStyle = front ? head : tail;
          ctx.globalAlpha = peak * glow;
          ctx.fillText(field[i], x, r * ROW_H);
        }
      }
    };

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const dt = (t - last) / 1000;
      if (dt < FRAME_S) return;
      last = t;
      // Volta de aba escondida: não deixa as colunas darem um salto.
      const step = Math.min(dt, 0.1);

      ctx.clearRect(0, 0, width, height);
      ctx.font = `${FONT_PX}px ${getComputedStyle(document.body).fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      drawRain(step);
      drawWaves(step);
      ctx.globalAlpha = 1;
    };

    const start = () => {
      if (raf) return;
      readTheme();
      resize();
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      waves.length = 0;
      ctx.clearRect(0, 0, width, height);
    };

    const sync = () => (wide.matches && !calm.matches ? start() : stop());

    const onResize = () => {
      if (raf) resize();
    };

    // O canvas é fixo, então as coordenadas do clique já são as da tela.
    const onPointerDown = (e: PointerEvent) => {
      if (!raf || e.button !== 0) return;
      waves.push({ x: e.clientX, y: e.clientY, age: 0 });
      if (waves.length > MAX_WAVES) waves.shift();
    };

    // O tema é trocado direto no `data-theme` do <html>, fora do React.
    const themeObserver = new MutationObserver(readTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    wide.addEventListener("change", sync);
    calm.addEventListener("change", sync);
    window.addEventListener("resize", onResize);
    window.addEventListener("pointerdown", onPointerDown);
    sync();

    return () => {
      stop();
      themeObserver.disconnect();
      wide.removeEventListener("change", sync);
      calm.removeEventListener("change", sync);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return <canvas ref={ref} className="glyph-rain" aria-hidden="true" />;
}

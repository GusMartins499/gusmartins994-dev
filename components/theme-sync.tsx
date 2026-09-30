"use client";

import { useEffect, useLayoutEffect } from "react";
import { restoreTheme } from "@/lib/theme";

// O React trata <html>, <head> e <body> como singletons: ao montar um novo
// `<html>` ele reaproveita o elemento existente e REMOVE todos os atributos
// antes de escrever os que vieram das props (`acquireSingletonInstance`, no
// react-dom). Trocar de idioma muda o segmento `[locale]`, o que remonta este
// layout — então o `data-theme` que o `theme-script` e o toggle deixaram no
// DOM é apagado no caminho, e a página cai no tema padrão do CSS (escuro).
//
// Este componente vive dentro do layout, logo remonta junto: o efeito de
// layout roda no mesmo commit, depois da mutação e antes da pintura, e repõe
// o atributo sem que dê tempo de piscar.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function ThemeSync() {
  useIsomorphicLayoutEffect(() => {
    restoreTheme();
  });

  return null;
}

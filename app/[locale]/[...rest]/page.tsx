import { notFound } from "next/navigation";

/**
 * Url sem rota dentro de um locale (`/pt/qualquer/coisa`).
 *
 * Sem isto ela nunca chega ao app/[locale]/not-found.tsx: url que não casa
 * com nenhuma rota cai no not-found da RAIZ, e a raiz aqui não tem <html>
 * (ele mora no layout do locale), então o Next servia a 404 padrão dele.
 * Casando a url e chamando notFound() dentro do segmento, a 404 do locale
 * assume — com header, footer, idioma e tema.
 *
 * Também pega slug de note fora do generateStaticParams: com
 * `dynamicParams = false` o [slug] recusa a url e ela segue para cá.
 */
export default function CatchAll() {
  notFound();
}

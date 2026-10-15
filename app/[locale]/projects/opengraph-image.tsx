// O `openGraph` desta página substitui o do layout por inteiro (o merge de
// metadata é raso) e levava junto a imagem herdada do [locale]. Declarar a
// imagem no próprio segmento devolve a capa do perfil ao link compartilhado.
export { default, alt, size, contentType } from "../opengraph-image";

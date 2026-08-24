import Image from "next/image";
import type { StaticImageData } from "next/image";

// Figura de post: usa next/image com import() dinâmico. Como a imagem é
// estática (bundled), o Next extrai width/height/blurDataURL sozinho —
// blur-up de graça e zero layout shift. Arquivos ficam em
// content/notes/images/ (fora de public/, pra passar pela otimização).
//
// Uso no MDX:  <Fig src="bench-memoria.png" alt="..." caption="..." />
//
// Se o arquivo ainda não existe, renderiza um placeholder discreto em vez
// de quebrar o build — assim dá pra escrever o post antes de subir a arte.

export async function Fig({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  let img: StaticImageData | null = null;
  try {
    img = (await import(`@/content/notes/images/${src}`)).default;
  } catch {
    img = null;
  }

  return (
    <figure className="my-6">
      {img ? (
        <Image
          src={img}
          alt={alt}
          placeholder="blur"
          sizes="(max-width: 768px) 100vw, 42rem"
          className="h-auto w-full rounded-box border border-base-300"
        />
      ) : (
        <div className="flex h-48 items-center justify-center rounded-box border border-dashed border-base-300 bg-base-200 text-sm text-faint">
          imagem pendente: {src}
        </div>
      )}
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-faint">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

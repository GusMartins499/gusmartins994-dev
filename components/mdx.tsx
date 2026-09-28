import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";
import Link from "next/link";
import { Fig } from "@/components/fig";
import { HeadingAnchor } from "@/components/heading-anchor";
import { slugify } from "@/lib/notes";
import type { Dictionary } from "@/i18n/dictionaries";

// Componentes usados para renderizar o markdown dos notes, já estilizados
// com a paleta e a JetBrains Mono. Hierarquia de headings começa em h2
// (o h1 da página é o título do post).

/** Texto puro de um nó do MDX, para derivar o id do heading. */
function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (typeof node === "object" && "props" in node) {
    return textOf((node.props as { children?: ReactNode }).children);
  }
  return "";
}

/**
 * Os rótulos do link de seção precisam do dicionário, então os componentes
 * são montados por locale em vez de serem um objeto solto no módulo.
 */
export function getMdxComponents(dict: Dictionary): MDXComponents {
  function heading(level: 2 | 3) {
    const Tag = level === 2 ? "h2" : "h3";
    const className =
      level === 2
        ? "group mt-10 mb-3 text-xl font-medium text-primary"
        : "group mt-8 mb-2 text-lg font-medium text-base-content";

    return function Heading({ children }: { children?: ReactNode }) {
      const id = slugify(textOf(children));
      return (
        <Tag id={id} className={className}>
          {children}
          <HeadingAnchor
            id={id}
            label={dict.notes.copyLink}
            copiedLabel={dict.notes.copied}
          />
        </Tag>
      );
    };
  }

  return {
    h2: heading(2),
    h3: heading(3),
    p: (props) => (
      <p className="my-4 leading-relaxed text-base-content" {...props} />
    ),
    a: ({ href = "#", ...props }) => {
      const external = /^https?:\/\//.test(href);
      return external ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-4 hover:opacity-80"
          {...props}
        />
      ) : (
        <Link
          href={href}
          className="text-primary underline underline-offset-4 hover:opacity-80"
          {...props}
        />
      );
    },
    ul: (props) => (
      <ul
        className="my-4 list-disc pl-6 space-y-1 text-base-content"
        {...props}
      />
    ),
    ol: (props) => (
      <ol
        className="my-4 list-decimal pl-6 space-y-1 text-base-content"
        {...props}
      />
    ),
    blockquote: (props) => (
      <blockquote
        className="my-5 border-l-2 border-primary pl-4 text-muted"
        {...props}
      />
    ),
    code: (props) => (
      <code
        className="rounded bg-base-200 px-1.5 py-0.5 text-sm text-secondary"
        {...props}
      />
    ),
    pre: (props) => (
      <pre
        className="my-5 overflow-x-auto rounded-box border border-base-300 bg-base-200 p-4 text-sm"
        {...props}
      />
    ),
    hr: () => <hr className="my-8 border-base-300" />,
    // Componente pra imagens otimizadas (next/image) usado direto no MDX.
    Fig,
  };
}

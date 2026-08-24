import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { Fig } from "@/components/fig";

// Componentes usados para renderizar o markdown dos notes, já estilizados
// com a paleta e a JetBrains Mono. Hierarquia de headings começa em h2
// (o h1 da página é o título do post).

export const mdxComponents: MDXComponents = {
  h2: (props) => (
    <h2 className="mt-10 mb-3 text-xl font-medium text-primary" {...props} />
  ),
  h3: (props) => (
    <h3 className="mt-8 mb-2 text-lg font-medium text-base-content" {...props} />
  ),
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
    <ul className="my-4 list-disc pl-6 space-y-1 text-base-content" {...props} />
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

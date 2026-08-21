import type { ReactNode } from "react";

// Cabeçalho de seção com cara de terminal: "## projetos".
// `as` permite manter a hierarquia correta de headings (h1/h2...).
export function SectionHeading({
  children,
  as: Tag = "h2",
  id,
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  id?: string;
}) {
  return (
    <Tag id={id} className="mb-5 text-lg font-medium text-primary">
      <span aria-hidden="true" className="text-muted">
        ##{" "}
      </span>
      {children}
    </Tag>
  );
}

import type { ReactNode } from "react";

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
    <Tag id={id} className="mb-5 text-xl font-medium text-primary">
      <span aria-hidden="true" className="text-muted">
        ##{" "}
      </span>
      {children}
    </Tag>
  );
}

import type { ReactNode } from "react";

/**
 * Token de tecnologia. Um único estilo para stack da home e stack dos
 * projetos — antes eram dois (pílula neutra e pílula vermelha), o que fazia
 * a mesma informação parecer duas coisas diferentes.
 */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-field border border-base-300 bg-base-100 px-2 py-0.5 text-xs text-muted">
      {children}
    </li>
  );
}

export function TagList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Tag key={item}>{item}</Tag>
      ))}
    </ul>
  );
}

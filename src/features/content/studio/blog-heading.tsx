import type { ReactNode } from "react";
import { BlogCopyButton } from "./blog-copy-button";
export function BlogHeading({
  id,
  level,
  children,
}: {
  id: string;
  level: 2 | 3 | 4;
  children: ReactNode;
}) {
  const Tag = level === 3 ? "h3" : level === 4 ? "h4" : "h2";
  return (
    <Tag id={id} className="blog-linked-heading">
      {children}
      <BlogCopyButton fragment={id} />
    </Tag>
  );
}

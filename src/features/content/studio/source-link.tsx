import type { AnchorHTMLAttributes } from "react";
export function SourceLink({
  href,
  navigate,
  children,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  navigate: (path: string) => void;
}) {
  return (
    <a
      {...props}
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
          return;
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}

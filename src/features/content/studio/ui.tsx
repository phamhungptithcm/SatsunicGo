import type { ReactNode } from "react";
export function StudioIcon({
  name,
  size = 16,
}: {
  name: string;
  size?: number;
}) {
  const paths: Record<string, ReactNode> = {
    close: <path d="m6 6 12 12M18 6 6 18" />,
    link: (
      <path d="m10 13 4-4M8 16l-2 2a4 4 0 0 1-6-6l5-5m11 1 2-2a4 4 0 0 1 6 6l-5 5" />
    ),
    code: <path d="m8 6-6 6 6 6m8-12 6 6-6 6m-2-15-4 18" />,
    grid: <path d="M3 3h18v18H3ZM3 9h18M3 15h18M9 3v18M15 3v18" />,
    list: <path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1" />,
    quote: <path d="M3 5h7v8H5v6H2v-9Zm11 0h7v8h-5v6h-3v-9Z" />,
    image: <path d="M3 3h18v18H3Zm0 14 6-6 4 4 4-3 4 5M7 7h1" />,
    history: <path d="M3 3v6h6M3 9a9 9 0 1 1 0 8M12 6v6l4 2" />,
    check: <path d="m4 12 5 5L20 5" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v6l4 2" />
      </>
    ),
    arrow: <path d="M3 12h18m-6-6 6 6-6 6" />,
    back: <path d="M21 12H3m6-6-6 6 6 6" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] ?? paths.check}
    </svg>
  );
}

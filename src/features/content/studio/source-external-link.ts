export function externalLinkProps(href: string): {
  target?: "_blank";
  rel?: string;
} {
  try {
    const u = new URL(href, window.location.origin);
    return u.origin === window.location.origin
      ? {}
      : { target: "_blank", rel: "noopener noreferrer" };
  } catch {
    return {};
  }
}

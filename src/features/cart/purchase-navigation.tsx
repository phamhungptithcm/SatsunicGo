import { createContext, useCallback, useContext, useEffect } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
  type LinkProps,
  type NavigateFunction,
  type NavigateOptions,
  type To,
} from "react-router-dom";

export function inlinePurchasePath(path: string) {
  return (
    /^\/(?:cart|request|checkout)(?:\?[^#]*)?$/.test(path) ||
    /^\/checkout\/payment\/[A-Za-z0-9_-]{1,100}(?:\?[^#]*)?$/.test(path)
  );
}
export const PurchaseNavigation = createContext<{
  path: string;
  navigate: (path: string) => void;
  onBusyChange?: (busy: boolean) => void;
} | null>(null);
export function usePurchaseBusy(busy: boolean) {
  const report = useContext(PurchaseNavigation)?.onBusyChange;
  useEffect(() => {
    report?.(busy);
    return () => report?.(false);
  }, [busy, report]);
}
export function usePurchaseNavigate(): NavigateFunction {
  const inline = useContext(PurchaseNavigation),
    navigate = useNavigate();
  return useCallback(
    ((to: To | number, options?: NavigateOptions) => {
      if (inline && typeof to === "string" && inlinePurchasePath(to))
        return inline.navigate(to);
      return typeof to === "number" ? navigate(to) : navigate(to, options);
    }) as NavigateFunction,
    [inline, navigate],
  );
}
export function usePurchaseLocation() {
  const inline = useContext(PurchaseNavigation),
    location = useLocation();
  if (!inline) return location;
  const url = new URL(inline.path, "https://local.invalid");
  return { ...location, pathname: url.pathname, search: url.search, hash: "" };
}
export function usePurchaseParams() {
  const inline = useContext(PurchaseNavigation),
    params = useParams();
  return inline
    ? { id: inline.path.match(/^\/checkout\/payment\/([A-Za-z0-9_-]+)/)?.[1] }
    : params;
}
export function usePurchaseSearchParams() {
  const location = usePurchaseLocation(),
    existing = useSearchParams();
  return [new URLSearchParams(location.search), existing[1]] as const;
}
export function PurchaseLink(props: LinkProps) {
  const inline = useContext(PurchaseNavigation);
  return (
    <Link
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        if (
          !event.defaultPrevented &&
          (!props.target || props.target === "_self") &&
          !props.reloadDocument &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          event.button === 0 &&
          inline &&
          typeof props.to === "string" &&
          inlinePurchasePath(props.to)
        ) {
          event.preventDefault();
          inline.navigate(props.to);
        }
      }}
    />
  );
}

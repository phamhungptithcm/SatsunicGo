import type { SyntheticEvent } from "react";

/** Share one code request between intent preloading and React.lazy. Failed
 * preloads release our cache; the browser may still require reload to retry
 * a failed module URL. No data loads. */
export function cacheModule<T>(load: () => Promise<T>) {
  let request: Promise<T> | undefined;
  return () => {
    request ??= load().catch((error: unknown) => {
      request = undefined;
      throw error;
    });
    return request;
  };
}

export const routeModules = {
  request: cacheModule(() => import("../features/requests/RequestForm")),
  content: cacheModule(() => import("../features/content/Content")),
  membership: cacheModule(() => import("../features/membership/Membership")),
  support: cacheModule(() => import("../features/support/Support")),
  profile: cacheModule(() => import("../features/profile/Profile")),
  security: cacheModule(() => import("../features/auth/Security")),
  documents: cacheModule(() => import("../features/invoices/Documents")),
  shipments: cacheModule(
    () => import("../features/shipping/CustomerShipments"),
  ),
  notifications: cacheModule(
    () => import("../features/notifications/Notifications"),
  ),
};

/** Only destinations actually offered by public/account navigation. */
export function routeModuleKey(pathname: string, search = "") {
  switch (pathname) {
    case "/request":
      return "request";
    case "/products":
    case "/posts":
      return "content";
    case "/membership":
      return "membership";
    case "/support":
      return "support";
    case "/account/profile":
      return "profile";
    case "/account/security":
      return "security";
    case "/account/documents":
      return "documents";
    case "/account": {
      const view = new URLSearchParams(search).get("view");
      if (view === "shipments" || view === "notifications") return view;
      return undefined;
    }
    default:
      return undefined;
  }
}

export function preloadNavigation(event: SyntheticEvent<HTMLElement>) {
  if (!(event.target instanceof Element)) return;
  const link = event.target.closest("a[href]");
  if (!link || !event.currentTarget.contains(link)) return;
  const url = new URL(link.getAttribute("href")!, window.location.href);
  if (url.origin !== window.location.origin) return;
  const key = routeModuleKey(url.pathname, url.search);
  if (key) {
    // Optional optimization: a preload failure must never become an unhandled
    // rejection or replace the destination's normal error boundary.
    void routeModules[key]().catch(() => undefined);
  }
}

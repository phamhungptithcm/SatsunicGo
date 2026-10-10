import process from "node:process";
// Test tooling is isolated from application dependencies; see the QA README.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);
const root =
  process.env.SATSUNICGO_QA_TOOLS ||
  "/private/tmp/satsunicgo-guest-adverse-tools";
const { Window } = await import(
  /* @vite-ignore */ pathToFileURL(
    require.resolve("happy-dom", { paths: [root] }),
  ).href
);
const window = new Window({ url: "http://localhost/" });
for (const key of [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLDialogElement",
  "Element",
  "Node",
  "Event",
  "MouseEvent",
  "KeyboardEvent",
  "MutationObserver",
  "getComputedStyle",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "matchMedia",
  "localStorage",
  "sessionStorage",
]) {
  const value = window[key];
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value:
      typeof value === "function" && /^[a-z]/.test(key)
        ? value.bind(window)
        : value,
  });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = globalThis.matchMedia = () => ({
  matches: true,
  addEventListener() {},
  removeEventListener() {},
});
window.HTMLElement.prototype.scrollTo = function () {};
window.HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
window.HTMLDialogElement.prototype.close = function () {
  this.open = false;
};

import { readFileSync, readdirSync } from "node:fs";
import { test, expect } from "vitest";

const config = JSON.parse(readFileSync("firebase.json", "utf8"));
const csp = config.hosting.headers
  .find((rule: { source: string }) => rule.source === "**")
  .headers.find(
    (header: { key: string }) => header.key === "Content-Security-Policy",
  ).value as string;
const directive = (name: string) =>
  csp
    .split(";")
    .map((value) => value.trim().split(/\s+/))
    .find(([key]) => key === name)
    ?.slice(1) ?? [];

test("Firebase Google popup helper is permitted by deployed script policy", () => {
  // Firebase12.19.0 loadGapi requires this before opening OAuth, not just GIS OneTap.
  const helper = new URL("https://apis.google.com/js/api.js");
  expect(directive("script-src")).toContain(helper.origin);
});
test("Google helper fix retains narrow CSP and existing isolation", () => {
  const scripts = directive("script-src");
  expect(scripts).not.toContain("'unsafe-eval'");
  expect(scripts).not.toContain("'unsafe-inline'");
  expect(scripts).not.toContain("*");
  expect(scripts).not.toContain("https:");
  expect(scripts).not.toContain("https://unrelated.example");
  expect(directive("object-src")).toEqual(["'none'"]);
  expect(directive("frame-ancestors")).toEqual(["'none'"]);
  expect(directive("base-uri")).toEqual(["'self'"]);
});

test("installed Firebase SDK still uses the allowlisted Google helper endpoint", () => {
  const dir = "node_modules/@firebase/auth/dist/esm";
  const vendor = readdirSync(dir)
    .filter((name) => /^index-.*\.js$/.test(name))
    .map((name) => readFileSync(`${dir}/${name}`, "utf8"))
    .join("\n");
  expect(vendor).toContain("https://apis.google.com/js/api.js");
  expect(vendor).toContain("function loadGapi(auth)");
});

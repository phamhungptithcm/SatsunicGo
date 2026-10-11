import { test, expect } from "@playwright/test";
import { build } from "vite";
import { fileURLToPath } from "node:url";

declare global {
  interface Window {
    residualMermaid: {
      mermaid: typeof import("mermaid").default;
      sanitizeDiagramSvg: (svg: string) => string;
    };
  }
}

let code = "";
test.beforeAll(async () => {
  const root = fileURLToPath(new URL("../..", import.meta.url));
  const sanitizer = fileURLToPath(
    new URL("../../src/features/content/studio/svg-safety.ts", import.meta.url),
  );
  const output = await build({
    configFile: false,
    root,
    logLevel: "error",
    plugins: [
      {
        name: "residual-fixture",
        resolveId: (id) =>
          id.endsWith("residual-fixture") ? "\0residual-fixture" : undefined,
        load: (id) =>
          id === "\0residual-fixture"
            ? `import mermaid from 'mermaid'; import {sanitizeDiagramSvg} from ${JSON.stringify(sanitizer)}; window.residualMermaid={mermaid,sanitizeDiagramSvg};`
            : undefined,
      },
    ],
    build: {
      write: false,
      minify: false,
      lib: {
        entry: "residual-fixture",
        name: "ResidualFixture",
        formats: ["iife"],
      },
    },
  });
  const outputs = Array.isArray(output) ? output : [output];
  code = outputs
    .flatMap((value) => {
      if (!("output" in value)) throw new Error("Unexpected watch build");
      return value.output;
    })
    .filter((value) => value.type === "chunk")
    .map((value) => value.code)
    .join("\n");
});

test("patched Mermaid/KaTeX renders math, rejects invalid syntax and keeps SVG inert", async ({
  page,
}) => {
  test.setTimeout(90000);
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.route("**/*", (route) => route.abort());
  await page.setContent(
    "<!doctype html><html><body><main id='preview'></main></body></html>",
  );
  await page.addScriptTag({ content: code });
  const result = await page.evaluate(async () => {
    const { mermaid, sanitizeDiagramSvg } = window.residualMermaid;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "neutral",
      htmlLabels: false,
      flowchart: { htmlLabels: false },
      suppressErrorRendering: true,
    });
    const { svg } = await mermaid.render(
      "residualMath",
      'flowchart LR\n A["$$x^2$$"] --> B["Done"]',
    );
    const clean = sanitizeDiagramSvg(svg);
    document.querySelector("#preview")!.innerHTML = clean;
    let invalidRejected = false;
    try {
      await mermaid.parse("not a diagram !!!");
    } catch {
      invalidRejected = true;
    }
    const hostile = sanitizeDiagramSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><foreignObject>bad</foreignObject><image href="https://invalid.example"/><path onload="alert(1)" d="M0 0L1 1"/></svg>',
    );
    return { svg, clean, hostile, invalidRejected };
  });
  expect(result.svg).toContain("<svg");
  expect(result.svg).toContain("katex");
  expect(result.clean).toContain("Done");
  expect(result.invalidRejected).toBe(true);
  expect(result.hostile).not.toMatch(/script|foreignObject|onload|https:/);
  expect(result.hostile).toContain("path");
  expect(requests).toEqual([]);
  await expect(page.locator("#preview svg")).toBeVisible();
});

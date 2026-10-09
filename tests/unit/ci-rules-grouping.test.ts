import { afterEach, expect, test, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import ts from "typescript";

const configModule = "../../vitest.ci.rules.config.mjs";
type RulesConfig = {
  test: {
    include: string[];
    exclude: string[];
    setupFiles: string[];
    passWithNoTests?: boolean;
    fileParallelism: boolean;
    testTimeout: number;
    hookTimeout: number;
  };
};
async function configFor(group: string, isolated = "true") {
  vi.stubEnv("GITHUB_ACTIONS", isolated);
  vi.stubEnv("SATSUNICGO_RULES_GROUP", group);
  vi.resetModules();
  return (await import(configModule)).default as RulesConfig;
}
afterEach(() => vi.unstubAllEnvs());

function runnerGroups() {
  const source = ts.createSourceFile(
    "test-integrations.mjs",
    readFileSync("scripts/release/test-integrations.mjs", "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const groups = source.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => [...statement.declarationList.declarations])
    .find((declaration) => declaration.name.getText(source) === "groups")
    ?.initializer;
  if (!groups || !ts.isArrayLiteralExpression(groups))
    throw Error("Missing explicit isolated rule groups");
  return groups.elements.map((tuple) => {
    if (!ts.isArrayLiteralExpression(tuple) || tuple.elements.length !== 3)
      throw Error("Unexpected rule group shape");
    const [group, port, project] = tuple.elements;
    if (
      !ts.isStringLiteral(group) ||
      !ts.isNumericLiteral(port) ||
      !ts.isStringLiteral(project)
    )
      throw Error("Rule group identity must be literal");
    return { group: group.text, port: Number(port.text), project: project.text };
  });
}

test("the actual CI groups execute every rules file exactly once", async () => {
  const files = readdirSync("tests/rules", { recursive: true })
    .filter((file) => typeof file === "string" && file.endsWith(".test.ts"))
    .map((file) => `tests/rules/${file}`);
  const executions = new Map(files.map((file) => [file, 0]));
  const groups = runnerGroups();
  expect(groups).toEqual([
    { group: "baseline", port: 8181, project: "demo-satsunicgo" },
    { group: "purchase", port: 18207, project: "demo-satsunicgo" },
    { group: "cart", port: 18207, project: "demo-satsunicgo-cart107" },
    { group: "pilot", port: 18207, project: "demo-satsunicgo-ask106-ci" },
    { group: "delivery", port: 8187, project: "demo-satsunicgo" },
  ]);
  for (const { group } of groups) {
    const { test: config } = await configFor(group);
    expect(config.passWithNoTests).not.toBe(true);
    expect(config.fileParallelism).toBe(false);
    const selected = group === "baseline"
      ? files.filter((file) => !config.exclude.includes(file))
      : config.include;
    if (group === "baseline")
      expect(config.include).toEqual(["tests/rules/**/*.test.ts"]);
    else expect(config.exclude).toEqual([]);
    expect(selected.length).toBeGreaterThan(0);
    for (const file of selected) {
      expect(executions.has(file)).toBe(true);
      executions.set(file, (executions.get(file) ?? 0) + 1);
    }
  }
  expect([...executions.values()].every((count) => count === 1)).toBe(true);
});

test("purchase runs inside the exact existing demo boundary with pre-import admission", async () => {
  expect(runnerGroups().find(({ group }) => group === "purchase")).toEqual({
    group: "purchase", port: 18207, project: "demo-satsunicgo",
  });
  const { test: purchase } = await configFor("purchase");
  expect(purchase.include).toEqual(["tests/rules/purchase-checkout.test.ts"]);
  expect(purchase.setupFiles).toEqual(["tests/helpers/demo-setup.ts"]);
  expect(purchase.testTimeout).toBe(15000);
  expect(purchase.hookTimeout).toBe(20000);
  const { test: baseline } = await configFor("baseline");
  expect(baseline.exclude).toContain("tests/rules/purchase-checkout.test.ts");
});

test.each([
  ["purchase", "false"], ["unknown", "true"], ["", "true"],
])("rules config rejects non-isolated or unknown admission %s/%s", async (group, isolated) => {
  await expect(configFor(group, isolated)).rejects.toThrow("ISOLATED_CI_RULES_GROUP_REQUIRED");
});

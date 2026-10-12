import { it as test } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Exercise the actual route prop, rather than a second copy of its policy.
const source = ts.createSourceFile(
  "App.tsx",
  readFileSync(new URL("../../src/app/App.tsx", import.meta.url), "utf8"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const expressions: string[] = [];
function visit(node: ts.Node) {
  if (
    ts.isJsxAttribute(node) &&
    node.name.getText(source) === "startCollapsed"
  ) {
    assert.ok(node.initializer && ts.isJsxExpression(node.initializer));
    assert.ok(node.initializer.expression);
    expressions.push(node.initializer.expression.getText(source));
  }
  ts.forEachChild(node, visit);
}
visit(source);
assert.equal(expressions.length, 1, "one explicit Ask route policy");
const collapse = (pathname: string) =>
  runInNewContext(
    expressions[0],
    { location: { pathname } },
    { timeout: 1000 },
  );

for (const pathname of [
  "/checkout",
  "/checkout/",
  "/checkout/payment/e281d439-eac6-4f3f-beb5-14c088ecaba4",
  "/products/book/checkout",
  "/products/book/checkout/",
  "/cart",
  "/request",
  "/account/orders/order-1",
  "/posts/guide",
]) {
  test(`Ask launcher keeps purchase controls clear: ${pathname}`, () =>
    assert.equal(collapse(pathname), true));
}
for (const pathname of [
  "/",
  "/products",
  "/products/book",
  "/products/book/checkout-info",
  "/products/book/checkout/more",
  "/checkout-info",
  "/support",
  "/fees",
]) {
  test(`Existing public composer remains available: ${pathname}`, () =>
    assert.equal(collapse(pathname), false));
}

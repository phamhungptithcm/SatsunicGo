import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

function files(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory()
      ? files(file)
      : file.endsWith(".tsx")
        ? [file]
        : [];
  });
}
function attribute(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  name: string,
) {
  return node.attributes.properties.find(
    (a): a is ts.JsxAttribute =>
      ts.isJsxAttribute(a) && a.name.getText() === name,
  );
}
function collect(root: ts.Node, predicate: (n: ts.Node) => boolean): ts.Node[] {
  const result: ts.Node[] = [];
  function visit(node: ts.Node) {
    if (predicate(node)) result.push(node);
    ts.forEachChild(node, visit);
  }
  visit(root);
  return result;
}
const controls = (node: ts.Node) =>
  collect(
    node,
    (n) =>
      (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) &&
      ["input", "select", "textarea"].includes(n.tagName.getText()),
  ) as (ts.JsxOpeningElement | ts.JsxSelfClosingElement)[];
const expression = (attr: ts.JsxAttribute) =>
  attr.initializer && ts.isJsxExpression(attr.initializer)
    ? attr.initializer.expression
    : undefined;
const canonical = (node: ts.Node) =>
  ts
    .createPrinter()
    .printNode(ts.EmitHint.Unspecified, node, node.getSourceFile())
    .replace(/\s+/g, "");
const markers = (node: ts.Node) =>
  collect(
    node,
    (n) =>
      (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) &&
      attribute(n, "className")?.initializer?.getText() === '"requiredMark"',
  );

describe("Required labels throughout the system", () => {
  it("marks wrapping and externally associated required fields, retaining conditional requirements", () => {
    const failures: string[] = [];
    for (const file of files("src")) {
      const source = ts.createSourceFile(
        file,
        fs.readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const labels = collect(
        source,
        (n) =>
          ts.isJsxElement(n) && n.openingElement.tagName.getText() === "label",
      ) as ts.JsxElement[];
      for (const control of controls(source)) {
        const required = attribute(control, "required");
        if (
          !required ||
          expression(required)?.kind === ts.SyntaxKind.FalseKeyword
        )
          continue;
        let wrapping: ts.Node | undefined = control.parent;
        while (
          wrapping &&
          !(
            ts.isJsxElement(wrapping) &&
            wrapping.openingElement.tagName.getText() === "label"
          )
        )
          wrapping = wrapping.parent;
        const id = attribute(control, "id")?.initializer?.getText();
        const label =
          wrapping ??
          labels.find(
            (l) =>
              id &&
              attribute(l.openingElement, "htmlFor")?.initializer?.getText() ===
                id,
          );
        const context = `${file}:${source.getLineAndCharacterOfPosition(control.pos).line + 1}`;
        if (!label || !markers(label).length) {
          failures.push(`${context}: missing required marker`);
          continue;
        }
        const requiredExpression = expression(required);
        if (
          requiredExpression &&
          requiredExpression.kind !== ts.SyntaxKind.TrueKeyword
        ) {
          const expected = canonical(requiredExpression);
          const matched = markers(label).some((marker) => {
            let ancestor: ts.Node | undefined = marker.parent;
            while (ancestor && ancestor !== label) {
              if (
                ts.isBinaryExpression(ancestor) &&
                ancestor.operatorToken.kind ===
                  ts.SyntaxKind.AmpersandAmpersandToken
              ) {
                let left = ancestor.left;
                while (ts.isParenthesizedExpression(left))
                  left = left.expression;
                if (canonical(left) === expected) return true;
              }
              ancestor = ancestor.parent;
            }
            return false;
          });
          if (!matched)
            failures.push(
              `${context}: conditional marker does not follow required attribute`,
            );
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("keeps marker text decorative and off optional labels", () => {
    const failures: string[] = [];
    for (const file of files("src")) {
      const source = ts.createSourceFile(
        file,
        fs.readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      for (const marker of markers(source)) {
        const node = marker as ts.JsxOpeningElement;
        if (attribute(node, "aria-hidden")?.initializer?.getText() !== '"true"')
          failures.push(
            `${file}: star must not duplicate native accessibility requirement`,
          );
        let parent: ts.Node | undefined = node.parent;
        while (
          parent &&
          !(
            ts.isJsxElement(parent) &&
            parent.openingElement.tagName.getText() === "label"
          )
        )
          parent = parent.parent;
        if (!parent) {
          // The request composer accepts either text or images; its visible label
          // describes this combined field and records its conditional requirement.
          let field: ts.Node | undefined = node.parent;
          while (
            field &&
            !(
              ts.isJsxElement(field) &&
              field.openingElement.tagName.getText() === "p"
            )
          )
            field = field.parent;
          if (
            field &&
            attribute((field as ts.JsxElement).openingElement, "data-required")
          )
            continue;
          failures.push(`${file}: marker outside label`);
          continue;
        }
        const htmlFor = attribute(
          (parent as ts.JsxElement).openingElement,
          "htmlFor",
        )?.initializer?.getText();
        const associated = controls(parent).concat(
          controls(source).filter(
            (c) =>
              htmlFor && attribute(c, "id")?.initializer?.getText() === htmlFor,
          ),
        );
        if (
          !associated.some(
            (c) => attribute(c, "required") || attribute(c, "aria-required"),
          )
        )
          failures.push(`${file}: optional label has a required marker`);
      }
    }
    expect(failures).toEqual([]);
  });
});

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

// Native named radio groups express one required selection through their legend.
function radioLegend(control: ts.JsxOpeningElement | ts.JsxSelfClosingElement) {
  if (
    control.tagName.getText() !== "input" ||
    attribute(control, "type")?.initializer?.getText() !== '"radio"'
  )
    return undefined;
  const name = attribute(control, "name")?.initializer;
  if (!name || !ts.isStringLiteral(name)) return undefined;
  let group: ts.Node | undefined = control.parent;
  while (
    group &&
    !(
      ts.isJsxElement(group) &&
      group.openingElement.tagName.getText() === "fieldset"
    )
  )
    group = group.parent;
  if (!group || !ts.isJsxElement(group)) return undefined;
  const radios = controls(group).filter(
    (row) => attribute(row, "type")?.initializer?.getText() === '"radio"',
  );
  if (
    radios.some(
      (row) =>
        attribute(row, "name")?.initializer?.getText() !== name.getText(),
    )
  )
    return undefined;
  return group.children.find(
    (child) =>
      ts.isJsxElement(child) &&
      child.openingElement.tagName.getText() === "legend",
  );
}

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
          radioLegend(control) ??
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
          const requiredGroup = controls(source).some((control) => {
            const legend = radioLegend(control),
              required = attribute(control, "required");
            return (
              legend &&
              marker.pos >= legend.pos &&
              marker.end <= legend.end &&
              required &&
              expression(required)?.kind !== ts.SyntaxKind.FalseKeyword
            );
          });
          if (requiredGroup) continue;
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

it("required radio group accepts its marked legend; other controls and mixed groups do not", () => {
  const parse = (body: string) =>
    ts.createSourceFile(
      "fixture.tsx",
      `const form=${body}`,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
  const marker = '<span className="requiredMark">*</span>';
  const group = parse(
    `<fieldset><legend>Plan ${marker}</legend><label>Free<input type="radio" name="plan" required /></label><label>Plus<input type="radio" name="plan" required /></label></fieldset>`,
  );
  expect(
    controls(group).every(
      (control) => markers(radioLegend(control)!).length === 1,
    ),
  ).toBe(true);
  for (const body of [
    `<fieldset><legend>Text ${marker}</legend><input required /></fieldset>`,
    `<fieldset><legend>Plans ${marker}</legend><input type="radio" name="one" required /><input type="radio" name="two" required /></fieldset>`,
    `<fieldset><legend>Plan</legend><input type="radio" name="plan" required /></fieldset>`,
  ]) {
    const source = parse(body);
    expect(
      controls(source).every((control) => {
        const legend = radioLegend(control);
        return !legend || markers(legend).length === 0;
      }),
    ).toBe(true);
  }
});

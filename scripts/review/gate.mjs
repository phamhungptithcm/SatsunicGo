import assert from "node:assert/strict";
import process from "node:process";
import console from "node:console";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Contract verified against alibaba/open-code-review v1.12.13 output.go/manifest.go.
export function validateReview(result, preview, base, head) {
  assert.equal(result.status, "complete", "Review did not complete");
  const m = result.manifest;
  assert.equal(m?.schema_version, "ocr.run-manifest/v1", "Unknown manifest");
  assert.equal(m.operation, "review");
  assert.equal(m.terminal_state, "complete");
  assert.equal(m.input.mode, "range");
  assert.equal(m.input.resolved_base, base, "Wrong reviewed base");
  assert.equal(m.input.resolved_head, head, "Wrong reviewed head");
  assert.ok(!m.run_failure, "Run failure");
  assert.ok(
    result.summary && !result.summary.budget_exceeded,
    "Missing summary or exhausted budget",
  );
  assert.equal(result.tool_calls?.failure, 0, "Tool failures");
  assert.equal(
    (result.warnings ?? []).length,
    0,
    "Review warnings require investigation",
  );
  assert.ok(Array.isArray(preview.files), "Missing preview");
  const expected = preview.files
    .filter((f) => f.will_review)
    .map((f) => f.path)
    .sort();
  assert.ok(
    expected.length > 0,
    "No reviewable files; requires explicit scope investigation",
  );
  const c = m.coverage;
  for (const key of ["selected", "completed", "failed", "waived", "reused"]) {
    assert.ok(Array.isArray(c?.[key]), `Missing coverage ${key}`);
  }
  for (const key of ["failed", "waived", "reused"])
    assert.equal(c[key].length, 0, `Unexpected ${key} coverage`);
  for (const key of ["selected", "completed"]) {
    const paths = c[key].map((f) => f.path).sort();
    assert.equal(new Set(paths).size, paths.length, "Duplicate coverage");
    assert.deepEqual(paths, expected, `Incomplete ${key} coverage`);
  }
  assert.equal(result.summary.files_reviewed, expected.length);
  assert.ok(Array.isArray(result.comments), "Missing findings");
  for (const finding of result.comments) {
    assert.ok(
      ["critical", "high", "medium", "low"].includes(finding.severity),
      "Unclassified finding",
    );
    assert.ok(
      !["critical", "high"].includes(finding.severity),
      "High/critical finding blocks release",
    );
  }
  return {
    reviewedFiles: expected.length,
    excludedFiles: preview.files.length - expected.length,
    findings: result.comments.length,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const [result, preview, base, head] = process.argv.slice(2);
    const summary = validateReview(
      JSON.parse(readFileSync(result, "utf8")),
      JSON.parse(readFileSync(preview, "utf8")),
      base,
      head,
    );
    console.log(
      `Deep review PASS: ${summary.reviewedFiles} files, ${summary.findings} findings; ${summary.excludedFiles} excluded paths listed in preview artifact.`,
    );
  } catch {
    console.error(
      "Deep review BLOCKED: incomplete/invalid review, provider failure, or blocking finding. Inspect review artifacts.",
    );
    process.exitCode = 1;
  }
}

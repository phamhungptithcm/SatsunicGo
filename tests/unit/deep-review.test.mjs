import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, URL } from "node:url";
import { validateReview } from "../../scripts/review/gate.mjs";
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const base = "a".repeat(40),
  head = "b".repeat(40);
const preview = { files: [{ path: "src/a.ts", will_review: true }] };
function valid() {
  return {
    status: "complete",
    summary: { files_reviewed: 1 },
    tool_calls: { failure: 0 },
    comments: [],
    manifest: {
      schema_version: "ocr.run-manifest/v1",
      operation: "review",
      terminal_state: "complete",
      input: { mode: "range", resolved_base: base, resolved_head: head },
      coverage: {
        selected: [{ path: "src/a.ts" }],
        completed: [{ path: "src/a.ts" }],
        failed: [],
        reused: [],
        waived: [],
      },
    },
  };
}
test("complete exact-SHA coverage passes; medium/low findings remain visible", () => {
  const r = valid();
  r.comments = [{ severity: "medium" }, { severity: "low" }];
  assert.equal(validateReview(r, preview, base, head).findings, 2);
});
const cases = {
  partial: (r) => {
    r.status = "partial";
  },
  "unknown schema": (r) => {
    r.manifest.schema_version = "future";
  },
  "wrong commit": (r) => {
    r.manifest.input.resolved_head = base;
  },
  "wrong base": (r) => {
    r.manifest.input.resolved_base = head;
  },
  budget: (r) => {
    r.summary.budget_exceeded = true;
  },
  timeout: (r) => {
    r.manifest.coverage.failed = [{ classification: "timeout" }];
  },
  waived: (r) => {
    r.manifest.coverage.waived = [{ path: "src/a.ts" }];
  },
  reused: (r) => {
    r.manifest.coverage.reused = [{ path: "src/a.ts" }];
  },
  "missing file": (r) => {
    r.manifest.coverage.completed = [];
  },
  duplicate: (r) => {
    r.manifest.coverage.completed.push({ path: "src/a.ts" });
  },
  "tool failure": (r) => {
    r.tool_calls.failure = 1;
  },
  warning: (r) => {
    r.warnings = [{ code: "subtask_error" }];
  },
  high: (r) => {
    r.comments = [{ severity: "high" }];
  },
  critical: (r) => {
    r.comments = [{ severity: "critical" }];
  },
  unclassified: (r) => {
    r.comments = [{}];
  },
  "missing summary": (r) => {
    delete r.summary;
  },
  "run failure": (r) => {
    r.manifest.run_failure = { classification: "provider" };
  },
};
for (const [name, mutate] of Object.entries(cases))
  test(`rejects ${name}`, () => {
    const r = valid();
    mutate(r);
    assert.throws(() => validateReview(r, preview, base, head));
  });
test("empty scope and malformed JSON shape cannot claim a clean review", () => {
  assert.throws(() => validateReview({}, preview, base, head));
  assert.throws(() => validateReview(valid(), { files: [] }, base, head));
});

test("launcher fails clearly before invoking OCR when API key is missing", () => {
  const dir = mkdtempSync(join(tmpdir(), "ocr-missing-key-"));
  try {
    const r = spawnSync("bash", ["scripts/review/run.sh"], {
      cwd: repoRoot,
      env: { PATH: "/usr/bin:/bin", RUNNER_TEMP: dir },
      encoding: "utf8",
    });
    assert.equal(r.status, 1);
    assert.match(r.stdout, /Missing repository secret GEMINI_API_KEY/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("release quality forwards only Gemini key and build cannot bypass quality", () => {
  const release = readFileSync(
    join(repoRoot, ".github/workflows/release.yml"),
    "utf8",
  );
  const ci = readFileSync(join(repoRoot, ".github/workflows/ci.yml"), "utf8");
  const deep = readFileSync(
    join(repoRoot, ".github/workflows/deep-review.yml"),
    "utf8",
  );
  assert.match(
    release,
    /quality:\s+uses: \.\/\.github\/workflows\/ci.yml\s+secrets:\s+GEMINI_API_KEY:/,
  );
  assert.match(release, /build:\s+needs: quality/);
  assert.match(
    ci,
    /deep-review:\s+uses: \.\/\.github\/workflows\/deep-review.yml/,
  );
  assert.doesNotMatch(
    deep,
    /pull_request_target|id-token:|contents: write|secrets: inherit/,
  );
  assert.match(deep, /github.event.pull_request.base.sha \|\| github.sha/);
  assert.match(deep, /satsunicgo-production-verified/);
  assert.match(deep, /git merge-base --is-ancestor/);
});

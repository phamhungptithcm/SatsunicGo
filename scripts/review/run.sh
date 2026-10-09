#!/usr/bin/env bash
set -euo pipefail
# Executed from trusted checkout; target repository is data, never npm-installed.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPORT_DIR="${RUNNER_TEMP:?}/ocr-report"
mkdir -p "$REPORT_DIR"
if [[ -z "${OCR_LLM_TOKEN:-}" ]]; then
  echo '::error::Missing repository secret GEMINI_API_KEY. See docs/releases/DEEP-REVIEW.md.'
  exit 1
fi
[[ "${REVIEW_BASE:-}" =~ ^[0-9a-f]{40}$ && "${REVIEW_HEAD:-}" =~ ^[0-9a-f]{40}$ ]] || exit 1
cd "${REVIEW_REPO:?}"
git cat-file -e "$REVIEW_BASE^{commit}"
[[ "$(git rev-parse HEAD)" == "$REVIEW_HEAD" ]] || exit 1
# Repository-supplied review settings must never silently exclude changed code.
if git cat-file -e "$REVIEW_HEAD:.opencodereview/rule.json" 2>/dev/null; then
  echo '::error::Repository OCR rules require explicit trusted integration before use.'
  exit 1
fi
export OCR_LLM_URL='https://generativelanguage.googleapis.com/v1beta/openai/'
export OCR_LLM_PROTOCOL=openai
export OCR_USE_ANTHROPIC=false
export OCR_LLM_MODEL=gemini-3.8-flash
export OCR_LLM_TIMEOUT=120
# Empty isolated home prevents loading user endpoints, MCP commands, or credentials.
OCR_HOME="$(mktemp -d "${RUNNER_TEMP}/ocr-home.XXXXXX")"
trap 'rm -rf -- "$OCR_HOME"' EXIT
export HOME="$OCR_HOME"
args=(review --from "$REVIEW_BASE" --to "$REVIEW_HEAD" --rule "$SCRIPT_DIR/rules.json" --format json --audience agent --effort high --concurrency 1 --timeout 10 --max-tokens-budget 200000)
"${OCR_BIN:?}" "${args[@]}" --preview > "$REPORT_DIR/preview.json" 2> "$REPORT_DIR/preview.stderr"
# A docs-only/binary-only range must remain visible, not become a fake AI PASS.
if ! timeout --signal=TERM --kill-after=15s 1200 "$OCR_BIN" "${args[@]}" > "$REPORT_DIR/result.json" 2> "$REPORT_DIR/review.stderr"; then
  echo '::error::OCR did not complete (provider/quota/timeout/configuration error). No automatic paid fallback.'
  exit 1
fi
node "$SCRIPT_DIR/gate.mjs" "$REPORT_DIR/result.json" "$REPORT_DIR/preview.json" "$REVIEW_BASE" "$REVIEW_HEAD" | tee -a "${GITHUB_STEP_SUMMARY:?}"

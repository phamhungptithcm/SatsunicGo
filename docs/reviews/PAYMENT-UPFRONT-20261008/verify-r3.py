"""Static evidence for a disclosed design proxy; never writes app/backend data."""
from pathlib import Path
from html.parser import HTMLParser
from datetime import datetime, timezone
import hashlib
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
HTML = ROOT / "docs/previews/SATSUNICGO-UPFRONT-PAYMENT-20261008-r3.html"
JS = ROOT / "docs/previews/payment-upfront-r3.js"
PLAN = ROOT / "docs/plans/SATSUNICGO-UPFRONT-PAYMENT-20261008-v2.md"


def write(name, data):
    (OUT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def hashed(path):
    file = ROOT / path
    data = file.read_bytes()
    return {"path": path, "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)}


class Inspect(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.refs, self.styles, self.inventory = [], [], [], []
        self.tabs = 0
        self.ignored = 0

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag in ("script", "style"):
            self.ignored += 1
        if data.get("id"):
            self.ids.append(data["id"])
        for attr in ("for", "aria-labelledby", "aria-describedby", "aria-controls"):
            if data.get(attr):
                self.refs.extend(data[attr].split())
        for attr in ("aria-label", "placeholder", "title", "alt"):
            if data.get(attr):
                self.inventory.append({"kind": attr, "text": data[attr], "element": tag, "id": data.get("id")})
        if tag == "link" and data.get("rel") == "stylesheet":
            self.styles.append(data["href"])
        if data.get("role") == "tab":
            self.tabs += 1

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.ignored -= 1

    def handle_data(self, text):
        if not self.ignored and text.strip():
            self.inventory.append({"kind": "static_text", "text": " ".join(text.split())})


content = HTML.read_text()
parser = Inspect()
parser.feed(content)
assert len(parser.ids) == len(set(parser.ids)), "duplicate IDs"
assert not set(parser.refs) - set(parser.ids), "dangling label/ARIA reference"
assert all((ROOT / p.split("?")[0].lstrip("/")).exists() for p in parser.styles)
script = re.search(r"<script>(.*?)</script>", content, re.S).group(1)
assert not re.search(r"\b(fetch|XMLHttpRequest|sendBeacon)\b", script)
assert not re.search(r"\.(innerHTML|outerHTML)\s*=", script)
subprocess.run(["node", "--check", str(JS)], check=True)
subprocess.run([str(ROOT / "node_modules/.bin/prettier"), "--check", str(HTML), str(JS)], check=True)
for match in re.finditer(r'"(?:[^"\\]|\\.)*"', JS.read_text()):
    try:
        text = json.loads(match.group())
    except json.JSONDecodeError:
        continue
    if re.search(r"[^\x00-\x7f]|\bUSD\b", text):
        parser.inventory.append({"kind": "dynamic_literal", "text": text})
write("CONTENT-INVENTORY-R3.json", {"locale": "vi-VN", "scope": "entire disclosed r3 proxy", "items": parser.inventory, "dynamic_values": ["customer-entered names/variants/notes", "Intl vi-VN money/quantity", "frozen attempt IDs and allocations"]})
write("STATIC-CHECKS-R3.json", {"status": "PASSED", "scope": "design-only", "ids": len(parser.ids), "tabs": parser.tabs, "stylesheets": parser.styles, "network_mutations": False, "unsafe_html_sinks": False, "syntax": "node --check passed", "format": "Prettier check passed", "inventory_items": len(parser.inventory)})
commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
plan_hash = hashed(str(PLAN.relative_to(ROOT)))["sha256"]
write("FINAL-REVIEW-R3.json", {
    "schema_version": 1, "task_id": "PAYMENT-UPFRONT-20261008", "design_revision": "r3", "plan_version": "v2", "commit": commit, "plan_sha256": plan_hash,
    "status": "BLOCKED", "review_type": "root self-review of disclosed proxy and implementation proposal", "latest_cycle": 8,
    "dimensions": {
        "requirement_match": {"status": "PASSED", "summary": "Retained three-stage proxy and add-to-cart, source kind, shared recipient/checkout, staff paid illustration; full app parity not implemented.", "evidence_refs": ["DESIGN-R3.md", "REPORT-R3.md"]},
        "security": {"status": "PASSED", "summary": "Design-only; synthetic values, no network mutation or dangerous HTML sink; real provider/auth/rules NOT_RUN.", "evidence_refs": ["STATIC-CHECKS-R3.json"]},
        "code_quality": {"status": "PASSED", "summary": "JS syntax/Prettier/static refs and bounded proxy; app TS/Functions tests NOT_RUN.", "evidence_refs": ["STATIC-CHECKS-R3.json"]},
        "failure_paths": {"status": "PASSED", "summary": "Proxy empty, invalid address, province reset, consent reset, subset selection, unknown lock and repeat confirmation checked; backend races NOT_RUN.", "evidence_refs": ["REPORT-R3.md"]},
        "error_handling": {"status": "PASSED", "summary": "Proxy preserves input, first invalid focus, pending resume; real async recovery NOT_RUN.", "evidence_refs": ["PRODUCT-CONTENT-R3.md"]},
        "product_language": {"status": "NOT_RUN", "summary": "Full gate BLOCKED: AT, actual 200% zoom/localization and application states incomplete.", "evidence_refs": ["PRODUCT-CONTENT-R3.md"]},
        "production_readiness": {"status": "NOT_RUN", "summary": "Protected implementation v2 pending approval; no database/provider/deploy/production proof.", "evidence_refs": ["APPROVAL-V2.md", "REPORT-R3.md"]},
        "trade_offs": {"status": "PASSED", "summary": "Proxy one-item USD/two-city directory/one pending attempt and fixed PDF samples explicitly bounded; full app contracts in v2.", "evidence_refs": ["DESIGN-R3.md"]}
    },
    "findings": [
        {"cycle": 6, "id": "R6-01", "severity": "High", "issue": "v1 separate checkout paths did not support requested unified cart", "fix": "Reviewed v2 parent checkout/allocations, retained form and source-kind delta", "status": "DESIGN_FIXED_IMPLEMENTATION_PENDING"},
        {"cycle": 6, "id": "R6-02", "severity": "High", "issue": "Proxy pending lines remained editable", "fix": "Freeze selected quantity/selection/removal, same-line addition guard and resume action", "status": "FIXED_PROXY_VERIFIED"},
        {"cycle": 7, "id": "R7-01", "severity": "Medium", "issue": "Main receipt amount differed from mixed checkout", "fix": "Frozen attempt main amount/context/table/totals, fixed PDF disclosure", "status": "FIXED_PROXY_VERIFIED"},
        {"cycle": 7, "id": "R7-02", "severity": "Low", "issue": "Recipient invalid focus/data semantics gaps", "fix": "First invalid field/aria-invalid, listing name and zero-selection shipping wording", "status": "FIXED_PROXY_VERIFIED"},
        {"cycle": 8, "id": "R8-01", "severity": "Medium", "issue": "Mobile checkout inherited vertical request rail", "fix": "Scoped horizontal checkout columns; request mobile form unchanged", "status": "FIXED_PROXY_VERIFIED"}
    ],
    "residual_risks": ["Full application implementation approval/validation missing", "Product Language Gate incomplete", "No live PayOS/Maps/PDF/email proof"],
    "limitations": ["No independent-agent approval", "No runtime-ledger CLI available", "Browser simulation is not backend mock", "Primary worktree contains concurrent unrelated WIP"]
})
(OUT / "APPROVAL-V2.md").write_text(f"""# Approval binding — v2

Task: PAYMENT-UPFRONT-20261008. Plan: v2.
Plan SHA256: `{plan_hash}`.
Source checkout: `{commit}`; current hashes in SOURCE-MANIFEST-R3.json.
Status: **PENDING**. The user requested a unified design retaining the form and sourcing flag; no approval of this newly presented v2 implementation plan has been recorded.

Scope requested: bounded application/cart union/shared recipient/checkout allocations/staff sourcing/PDF+mock changes in v2 and inherited v1 constraints. No merchant activation, real money/email, production financial change or deploy inferred.

Gate: [.ai/skills-src/change-impact-plan/SKILL.md](../../../.ai/skills-src/change-impact-plan/SKILL.md), Approval Gate: “Implementation must not begin until explicit developer approval is provided.” Current artifacts are reviewable design work before that gate.
""")
previous = json.loads((OUT / "SOURCE-MANIFEST-R2.json").read_text())
paths = [x["path"] for x in previous["sources"]] + ["packages/domain/cart.ts", "functions/src/cart.ts", "src/features/cart/Cart.tsx", "src/features/cart/cart-store.tsx", "src/features/cart/AddToCart.tsx", "functions/src/payments/payos.ts", "src/features/profile/Profile.tsx", "functions/src/workspace.ts", "src/features/ask/Commerce.tsx", "functions/src/ai/ask-workflow.ts", "packages/domain/ask-workflow.ts", "src/features/operations/Workbench.tsx"]
drift = [x["path"] for x in previous["sources"] if hashed(x["path"])["sha256"] != x["sha256"]]
artifact_paths = [str(HTML.relative_to(ROOT)), str(JS.relative_to(ROOT)), "docs/previews/build-payment-upfront-r3.py", str(PLAN.relative_to(ROOT))]
artifact_paths += [str(p.relative_to(ROOT)) for p in OUT.iterdir() if p.name.endswith("R3.md") or p.name.endswith("R3.json") and p.name != "SOURCE-MANIFEST-R3.json" or p.name in ("verify-r3.py", "APPROVAL-V2.md") or p.name.startswith("r3-") and p.suffix == ".png"]
write("SOURCE-MANIFEST-R3.json", {"task_id": "PAYMENT-UPFRONT-20261008", "designRevision": "r3", "planVersion": "v2", "planHash": plan_hash, "capturedAt": datetime.now(timezone.utc).isoformat(), "commit": commit, "intelligence": "DEGRADED - stale healthy indexes", "previousManifest": "SOURCE-MANIFEST-R2.json", "r2SourceDrift": drift, "sources": [hashed(p) for p in sorted(set(paths))], "artifacts": [hashed(p) for p in sorted(set(artifact_paths))], "applicationStatus": "NOT_IMPLEMENTED_APPROVAL_PENDING", "productionReadiness": "NOT_READY", "tokenUsage": "Unavailable", "cost": "Unavailable", "memoryCandidates": "None", "excluded_visual_evidence": ["r3-mixed-cart-mobile.png - full-page sticky capture stitching"]})
print(json.dumps({"static": "PASSED", "ids": len(parser.ids), "tabs": parser.tabs, "inventory": len(parser.inventory), "r2SourceDrift": drift, "plan": "v2", "planHash": plan_hash, "implementation": "PENDING", "finalReview": "BLOCKED"}, ensure_ascii=False))

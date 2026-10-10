"""Read-only source checks; writes review evidence only, never application data."""
from pathlib import Path
from html.parser import HTMLParser
from datetime import datetime, timezone
import hashlib
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).parent
HTML = ROOT / 'docs/previews/SATSUNICGO-UPFRONT-PAYMENT-20261008-r4.html'
JS = ROOT / 'docs/previews/payment-upfront-r4.js'
CSS = ROOT / 'docs/previews/payment-upfront-r4.css'
PLAN = ROOT / 'docs/plans/SATSUNICGO-UPFRONT-PAYMENT-20261008-v3.md'

def write(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def hashed(path):
    return {'path':path, 'sha256':hashlib.sha256((ROOT / path).read_bytes()).hexdigest()}

class Inventory(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.refs = []
        self.styles = []
        self.scripts = []
        self.texts = []
        self.attributes = []
        self.stack = []
        self.nodes = {}
        self.journey_buttons = []
        self.payment_nodes = []
        self.order = 0
        self.skip = 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self.order += 1
        if 'id' in a: self.nodes[a['id']] = {'order': self.order, 'ancestors': list(self.stack), 'attrs': a}
        if tag == 'button' and any('checkoutSteps' in x[1].get('class', '').split() for x in self.stack): self.journey_buttons.append(a)
        if tag == 'div' and self.stack and 'paymentJourney' in self.stack[-1][1].get('class', '').split(): self.payment_nodes.append(a)
        if 'id' in a: self.ids.append(a['id'])
        for k in ('aria-labelledby', 'aria-describedby', 'aria-controls', 'for'):
            if k in a: self.refs.extend(a[k].split())
        if tag == 'link' and a.get('rel') == 'stylesheet': self.styles.append(a['href'])
        if tag == 'script' and a.get('src'): self.scripts.append(a['src'])
        for k in ('aria-label', 'placeholder', 'title', 'alt'):
            if a.get(k): self.attributes.append({'tag':tag,'attribute':k,'text':a[k]})
        if tag in ('style', 'script'): self.skip += 1
        if tag not in ('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'): self.stack.append((tag,a))
    def handle_endtag(self, tag):
        if tag in ('style', 'script'): self.skip -= 1
        for i in range(len(self.stack)-1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break
    def handle_data(self, data):
        if not self.skip and data.strip(): self.texts.append(data.strip())

p = Inventory()
html, script = HTML.read_text(), JS.read_text()
p.feed(html)
assert len(p.ids) == len(set(p.ids)), 'Duplicate DOM IDs'
assert not set(p.refs) - set(p.ids), 'Unresolved accessibility references'
literal_ids = set(re.findall(r'\$\("([^"\n]+)"\)', script))
assert not literal_ids - set(p.ids), 'Script refers to absent DOM IDs'
assert 'data-checkout="0"' not in html, 'Withdrawn cart step still exposed'
assert '<section data-checkout-stage="0" hidden>' in html
assert 'id="headerCart"' in html and 'href="/cart"' in html
assert any(tag == 'aside' and 'checkoutAside' in attrs.get('class', '').split() for tag, attrs in p.nodes['shippingCard']['ancestors']), 'Shipping outside payment details'
assert any(tag == 'aside' and 'checkoutAside' in attrs.get('class', '').split() for tag, attrs in p.nodes['checkoutConsent']['ancestors']), 'Confirmation must follow prices inside summary'
assert any('checkoutReview' in attrs.get('class', '').split() for _, attrs in p.nodes['selectedCount']['ancestors']), 'Item count not in consolidated review'
assert not any(tag == 'aside' and 'checkoutAside' in attrs.get('class', '').split() for tag, attrs in p.nodes['shipRateState']['ancestors']), 'Demo controls clutter payment details'
assert p.nodes['cartTotal']['order'] < p.nodes['shippingCard']['order'] < p.nodes['checkoutConsent']['order'] < p.nodes['checkoutNext']['order'], 'Review/confirmation reading order'
assert len(p.journey_buttons) == 3, 'Incomplete checkout journey'
assert p.journey_buttons[0].get('aria-current') == 'step'
assert all('disabled' in a for a in p.journey_buttons[1:]), 'Future steps exposed before validation'
assert len(p.payment_nodes) == 3, 'Payment journey node mismatch'
assert all('isComplete' not in a.get('class', '') for a in p.payment_nodes[:2]), 'Payment review completion invented before a confirmed attempt'
assert p.payment_nodes[2].get('aria-current') == 'step', 'Payment screen current marker missing'
assert p.scripts == ['/docs/previews/payment-upfront-r4.js']
for url in p.styles + p.scripts:
    assert (ROOT / url.lstrip('/').split('?')[0]).exists(), url
assert 'import("/packages/domain/shipping-rates.ts")' in script
assert (ROOT / 'docs/previews/payment-demo-earbuds-r4.jpg').exists(), 'Missing demo thumbnail'
assert not re.search(r'\b(fetch|XMLHttpRequest|sendBeacon)\b|\.(innerHTML|outerHTML)\s*=', script)
compile((ROOT / 'docs/previews/build-payment-upfront-r4.py').read_text(), 'generator', 'exec')
subprocess.run(['node','--check', str(JS)], cwd=ROOT, check=True)
subprocess.run([str(ROOT / 'node_modules/.bin/prettier'),'--check',str(HTML),str(JS),str(CSS)], cwd=ROOT, check=True)
commit = subprocess.check_output(['git','rev-parse','HEAD'], cwd=ROOT, text=True).strip()
plan_hash = hashed(str(PLAN.relative_to(ROOT)))['sha256']
imported = (ROOT / 'packages/domain/shipping-rates.ts').read_text()
strings = lambda s: sorted(set(re.findall(r'"((?:[^"\\]|\\.)*)"',s)))
write('CONTENT-INVENTORY-R4.json', {'htmlText':p.texts,'accessibleAttributes':p.attributes,'jsLiterals':strings(script),'importedPublicTariffLiterals':strings(imported),'dynamic': 'User-input names/variants/quantities, tariff rows and Intl currency/weight compositions; browser readbacks verify displayed examples.'})
write('STATIC-CHECKS-R4.json', {'decision':'PASSED_SCOPED_PROXY','uniqueIds':len(p.ids),'literalIdsResolved':len(literal_ids),'styles':p.styles,'scripts':p.scripts,'cartStepExposed':False,'shippingInsidePaymentDetails':True,'confirmationAfterDetails':True,'confirmationInsideSummary':True,'itemCountInReview':True,'demoControlsOutsideSummary':True,'checkoutSteps':3,'futureStepsInitiallyDisabled':True,'unsafeHtmlOrNetworkMutation':False,'actualTariffModule':'packages/domain/shipping-rates.ts','syntax':'PASSED','format':'PASSED','scope':'Docs design proxy only; no app/provider/deploy evidence'})
(OUT / 'APPROVAL-V3.md').write_text(f'''# Approval binding — minimal integration v3

Plan: `docs/plans/SATSUNICGO-UPFRONT-PAYMENT-20261008-v3.md`.
SHA256: `{plan_hash}`. HEAD: `{commit}`.
Status: **PENDING**. User requested preserving existing Cart/form UI and only completing missing functions; no explicit approval of this newly bound v3 protected implementation plan recorded.

No approval inferred for replacing UI, live PayOS/Maps/mail, production financial operations or release/deployment. Older analytics commit/push approval is not this financial delta.

Approval gate: [.ai/skills-src/change-impact-plan/SKILL.md](../../../.ai/skills-src/change-impact-plan/SKILL.md): “Implementation must not begin until explicit developer approval is provided.” Reviewable docs/prototype prepared before protected edits.
''')
write('FINAL-REVIEW-R4.json', {
    'task_id':'PAYMENT-UPFRONT-20261008','commit':commit,'cycle':22,'decision':'BLOCKED','scoped_layout_checks':'PASSED_SCOPED_PROXY','reviewer':'root self-review; not independent-agent acceptance',
    'dimensions':{
        'requirements':{'status':'NOT_RUN','summary':'Minimal plan reflects latest user constraints; real integration pending approval.'},
        'security':{'status':'PASSED','summary':'Scoped proxy imports public domain only, synthetic values, no API/provider mutations; production auth validation NOT_RUN.'},
        'code_quality':{'status':'PASSED','summary':'Shared calculator, source generated HTML, IDs/imports/syntax/format checked for proxy.'},
        'failure_paths':{'status':'NOT_RUN','summary':'Browser quote-required/unavailable/invalid/unknown examples verified; real backend/offline/version/concurrency paths unimplemented.'},
        'error_handling':{'status':'PASSED','summary':'Required-field focus, saved-address clearing, address/quote consent reset, three-step progression and pending quote lock verified in proxy.'},
        'product_language':{'status':'NOT_RUN','summary':'Template/inventory/in-context evidence present; full AT/zoom/localization/application states missing.'},
        'production_readiness':{'status':'NOT_RUN','summary':'No protected implementation/backend mock/generated PDF/email/provider/deploy/activation.'},
        'trade_offs':{'status':'PASSED','summary':'Reference freight uncollected, domestic matrix absent, illustrative seed and retained application UI limitations disclosed.'}
    },
    'findings':[
        {'cycle':9,'id':'R9-01','severity':'Medium','issue':'International freight cannot be treated as province delivery tariff','status':'DESIGN_FIXED_VERIFIED','fix':'Separate warehouse/category freight and confirmation-required domestic delivery; shared calculator.'},
        {'cycle':9,'id':'R9-02','severity':'Low','issue':'Transient generator/script DOM ID mismatch during construction','status':'FIXED_SOURCE_VERIFIED','fix':'Matching cartSheet ID, static literal DOM-ID coverage; historical console records retained.'},
        {'cycle':10,'id':'R10-01','severity':'High','issue':'Earlier proposed cart redesign conflicts with latest user constraints','status':'DESIGN_WITHDRAWN_SOURCE_UNCHANGED','fix':'Added checkout only; existing cart links and minimal v3 plan.'},
        {'cycle':10,'id':'R10-02','severity':'Medium','issue':'Saved-address label stayed associated after manual province edit','status':'FIXED_PROXY_VERIFIED','fix':'Clear saved selection on manual changes, clear incompatible ward and refresh validation.'},
        {'cycle':10,'id':'R10-03','severity':'Low','issue':'Weight/unit tariff display used unlocalized decimal text','status':'FIXED_PROXY_VERIFIED','fix':'VI Intl formatting; 1,5 kg / 13,35 USD example.'},
        {'cycle':11,'id':'R11-01','severity':'Medium','issue':'Pending payment did not immediately disable quote fields','status':'FIXED_PROXY_VERIFIED','fix':'Synchronize freight during checkout rendering; fresh unknown lock readback.'},
        {'cycle':13,'id':'R13-01','severity':'Medium','issue':'Multiline source nav prevented stepper replacement during generation','status':'FIXED_PROXY_VERIFIED','fix':'Bounded multiline nav match with count assertion; 3-step source/DOM verified.'},
        {'cycle':13,'id':'R13-02','severity':'Low','issue':'Transient total placement put freight between payable label and amount','status':'FIXED_PROXY_VERIFIED','fix':'Insert after bounded cartTotal/paymentIncludes; source order and screenshot verified.'},
        {'cycle':14,'id':'R14-01','severity':'Medium','issue':'Mobile confirmation appeared before payment details and freight','status':'FIXED_PROXY_VERIFIED','fix':'Move shared confirmation/actions after payment details in DOM; fresh 390/1280 readbacks and screenshots.'},
        {'cycle':16,'id':'R16-01','severity':'Medium','issue':'Checkout disabled connectors and added a tab underline, conflicting with existing stepper pattern','status':'FIXED_PROXY_VERIFIED','fix':'30px nodes, 2px center-to-center connectors, completed checkmark and connector color; removed underline. Source comparison and 390/1280 screenshots.'},
        {'cycle':16,'id':'R16-02','severity':'Low','issue':'Payment screen used a plain text progress row, inconsistent with checkout nodes','status':'FIXED_PROXY_VERIFIED','fix':'Same node/connector pattern; prior nodes marked checked only after a confirmed simulated attempt. Browser readback and screenshot.'},
        {'cycle':17,'id':'R17-01','severity':'Low','issue':'Payment connector default selector overrode completed green segment','status':'FIXED_PROXY_VERIFIED','fix':'Match completed div selector specificity; fresh confirmed-attempt mobile screenshot verifies green segments.'},
        {'cycle':19,'id':'R19-01','severity':'Low','issue':'Inherited sectionHeading margins and consent selector retained excessive spacing after compacting','status':'FIXED_PROXY_VERIFIED','fix':'Scope header spacing/row alignment and label selector; fresh desktop/mobile screenshots.'},
        {'cycle':19,'id':'R19-02','severity':'Medium','issue':'Existing mobile secondary width could squeeze payment button in the new aside layout','status':'FIXED_PROXY_VERIFIED','fix':'Explicit auto-width back action; 320/390 button geometry and no-overflow readbacks.'}
    ],
    'review_cycles':[9,10,11,12,13,14,15,16,17,18,19,20,21,22],
    'residual_risks':['Protected implementation approval pending','Full Product Language Gate incomplete','Domestic regional prices/config missing','No application/server/provider/PDF/mail completion proof'],
    'evidence_refs':['PRODUCT-CONTENT-R4.md','REPORT-R4.md','BROWSER-CHECKS-R4.json','BROWSER-LAYOUT-R4.json','BROWSER-STEPPER-R4.json','BROWSER-COMPACT-R4.json','STATIC-CHECKS-R4.json','APPROVAL-V3.md']
})
previous = json.loads((OUT / 'SOURCE-MANIFEST-R3.json').read_text())
sources = set(x['path'] for x in previous['sources']) | {'src/features/cart/cart.css','src/shared/StepForm.tsx','src/shared/step-form.css','packages/domain/shipping-rates.ts','functions/src/shipping-rates.ts','src/features/ask/ShippingQuote.tsx','tests/unit/shipping-rates027.test.ts'}
drift = [x['path'] for x in previous['sources'] if hashed(x['path'])['sha256'] != x['sha256']]
artifacts = {str(x.relative_to(ROOT)) for x in [HTML,JS,CSS,PLAN,ROOT / 'docs/previews/build-payment-upfront-r4.py',ROOT / 'docs/previews/payment-demo-earbuds-r4.jpg']}
artifacts.update(str(x.relative_to(ROOT)) for x in OUT.iterdir() if ('R4' in x.name and x.name != 'SOURCE-MANIFEST-R4.json') or x.name in ('verify-r4.py','APPROVAL-V3.md') or x.name.startswith('r4-'))
write('SOURCE-MANIFEST-R4.json', {'task_id':'PAYMENT-UPFRONT-20261008','capturedAt':datetime.now(timezone.utc).isoformat(),'commit':commit,'planHash':plan_hash,'intelligence':'DEGRADED stale indexes; CodeGraph healthy, CocoIndex gate health failed but bounded search returned results; verified against source','r3SourceDrift':drift,'sources':[hashed(x) for x in sorted(sources)],'artifacts':[hashed(x) for x in sorted(artifacts)],'applicationStatus':'NOT_IMPLEMENTED_APPROVAL_PENDING','productionReadiness':'NOT_READY','tokenUsage':'Unavailable','cost':'Unavailable','memoryCandidates':'None'})
print(json.dumps({'static':'PASSED','ids':len(p.ids),'sourceDrift':drift,'planHash':plan_hash,'implementation':'PENDING','finalReview':'BLOCKED'}))

"""Read-only QA document consistency checker. Never runs application or provider tests."""
from pathlib import Path
import argparse, collections, csv, hashlib, json, re, sys
BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]
p = argparse.ArgumentParser()
p.add_argument('--check-source', action='store_true')
args = p.parse_args()
suite = json.loads((BASE/'SCENARIOS.json').read_text())
manifest = json.loads((BASE/'SOURCE_MANIFEST.json').read_text())
rows = suite['scenarios']
errors = []
def check(ok, message):
    if not ok: errors.append(message)
ids = [r['id'] for r in rows]
check(len(ids) == len(set(ids)), 'duplicate scenario IDs')
with (BASE/'EXECUTION.csv').open(newline='') as f: csv_rows = list(csv.DictReader(f))
check([r['id'] for r in csv_rows] == ids, 'CSV IDs/order differ from JSON')
by_id = {r['id']:r for r in csv_rows}
files = {'independent':'01-INDEPENDENT.md','integration':'02-INTEGRATION.md','security':'03-SECURITY.md','ui-ux':'04-UI-UX.md','performance':'05-PERFORMANCE.md','endpoint-contract':'06-ENDPOINT-CONTRACTS.md'}
for cat,file in files.items():
    doc = (BASE/file).read_text()
    check(re.findall(r'^### (SG-[A-Z]+-\d{3}) — ',doc,re.M) == [r['id'] for r in rows if r['category']==cat], f'{file}: ID mismatch')
for r in rows:
    for k in ['title','priority','roles','environment','preconditions','steps','expected','sources','status','oracle_status']:
        check(bool(r.get(k)),r['id']+': missing '+k)
    check(r['status']=='NOT_RUN',r['id']+': registry must remain unexecuted design')
    c = by_id.get(r['id'],{})
    check(c.get('status') in {'NOT_RUN','PASSED','FAILED','BLOCKED','NOT_APPLICABLE'},r['id']+': invalid execution status')
    if c.get('status') != 'NOT_RUN':
        for k in ['owner','actual','evidence','run_at','candidate','evidence_level']:
            check(bool(c.get(k)),r['id']+': execution missing '+k)
        if c.get('status') in {'FAILED','BLOCKED'}:
            check(bool(c.get('issue')),r['id']+': failed/blocked execution missing issue')
        if c.get('status') == 'PASSED':
            check(c.get('evidence_level') not in {'NONE','SOURCE_ONLY',''},r['id']+': PASS lacks runtime evidence level')
    for k in ['title','category','group','priority','roles','environment','preconditions','expected','oracle_status','blocked_reason']:
        check(c.get(k)==r.get(k),r['id']+': CSV mismatch '+k)
    for k in ['steps','sources','test_refs']:
        check(c.get(k)=='\n'.join(r[k]),r['id']+': CSV mismatch '+k)
    for path in r['sources']+r['test_refs']:
        check((ROOT/path).is_file(),r['id']+': missing ref '+path)
    for path in r['sources']:
        for file in [files[r['category']]]:
            check((BASE/Path('../../../'+path)).resolve()==(ROOT/path).resolve(),'link resolution '+path)
for e in suite['endpoints']:
    check(e['scenario_id'] in ids,'uncovered handler '+e['symbol'])
    check(bool(e['groups']),'unmapped handler '+e['symbol'])
    text=(ROOT/e['path']).read_text()
    check(re.search(r'export\s+const\s+'+re.escape(e['symbol'])+r'\s*=\s*'+e['protocol']+r'\s*\(',text) is not None,'handler no longer exists '+e['symbol'])
    entry = (ROOT/'functions/src/index.ts').read_text()
    exports = ['command'] + re.findall(r'\b\w+\b',' '.join(re.findall(r'export\s*\{([^}]+)\}\s*from',entry,re.S)))
    check(e['symbol'] in exports,'handler not exported by entrypoint '+e['symbol'])
for entry in manifest['sources']+manifest['tests']:
    path=ROOT/entry['path']; check(path.is_file(),'manifest missing '+entry['path'])
    if args.check_source and path.is_file():
        check(hashlib.sha256(path.read_bytes()).hexdigest()==entry['sha256'],'STALE SOURCE '+entry['path'])
for file in ['README.md','TRACEABILITY.md','07-ACTION-MATRIX.md']:
    check((BASE/file).is_file(),'missing '+file)
actions = json.loads((BASE/'ACTIONS.json').read_text())
for a in actions:
    check(bool(a['groups']),'unmapped action '+a['action'])
    check(bool(a['scenario_refs']),'action missing scenario group '+a['action'])
    check(all(i in ids for i in a['scenario_refs']),'action bad case ref '+a['action'])
    check((ROOT/a['path']).is_file(),'missing action source '+a['path'])
if errors:
    print(json.dumps({'status':'FAILED','errors':errors},ensure_ascii=False,indent=2));sys.exit(1)
print(json.dumps({'status':'PASSED','check':'QA_DOCUMENT_CONSISTENCY_ONLY','scenarios':len(rows),'categories':dict(collections.Counter(r['category'] for r in rows)),'endpoints':len(suite['endpoints']),'routes':len(suite['routes']),'action_entries':len(actions),'source_freshness':'PASSED' if args.check_source else 'NOT_CHECKED','runtime_scenarios':'NOT_RUN'},ensure_ascii=False,indent=2))

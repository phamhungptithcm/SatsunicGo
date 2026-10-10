import concurrent.futures
import datetime
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

REPO = Path('/Users/hunpeo97/Desktop/Workspace/Coder/SatsunicGo')
NODE = Path('/Users/hunpeo97/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node')
NPM = Path('/opt/homebrew/bin/npm').resolve()
FROZEN = Path('/private/tmp/satsunicgo-final-image-evidence.json')
e = json.loads(FROZEN.read_text())
snapshot = Path(e['snapshot'])
runtime = Path(e['cleanInstall']['packagedFunctions']['runtime'])
stage = Path(e['artifact']['stage'])
out = Path(tempfile.mkdtemp(prefix='satsunicgo-approved-audit-', dir='/private/tmp'))

def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()

def utc():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

def fence():
    source = json.loads(Path(e['sourceManifest']).read_text())
    artifact = json.loads((stage / 'manifest.json').read_text())
    source_drift = [p for p, h in source['hashes'].items() if not (REPO / p).is_file() or sha(REPO / p) != h]
    snapshot_drift = [p for p, h in source['hashes'].items() if not (snapshot / p).is_file() or sha(snapshot / p) != h]
    artifact_drift = [p for p, h in artifact['files'].items() if not (stage / p).is_file() or sha(stage / p) != h]
    runtime_drift = [p for p, h in artifact['files'].items() if p.startswith('deployment/functions/') and (not (runtime / p.removeprefix('deployment/functions/')).is_file() or sha(runtime / p.removeprefix('deployment/functions/')) != h)]
    r = {'sourceFiles':len(source['hashes']), 'artifactFiles':len(artifact['files']), 'runtimeFiles':sum(p.startswith('deployment/functions/') for p in artifact['files']), 'sourceDrift':source_drift, 'snapshotDrift':snapshot_drift, 'artifactDrift':artifact_drift, 'runtimeDrift':runtime_drift, 'sourceManifestSha256':sha(e['sourceManifest']), 'artifactManifestSha256':sha(stage / 'manifest.json'), 'rootLockSha256':sha(snapshot / 'package-lock.json'), 'sourceFunctionsLockSha256':sha(snapshot / 'functions/package-lock.json'), 'packagedFunctionsLockSha256':sha(runtime / 'package-lock.json'), 'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip()}
    assert not any((source_drift,snapshot_drift,artifact_drift,runtime_drift)), r
    assert r['sourceManifestSha256'] == 'd989f561a110cb55da432477b76ae24f72d45fdba8788360e940280aaebc8f07'
    assert r['artifactManifestSha256'] == 'ea1c65462b6954a47cb9d7f7cd14fc3d530b229369eb447baef41febc0ee9cb1'
    assert r['rootLockSha256'] == '750aa613461488c7ea9fc1f7d2235958e26d41cdd7326971c890b6d4b5069a95'
    assert r['sourceFunctionsLockSha256'] == '948c233785bd5d0b0ed0ead35d1be2ab7efc4bc07a45a00b76ed060c65eba32f'
    assert r['packagedFunctionsLockSha256'] == 'dfa7c9e64b0ca185edfed260e3825148b6a35f94b33f7b13a24806dab09cdf62'
    return r

before = fence()
for p in [snapshot / '.npmrc', runtime / '.npmrc']:
    assert not p.exists(), 'Unexpected project config: ' + str(p)
for name in ['empty-user-npmrc','empty-global-npmrc']:
    (out / name).write_text('')
base_env = {'PATH':str(NODE.parent)+':/usr/bin:/bin:/usr/sbin:/sbin', 'CI':'true', 'npm_config_userconfig':str(out/'empty-user-npmrc'), 'npm_config_globalconfig':str(out/'empty-global-npmrc'), 'npm_config_registry':'https://registry.npmjs.org/', 'npm_config_update_notifier':'false', 'npm_config_fund':'false', 'npm_config_ignore_scripts':'true', 'npm_config_fetch_retries':'0', 'npm_config_fetch_timeout':'45000'}
versions = {'node':subprocess.check_output([str(NODE),'--version'],env=base_env,text=True).strip(), 'npm':subprocess.check_output([str(NODE),str(NPM),'--version'],env=base_env,text=True).strip()}
receipt = {'schemaVersion':1, 'startedAt':utc(), 'status':'RUNNING', 'authorization':{'source':'direct human reply in current chat', 'questionItemId':'call_617d88d939a64f3f8ca7b36226a5b378:0', 'answer':'Cho phép audit npm', 'scope':'root and packaged Functions dependency names and versions to registry.npmjs.org; no source or secret'}, 'command':'npm audit --omit=dev --audit-level=high --json', 'registry':'https://registry.npmjs.org/', 'environment':'explicit empty inherited environment; empty user/global npm configuration; no project npmrc; separate isolated caches; no source/secret/auth values supplied; scripts disabled', 'versions':versions, 'before':before, 'historicalFrozenEvidence':{'path':str(FROZEN),'sha256':sha(FROZEN)}, 'productionReadiness':'NOT_READY', 'unchangedBlockers':['PRE-001 genuine candidate staff MFA producer-to-existing-CRM acceptance','PRE-001 custom address combobox spoken screen-reader acceptance','normal CI and postdeployment provider/live acceptance'], 'results':{}}
receipt_path = out/'AUDIT-RECEIPT.json'
receipt_path.write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'receipt':str(receipt_path),'versions':versions,'status':'RUNNING'}),flush=True)

def audit(name, directory):
    env = {**base_env, 'npm_config_cache':str(out/(name+'-cache')), 'npm_config_logs_dir':str(out/(name+'-logs'))}
    start = utc()
    report = out/(name+'-audit.json')
    stderr = out/(name+'-stderr.log')
    args = [str(NODE),str(NPM),'audit','--omit=dev','--audit-level=high','--json']
    try:
        run = subprocess.run(args,cwd=directory,env=env,capture_output=True,timeout=65)
        report.write_bytes(run.stdout)
        stderr.write_bytes(run.stderr)
        data = json.loads(run.stdout)
        vulnerabilities = data.get('vulnerabilities',{})
        counts = data.get('metadata',{}).get('vulnerabilities',{})
        unique = {}
        for package, item in vulnerabilities.items():
            for detail in item.get('via',[]):
                if isinstance(detail,dict):
                    key = detail.get('url',str(detail.get('source')))
                    unique[key] = {k:detail.get(k) for k in ['title','url','severity','range']}
        entries = [{'package':package,'severity':item.get('severity'),'isDirect':item.get('isDirect'),'fixAvailable':item.get('fixAvailable'),'nodes':item.get('nodes',[])} for package,item in vulnerabilities.items()]
        passed = run.returncode == 0 and not data.get('error') and counts.get('high') == 0 and counts.get('critical') == 0
        return name, {'status':'PASSED_AT_UNCHANGED_HIGH_THRESHOLD' if passed else 'FAILED_OR_NOT_VERIFIED', 'startedAt':start,'completedAt':utc(),'cwd':str(directory),'exitCode':run.returncode,'report':str(report),'reportSha256':sha(report),'stderr':str(stderr),'stderrSha256':sha(stderr),'metadata':data.get('metadata'),'error':data.get('error'),'affectedPackageEntryCount':len(vulnerabilities),'uniqueAdvisoryCount':len(unique),'advisories':list(unique.values()),'packageEntries':entries,'lockSha256':sha(directory/'package-lock.json')}
    except Exception as err:
        return name, {'status':'FAILED_OR_NOT_VERIFIED','startedAt':start,'completedAt':utc(),'errorType':type(err).__name__}

with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    for future in concurrent.futures.as_completed([pool.submit(audit,'root',snapshot),pool.submit(audit,'packaged-functions',runtime)]):
        name, result = future.result()
        receipt['results'][name] = result
        receipt_path.write_text(json.dumps(receipt,indent=2)+'\n')
        print(json.dumps({'name':name,'status':result['status'],'exitCode':result.get('exitCode'),'counts':result.get('metadata',{}).get('vulnerabilities'),'uniqueAdvisoryCount':result.get('uniqueAdvisoryCount')}),flush=True)
receipt['after'] = fence()
receipt['completedAt'] = utc()
receipt['status'] = 'PASSED_AT_UNCHANGED_HIGH_THRESHOLD' if all(r['status']=='PASSED_AT_UNCHANGED_HIGH_THRESHOLD' for r in receipt['results'].values()) else 'FAILED_OR_NOT_VERIFIED'
receipt['noSourceOrArtifactDrift'] = receipt['before'] == receipt['after']
assert receipt['noSourceOrArtifactDrift']
receipt_path.write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'receipt':str(receipt_path),'receiptSha256':sha(receipt_path),'status':receipt['status'],'productionReadiness':receipt['productionReadiness'],'noSourceOrArtifactDrift':True}),flush=True)

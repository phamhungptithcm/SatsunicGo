import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, verify } from './artifact.mjs';
import { SEMVER } from './release.mjs';

export function assetDecision(existingDigest, localDigest) {
  if (!/^[a-f0-9]{64}$/.test(localDigest)) throw Error('INVALID_ASSET_DIGEST');
  if (existingDigest === undefined) return 'upload';
  if (existingDigest !== localDigest) throw Error('IMMUTABLE_RELEASE_ASSET_CONFLICT');
  return 'reuse';
}
export function storeAssets(tag, paths) {
  if (!SEMVER.test(tag)) throw Error('INVALID_ASSET_TAG');
  const release = JSON.parse(execFileSync('gh', ['release', 'view', tag, '--json', 'assets,isDraft'], { encoding: 'utf8', timeout: 60_000 }));
  if (!release.isDraft) throw Error('PUBLISHED_RELEASE_IS_IMMUTABLE');
  const directory = mkdtempSync(join(tmpdir(), 'release-assets-'));
  try {
    for (const file of paths) {
      const name = basename(file), existing = release.assets.find(a => a.name === name);
      let remoteHash;
      if (existing) {
        execFileSync('gh', ['release', 'download', tag, '--pattern', name, '--dir', directory], { timeout: 120_000, stdio: 'pipe' });
        remoteHash = digest(readFileSync(join(directory, name)));
      }
      if (assetDecision(remoteHash, digest(readFileSync(file))) === 'upload') {
        execFileSync('gh', ['release', 'upload', tag, file], { timeout: 120_000, stdio: 'pipe' });
      }
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const tag = process.env.RELEASE_TAG;
  const manifest = verify(resolve('release-stage'), process.env.GITHUB_SHA, tag);
  if (process.argv[2] === 'candidate') {
    const checksum = readFileSync('bundle.sha256', 'utf8').split(/\s/)[0];
    if (digest(readFileSync(`release-${tag}.tar.gz`)) !== checksum) throw Error('BUNDLE_CHECKSUM_MISMATCH');
    storeAssets(tag, [`release-${tag}.tar.gz`, 'bundle.sha256', 'release-stage/manifest.json']);
  } else if (process.argv[2] === 'receipt') {
    const receipt = JSON.parse(readFileSync('deployment.json', 'utf8'));
    if (receipt.status !== 'VERIFIED' || receipt.tag !== manifest.tag || receipt.sha !== manifest.sha) throw Error('INVALID_DEPLOYMENT_RECEIPT');
    if (!/^\d+$/.test(process.env.GITHUB_RUN_ID ?? '') || !/^\d+$/.test(process.env.GITHUB_RUN_ATTEMPT ?? '')) throw Error('INVALID_RUN_IDENTITY');
    const target = `deployment-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}.json`;
    cpSync('deployment.json', target);
    storeAssets(tag, [target]);
  } else throw Error('INVALID_ASSET_OPERATION');
}

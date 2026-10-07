import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { appendFileSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SEMVER = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
export const SHA = /^[a-f0-9]{40}$/;
export function validateDeployIdentity(provider, serviceAccount) {
  if (!/^projects\/278913913091\/locations\/global\/workloadIdentityPools\/[a-z0-9-]+\/providers\/[a-z0-9-]+$/.test(provider ?? '') ||
      !/^[a-z][a-z0-9-]*@satsunicgo\.iam\.gserviceaccount\.com$/.test(serviceAccount ?? '')) throw Error('INVALID_PRODUCTION_AUTH_CONFIGURATION');
}
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', timeout: 30_000 }).trim();
export function gh(path, body) {
  // Structured stdin avoids shell expansion of commit messages and release notes.
  return JSON.parse(execFileSync('gh', ['api', path, ...(body ? ['--method', 'POST', '--input', '-'] : [])], {
    encoding: 'utf8', timeout: 60_000, ...(body ? { input: JSON.stringify(body) } : {}),
  }));
}
export function compareVersions(a, b) {
  const left = SEMVER.exec(a), right = SEMVER.exec(b);
  if (!left || !right) throw Error('INVALID_RELEASE_TAG');
  for (let i = 1; i <= 3; i++) {
    const difference = BigInt(left[i]) - BigInt(right[i]);
    if (difference) return difference > 0n ? 1 : -1;
  }
  return 0;
}
export function nextVersion(tags, messages) {
  const base = tags.filter(t => SEMVER.test(t)).sort(compareVersions).at(-1) ?? 'v0.0.0';
  let [, major, minor, patch] = SEMVER.exec(base).map((v, i) => i ? BigInt(v) : v);
  const breaking = messages.some(m => /^[a-z]+(?:\([^\r\n]+\))?!:/m.test(m) || /^BREAKING[ -]CHANGE:\s*\S/m.test(m));
  if (breaking) { major++; minor = 0n; patch = 0n; }
  else if (messages.some(m => /^feat(?:\([^\r\n]+\))?:/m.test(m))) { minor++; patch = 0n; }
  else patch++;
  return `v${major}.${minor}.${patch}`;
}
export function chooseCandidate({ tags, sha, releases, messages }) {
  if (!SHA.test(sha)) throw Error('INVALID_SOURCE_SHA');
  const matching = tags.filter(t => SEMVER.test(t.tag) && t.sha === sha);
  if (matching.length > 1) throw Error('AMBIGUOUS_RELEASE_TAGS');
  if (matching.length) {
    const release = releases.find(r => r.tag_name === matching[0].tag);
    if (!release) return { tag: matching[0].tag, existing: true, published: false, releaseMissing: true };
    if (!release.draft && !release.body?.includes('<!-- satsunicgo-production-verified -->')) throw Error('EXISTING_RELEASE_NOT_PRODUCTION_VERIFIED');
    return { tag: matching[0].tag, existing: true, published: !release.draft, releaseId: release.id };
  }
  const tag = nextVersion([...tags.map(t => t.tag), ...releases.map(r => r.tag_name)], messages);
  return { tag, existing: false, published: false };
}
export function cleanText(value) {
  return [...String(value)].map(c => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 ? ' ' : c)
    .join('').replace(/[<>`[\]\\]/g, '').replace(/@/g, '@\u200b');
}
export function commitNotes(commits, repository) {
  const groups = new Map(['Breaking changes', 'Features', 'Fixes', 'Security', 'Performance', 'Documentation', 'Maintenance and other changes'].map(k => [k, []]));
  for (const { sha, subject, body } of commits) {
    if (!SHA.test(sha)) throw Error('INVALID_COMMIT_SHA');
    const category = /^[a-z]+(?:\([^\r\n]+\))?!:/.test(subject) || /^BREAKING[ -]CHANGE:/m.test(body)
      ? 'Breaking changes' : /^feat(?:\(|:)/.test(subject) ? 'Features'
      : /^security(?:\(|:)/.test(subject) ? 'Security' : /^fix(?:\(|:)/.test(subject) ? 'Fixes'
      : /^perf(?:\(|:)/.test(subject) ? 'Performance' : /^docs(?:\(|:)/.test(subject) ? 'Documentation' : 'Maintenance and other changes';
    groups.get(category).push(`- ${cleanText(subject)} ([${sha.slice(0, 7)}](https://github.com/${repository}/commit/${sha}))`);
    if (category === 'Breaking changes') {
      const detail = body.match(/^BREAKING[ -]CHANGE:\s*([^\n]*(?:\n(?!\n)[^\n]*)*)/m)?.[1];
      if (detail) groups.get(category).push(`  - Migration context: ${cleanText(detail)}`);
    }
  }
  return [...groups].filter(([, items]) => items.length).map(([heading, items]) => `### ${heading}\n\n${items.join('\n')}`).join('\n\n');
}
function context() {
  const repository = process.env.GITHUB_REPOSITORY, sha = process.env.GITHUB_SHA;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository ?? '') || !SHA.test(sha ?? '') || process.env.GITHUB_REF !== 'refs/heads/main') throw Error('INVALID_RELEASE_CONTEXT');
  if (git('rev-parse', 'HEAD') !== sha) throw Error('CHECKOUT_SHA_MISMATCH');
  return { repository, sha };
}
export function assertHead() {
  const { repository, sha } = context();
  if (gh(`repos/${repository}/git/ref/heads/main`).object.sha !== sha) throw Error('SUPERSEDED_MAIN_SHA');
}
function releases(repository) {
  const result = [];
  for (let page = 1; page <= 100; page++) {
    const chunk = gh(`repos/${repository}/releases?per_page=100&page=${page}`);
    result.push(...chunk);
    if (chunk.length < 100) return result;
  }
  throw Error('RELEASE_HISTORY_LIMIT');
}
function output(values) {
  if (!process.env.GITHUB_OUTPUT) throw Error('MISSING_GITHUB_OUTPUT');
  appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(values).map(([k, v]) => `${k}=${v}\n`).join(''));
}
export function recoveryArtifact(repository, candidate, required = true) {
  for (let page = 1; page <= 100; page++) {
    const response = gh(`repos/${repository}/actions/artifacts?per_page=100&page=${page}`);
    for (const artifact of response.artifacts) {
      if (!artifact.expired && artifact.name.startsWith(`release-${candidate.tag}-`) && artifact.workflow_run?.head_sha === candidate.sha && artifact.workflow_run.head_branch === 'main') {
        const run = gh(`repos/${repository}/actions/runs/${artifact.workflow_run.id}`);
        if (run.path === '.github/workflows/release.yml' && run.event === 'push' && run.head_sha === candidate.sha && Number.isSafeInteger(artifact.id) && Number.isSafeInteger(artifact.workflow_run.id)) return { id: artifact.id, runId: artifact.workflow_run.id };
      }
    }
    if (response.artifacts.length < 100) break;
  }
  if (required) throw Error('ORIGINAL_ARTIFACT_UNAVAILABLE_NO_REBUILD_ALLOWED');
  return null;
}
export function prepare() {
  assertHead();
  const { repository, sha } = context();
  const history = releases(repository);
  const tags = git('tag', '--list').split('\n').filter(t => SEMVER.test(t)).map(tag => ({ tag, sha: git('rev-list', '-n', '1', tag) }));
  // All generated releases include deploy evidence; manual releases are never silently treated as production.
  const successful = history.filter(r => !r.draft && !r.prerelease && SEMVER.test(r.tag_name) && r.body?.includes('<!-- satsunicgo-production-verified -->'));
  successful.sort((a, b) => compareVersions(a.tag_name, b.tag_name));
  const base = successful.at(-1)?.tag_name;
  if (base) git('merge-base', '--is-ancestor', base, sha);
  const raw = git('log', '--format=%H%x00%s%x00%b%x00', base ? `${base}..${sha}` : sha);
  const fields = raw ? raw.split('\0') : [], commits = [];
  for (let i = 0; i + 2 < fields.length; i += 3) commits.push({ sha: fields[i].trim(), subject: fields[i + 1], body: fields[i + 2] });
  const candidate = { ...chooseCandidate({ tags, sha, releases: history, messages: commits.map(c => `${c.subject}\n${c.body}`) }), sha, repository, previousTag: base ?? null };
  writeFileSync('candidate.json', JSON.stringify(candidate, null, 2) + '\n');
  let recovery = { id: '', runId: '' };
  if (candidate.existing && !candidate.published) {
    const assets = history.find(r => r.tag_name === candidate.tag)?.assets ?? [];
    if (!assets.some(a => a.name === `release-${candidate.tag}.tar.gz`) || !assets.some(a => a.name === 'bundle.sha256')) recovery = recoveryArtifact(repository, candidate);
  } else if (!candidate.existing) {
    // A completed build may precede tag reservation (e.g. missing WIF configuration).
    const original = recoveryArtifact(repository, candidate, false);
    if (original) { recovery = original; candidate.existing = true; }
  }
  output({ tag: candidate.tag, existing: candidate.existing, published: candidate.published, 'recovery-artifact-id': recovery.id, 'recovery-run-id': recovery.runId });
  if (candidate.existing) return;
  const generated = gh(`repos/${repository}/releases/generate-notes`, { tag_name: candidate.tag, target_commitish: sha, ...(base ? { previous_tag_name: base } : {}), configuration_file_path: '.github/release.yml' });
  const comparison = base ? `https://github.com/${repository}/compare/${base}...${candidate.tag}` : `https://github.com/${repository}/commits/${sha}`;
  writeFileSync('release-notes.md', `# SatsunicGo ${candidate.tag}\n\nProduction candidate for commit \`${sha}\`.\n\n## Changes\n\n${commitNotes(commits, repository)}\n\n## Pull requests and contributors\n\n${generated.body}\n\n## Validation and build identity\n\nAll required CI quality gates passed before the production build. Hosting and Functions are promoted from the attached checksum-verified artifact. No database rules/indexes or business-data migrations are included in this automated deployment.\n\n- Tag: \`${candidate.tag}\`\n- Source: \`${sha}\`\n- [Complete comparison](${comparison})\n- [Release operations and rollback](https://github.com/${repository}/blob/${sha}/docs/releases/CICD-108.md)\n\n## Deployment\n\nPending production verification. This draft must not be treated as deployed.\n`);
}
export function reserve() {
  assertHead();
  const { repository, sha } = context();
  const candidate = JSON.parse(readFileSync('candidate.json', 'utf8'));
  if (!SEMVER.test(candidate.tag) || candidate.sha !== sha || candidate.repository !== repository) throw Error('CANDIDATE_CONTEXT_MISMATCH');
  const existing = releases(repository).find(r => r.tag_name === candidate.tag);
  const ref = gh(`repos/${repository}/git/matching-refs/tags/${candidate.tag}`).find(r => r.ref === `refs/tags/${candidate.tag}`);
  if (ref && ref.object.sha !== sha) throw Error('TAG_SHA_MISMATCH');
  if (existing) {
    if (!existing.draft) throw Error('RELEASE_ALREADY_PUBLISHED');
    if (!ref) throw Error('RELEASE_TAG_MISSING');
    return;
  }
  // A 422/conflicting existing tag fails closed. Never force/move a tag.
  if (!ref) gh(`repos/${repository}/git/refs`, { ref: `refs/tags/${candidate.tag}`, sha });
  gh(`repos/${repository}/releases`, { tag_name: candidate.tag, target_commitish: sha, name: `SatsunicGo ${candidate.tag}`, draft: true, prerelease: false, body: readFileSync('release-notes.md', 'utf8') });
}
export function publish() {
  const { repository, sha } = context();
  const candidate = JSON.parse(readFileSync('candidate.json', 'utf8'));
  const receipt = JSON.parse(readFileSync('deployment.json', 'utf8'));
  if (receipt.status !== 'VERIFIED' || receipt.sha !== sha || receipt.tag !== candidate.tag) throw Error('PRODUCTION_NOT_VERIFIED');
  if (!existsSync('bundle.sha256')) throw Error('MISSING_BUNDLE_CHECKSUM');
  if (readFileSync('bundle.sha256', 'utf8').split(/\s/)[0] !== receipt.bundleSha256) throw Error('RECEIPT_BUNDLE_MISMATCH');
  const release = releases(repository).find(r => r.tag_name === candidate.tag);
  if (!release?.draft || gh(`repos/${repository}/git/ref/tags/${candidate.tag}`).object.sha !== sha) throw Error('RELEASE_IDENTITY_CHANGED');
  const body = readFileSync('release-notes.md', 'utf8').replace('Pending production verification. This draft must not be treated as deployed.',
    `<!-- satsunicgo-production-verified -->\n\nVerified production deployment to **satsunicgo**. Hosting metadata, deployed static file hashes and all ${receipt.functions.length} Functions source packages/revisions were verified.\n\n- Artifact SHA-256: \`${receipt.bundleSha256}\`\n- [Workflow evidence](https://github.com/${repository}/actions/runs/${process.env.GITHUB_RUN_ID})\n- Provider receipt: attached \`deployment-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}.json\`\n\nFunctions are built by the managed provider from the precompiled uploaded package; this evidence verifies package identity and active revisions, not live payment or authenticated business-flow acceptance.`);
  execFileSync('gh', ['api', `repos/${repository}/releases/${release.id}`, '--method', 'PATCH', '--input', '-'], {
    input: JSON.stringify({ draft: false, make_latest: 'true', body }), encoding: 'utf8', timeout: 60_000, stdio: ['pipe', 'ignore', 'pipe'],
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const operations = { prepare, 'assert-head': assertHead, reserve, publish,
    'check-auth': () => validateDeployIdentity(process.env.WIF_PROVIDER, process.env.DEPLOY_SERVICE_ACCOUNT) };
  const operation = operations[process.argv[2]];
  if (!operation) throw Error('INVALID_RELEASE_OPERATION');
  operation();
}

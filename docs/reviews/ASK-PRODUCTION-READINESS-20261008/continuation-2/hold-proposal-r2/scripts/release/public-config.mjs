/** Pure release gate: caller supplies public values; never reads files/process.env or returns them. */
export const PUBLIC_CONFIG_KEYS = Object.freeze([
  'VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_REGION',
  'VITE_RECAPTCHA_ENTERPRISE_SITE_KEY', 'VITE_USE_EMULATORS', 'VITE_BETA_RELEASE', 'VITE_GOOGLE_CLIENT_ID',
]);
const required = PUBLIC_CONFIG_KEYS.slice(0, 7);
const nonempty = value => typeof value === 'string' && value.trim() === value && value.length > 0 && !['undefined', 'null', 'true', 'false'].includes(value.toLowerCase());
const hostname = value => nonempty(value) && value.length <= 253 && value.split('.').length >= 2 && value.split('.').every(label => /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(label));
/** Domain ownership and provider registration require separate authenticated readback. */
function snapshot(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const result = Object.create(null);
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || !allowed.includes(key)) return null;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || typeof descriptor.value !== 'string') return null;
    result[key] = descriptor.value;
  }
  return Object.freeze(result);
}
export function validatePublicConfig(inputValue, optionsValue = {}) {
  let input, options;
  try { input = snapshot(inputValue, PUBLIC_CONFIG_KEYS); }
  catch { return { ok: false, codes: ['INPUT_INVALID'] }; }
  if (!input) return { ok: false, codes: ['INPUT_INVALID'] };
  try { options = snapshot(optionsValue, ['expectedAppId', 'expectedAuthDomain', 'expectedStorageBucket']); }
  catch { return { ok: false, codes: ['OPTIONS_INVALID'] }; }
  if (!options) return { ok: false, codes: ['OPTIONS_INVALID'] };
  const failures = new Set();
  for (const key of required) if (!nonempty(input[key])) failures.add(`MISSING_OR_INVALID_${key}`);
  if (input.VITE_FIREBASE_PROJECT_ID !== 'satsunicgo') failures.add('PROJECT_MISMATCH');
  if (input.VITE_FIREBASE_REGION !== 'asia-southeast1') failures.add('REGION_MISMATCH');
  for (const key of ['VITE_USE_EMULATORS', 'VITE_BETA_RELEASE']) {
    if (input[key] !== undefined && input[key] !== 'false') failures.add(key === 'VITE_USE_EMULATORS' ? 'EMULATORS_NOT_DISABLED' : 'BETA_NOT_DISABLED');
  }
  if (input.VITE_GOOGLE_CLIENT_ID !== undefined && input.VITE_GOOGLE_CLIENT_ID !== '' && !/^[a-zA-Z0-9-]+\.apps\.googleusercontent\.com$/.test(input.VITE_GOOGLE_CLIENT_ID)) failures.add('GOOGLE_CLIENT_ID_INVALID');
  const appId = /^1:(\d+):web:([a-fA-F0-9]+)$/.exec(input.VITE_FIREBASE_APP_ID ?? '');
  // Project number is supplied by verified release identity, never inferred from a project name.
  const projectNumber = '278913913091';
  if (!appId || appId[1] !== projectNumber) failures.add('APP_PROJECT_ASSOCIATION_MISMATCH');
  if (options.expectedAppId !== undefined && (!nonempty(options.expectedAppId) || input.VITE_FIREBASE_APP_ID !== options.expectedAppId)) failures.add('APP_ID_MISMATCH');
  if (!hostname(input.VITE_FIREBASE_AUTH_DOMAIN)) failures.add('AUTH_DOMAIN_INVALID');
  if (!hostname(input.VITE_FIREBASE_STORAGE_BUCKET)) failures.add('STORAGE_BUCKET_INVALID');
  // Custom hosts are supported only through an explicit release tuple; no invented owner allowlist.
  if (options.expectedAuthDomain !== undefined && (!hostname(options.expectedAuthDomain) || input.VITE_FIREBASE_AUTH_DOMAIN !== options.expectedAuthDomain)) failures.add('AUTH_DOMAIN_MISMATCH');
  if (options.expectedStorageBucket !== undefined && (!hostname(options.expectedStorageBucket) || input.VITE_FIREBASE_STORAGE_BUCKET !== options.expectedStorageBucket)) failures.add('STORAGE_BUCKET_MISMATCH');
  return { ok: failures.size === 0, codes: [...failures].sort() };
}

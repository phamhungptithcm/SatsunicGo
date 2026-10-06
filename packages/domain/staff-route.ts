export function legacyStaffTarget(pathname: string, search = "", hash = "") {
  return pathname.replace(/^\/staff(?=\/|$)/, "/crm") + search + hash;
}
export function isCrmPath(pathname: string) {
  return /^\/(?:crm|staff)(?:\/|$)/.test(pathname);
}

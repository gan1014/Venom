export function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
export function isPhone(v: string) {
  return /^[0-9+\-\s]{8,18}$/.test(v.trim());
}
export function clean(v: unknown) {
  return String(v ?? "").trim();
}
export function fail(msg: string) {
  return { ok: false as const, error: msg };
}

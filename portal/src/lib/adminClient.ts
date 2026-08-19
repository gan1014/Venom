export const ADMIN_TOKEN_KEY = "lv_admin_token";

let memoryToken = "";

function winToken(next?: string) {
  try {
    const w = window as any;
    if (typeof next === "string") w.__LV_ADMIN__ = next;
    return String(w.__LV_ADMIN__ || "");
  } catch {
    return "";
  }
}

export function saveAdminToken(token: string) {
  memoryToken = token || "";
  winToken(memoryToken);
  try {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, memoryToken);
  } catch {
    /* storage blocked */
  }
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, memoryToken);
  } catch {
    /* storage blocked */
  }
}

export function readAdminToken() {
  if (memoryToken) return memoryToken;
  memoryToken = winToken();
  if (memoryToken) return memoryToken;
  try {
    memoryToken = sessionStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem(ADMIN_TOKEN_KEY) || "";
  } catch {
    /* ignore */
  }
  return memoryToken;
}

export function clearAdminToken() {
  memoryToken = "";
  winToken("");
  try {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function adminFetch(url: string, init: RequestInit = {}, explicit?: string) {
  const token = explicit || readAdminToken();
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set("Authorization", "Bearer " + token);
    headers.set("X-LV-Token", token);
  }
  let dest = url;
  if (token && !/[?&]access=/.test(url)) {
    dest += (url.includes("?") ? "&" : "?") + "access=" + encodeURIComponent(token);
  }
  return fetch(dest, { ...init, credentials: "include", headers });
}

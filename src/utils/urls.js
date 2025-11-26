// src/utils/urls.js
export function toFileURL(u = "") {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u; // ya absoluta
  if (u.startsWith("/")) return u;       // same-origin (/files/...)
  // si llega "files/lo-que-sea" sin slash
  return `/files/${u.replace(/^\.?\/?files\/?/i, "")}`;
}

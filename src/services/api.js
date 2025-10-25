//api.js
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:3000/api" });

function getAuthUser() {
  try { return JSON.parse(localStorage.getItem("authUser") || "{}"); }
  catch { return {}; }
}
function getToken() {
  const t1 = localStorage.getItem("token");
  if (t1) return t1;
  const au = getAuthUser();
  return au?.token || "";
}

// fija el header por defecto al cargar
const boot = getToken();
if (boot) {
  api.defaults.headers.common.Authorization = `Bearer ${boot}`;
  axios.defaults.headers.common.Authorization = `Bearer ${boot}`; // redundante a propósito
  console.log("[api] defaults Authorization set");
}

api.interceptors.request.use((config) => {
  const tok = getToken();
  if (tok) config.headers.Authorization = `Bearer ${tok}`;
  console.log("[api] request:", (config.baseURL || "") + (config.url || ""), "auth:",
              !!config.headers.Authorization ? "OK" : "MISSING");
  return config;
});

export default api;

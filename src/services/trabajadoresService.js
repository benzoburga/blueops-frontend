// src/services/trabajadoresService.js
import api from "./api";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:3000/api";

function authHeaders() {
  // 1) intenta con 'token'
  const t1 = localStorage.getItem("token");
  if (t1) return { Authorization: `Bearer ${t1}` };

  // 2) fallback: usa authUser.token (así llega desde tu login)
  try {
    const au = JSON.parse(localStorage.getItem("authUser") || "{}");
    if (au?.token) return { Authorization: `Bearer ${au.token}` };
  } catch(_) {}

  return {};
}

export async function getPerfilClienteUsuario() {
  const { data } = await api.get("/cliente-usuario/perfil");
  return data; // { identificacion, nombre, apellido, ... }
}

// src/services/clienteUsuario.js
import axios from "axios";

/* === helper mínimo para leer/normalizar el token === */
function readToken() {
  try {
    const a = localStorage.getItem("authUser") || sessionStorage.getItem("authUser");
    const obj = a ? JSON.parse(a) : null;
    let t = (obj && obj.token) || localStorage.getItem("token") || null;
    if (!t) return null;
    t = String(t).trim().replace(/^bearer\s+/i, ""); // por si viniera con "bearer "
    return t;
  } catch {
    return null;
  }
}
function authHeaders() {
  const t = readToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/* === ENDPOINTS (todos con /api + headers) === */
export async function getPerfilClienteUsuario() {
    const headers = authHeaders();
  console.log("[perfil][FE] headers que envío:", headers); // <-- debug
  const { data } = await axios.get("/api/cliente-usuario/perfil", {
    headers: authHeaders(),
  });
  return data; // objeto o array, lo manejas en el componente
}

export async function fetchApartadosClienteUsuario() {
  const { data } = await axios.get("/api/apartados/cliente-usuario", {
    headers: authHeaders(),
  });
  const rows = Array.isArray(data) ? data : [];
  const mapped = rows.map((r) => ({
    id: Number(r.id ?? r.ac_id ?? r.apartado_cliente_id ?? 0),
    tipo_id: Number(r.tipo_id ?? r.tipo_apartado_id ?? r.id ?? 0),
    nombre: String(r.nombre ?? r.nombre_apartado ?? "").trim(),
  }));
  console.log("[ClienteUsuario] apartados mapeados:", mapped);
  return mapped;
}

export async function fetchArchivosAsignadosClienteUsuario(apartadoClienteId = null) {
  const url = apartadoClienteId
    ? `/api/cliente-usuario/archivos-asignados?apartado_cliente_id=${apartadoClienteId}`
    : "/api/cliente-usuario/archivos-asignados";

  const { data } = await axios.get(url, { headers: authHeaders() });
  const rows = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
  console.log("[ClienteUsuario] archivos asignados rows:", rows);
  return rows;
}

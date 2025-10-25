import api from "./api";

function mapRows(rows = []) {
  return rows.map(r => ({
    id: Number(r.id ?? r.ac_id ?? r.apartado_id ?? 0),
    tipo_id: Number(r.tipo_id ?? r.tipo_apartado_id ?? r.id ?? 0),
    nombre: String(r.nombre ?? r.nombre_apartado ?? r.ta_nombre ?? "").trim(),
  }));
}

export async function getMisApartados() {
  // 1) Intento por token (/cliente-usuario)
  const r1 = await api.get("/apartados/cliente-usuario");
  let rows = Array.isArray(r1.data) ? r1.data : [];

  // 2) Si llegó vacío, uso el cliente_id del perfil y consulto /cliente/:id
  if (!rows.length) {
    try {
      const perfil = await api.get("/cliente-usuario/perfil"); // ya lo tienes
      const cid = Number(perfil?.data?.cliente_id || perfil?.data?.cliente?.id || 0);
      if (cid) {
        const r2 = await api.get(`/apartados/cliente/${cid}`);
        rows = Array.isArray(r2.data) ? r2.data : [];
      }
    } catch (e) {
      console.warn("[SERVICE apartados] fallback por perfil falló:", e);
    }
  }

  const mapped = mapRows(rows);
  console.log("[SERVICE apartados] mapped:", mapped);
  return mapped;
}

// compat
export async function fetchApartadosClienteUsuario() {
  return getMisApartados();
}

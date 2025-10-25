const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const obtenerTiposIdentificacion = async () => {
  const res = await fetch(`${API}/api/tipos-identificacion`);
  if (!res.ok) throw new Error("Error al obtener tipos de identificación");
  return res.json(); // [{id, nombre}]
};

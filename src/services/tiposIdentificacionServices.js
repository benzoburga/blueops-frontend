export const obtenerTiposIdentificacion = async () => {
  const res = await fetch(`/api/tipos-identificacion`);
  if (!res.ok) throw new Error("Error al obtener tipos de identificación");
  return res.json(); // [{id, nombre}]
};

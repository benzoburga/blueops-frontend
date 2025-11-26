export const obtenerIndicadores = async (ruc) => {
  const res = await fetch(`/api/clientes/${encodeURIComponent(ruc)}/indicadores`);
  if (!res.ok) throw new Error("Error al obtener indicadores");
  return res.json(); // [{periodo, num_trabajadores, num_pensionistas, num_prestadores}]
};

export const guardarIndicadores = async (ruc, indicadores /* array o objeto */) => {
  const res = await fetch(`/api/clientes/${encodeURIComponent(ruc)}/indicadores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(indicadores),
  });
  if (!res.ok) throw new Error("Error al guardar indicadores");
  return res.json();
};

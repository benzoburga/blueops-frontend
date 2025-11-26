export const obtenerClientes = async () => {
  const res = await fetch(`/api/clientes`);
  if (!res.ok) throw new Error("Error listando clientes");
  return res.json(); // [{id, ruc, nombre_comercial, representante_nombre}]
};

export const obtenerClientePorRUC = async (ruc) => {
  const res = await fetch(`/api/clientes/${encodeURIComponent(ruc)}`);
  if (!res.ok) throw new Error("Error obteniendo cliente");
  return res.json(); // objeto
};

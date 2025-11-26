export const obtenerRepresentantes = async (ruc) => {
  const res = await fetch(`/api/clientes/${ruc}/representantes`);
  if (!res.ok) throw new Error("Error al listar representantes");
  return res.json();
};

export const crearRepresentante = async (ruc, data) => {
  const res = await fetch(`/api/clientes/${ruc}/representantes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear representante");
  return res.json();
};

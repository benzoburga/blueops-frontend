// src/services/clienteUsuario.js
import api from './api';

export async function fetchApartadosClienteUsuario() {
  const { data } = await api.get('/apartados/cliente-usuario');
  const rows = Array.isArray(data) ? data : [];
  const mapped = rows.map(r => ({
    id: Number(r.id ?? r.ac_id ?? r.apartado_cliente_id ?? 0),
    tipo_id: Number(r.tipo_id ?? r.tipo_apartado_id ?? r.id ?? 0),
    nombre: String(r.nombre ?? r.nombre_apartado ?? '').trim(),
  }));
  console.log('[ClienteUsuario] apartados mapeados:', mapped);
  return mapped;
}

export async function fetchArchivosAsignadosClienteUsuario(apartadoClienteId = null) {
  const url = apartadoClienteId
    ? `/cliente-usuario/archivos-asignados?apartado_cliente_id=${apartadoClienteId}`
    : '/cliente-usuario/archivos-asignados';

  const { data } = await api.get(url);
  // el backend responde array directo (paridad con admin)
  const rows = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
  console.log('[ClienteUsuario] archivos asignados rows:', rows);
  return rows;
}

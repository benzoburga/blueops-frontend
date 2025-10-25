const fmt = (d) => !d ? "" : (String(d).includes('T') ? String(d).split('T')[0] : String(d));

const ClientData = ({ cliente }) => {
  const actividades = Array.isArray(cliente.actividades) ? cliente.actividades : [];

  // etiqueta principal: si hay principal en el array, úsalo; si no, cae al legacy
  const principal = actividades.find(a => a.es_principal) || actividades[0];
  const etiquetaPrincipal = principal
    ? [
        principal.ciiu_codigo ? `Principal - ${principal.ciiu_codigo}` : 'Principal',
        principal.descripcion || ''
      ].filter(Boolean).join(' - ')
    : (cliente.actividad_economica || '');

  return (
    <div className="client-general-data">
      <label>Nombre Comercial</label>
      <div className="static-data">{cliente.nombre_comercial}</div>

      <label>RUC</label>
      <div className="static-data">{cliente.ruc}</div>

      <label>Tipo de Contribuyente</label>
      <div className="static-data">{cliente.tipo_contribuyente}</div>

      <label>Domicilio Fiscal</label>
      <div className="static-data">{cliente.domicilio_fiscal}</div>

      <label>Fecha de Inscripción</label>
      <div className="static-data">{fmt(cliente.fecha_inscripcion)}</div>

      <label>Fecha de Inicio de Actividades</label>
      <div className="static-data">{fmt(cliente.fecha_inicio_actividades)}</div>

      <label>Estado del Contribuyente</label>
      <div className="static-data">{cliente.estado_contribuyente}</div>

      <label>Condición del Contribuyente</label>
      <div className="static-data">{cliente.condicion_contribuyente}</div>

      {/* Principal (legible) */}
      <label>Actividad Económica (principal)</label>
      <div className="static-data">{etiquetaPrincipal || '—'}</div>

      <label>Sistema Contabilidad</label>
      <div className="static-data">{cliente.sistema_contabilidad}</div>

      {/* Tabla con TODAS las actividades */}
      <h4 style={{marginTop:16}}>Actividades Económicas (todas)</h4>
      <div className="static-table-wrapper">
        <table className="static-table">
          <thead>
            <tr>
              <th style={{width:140}}>CIIU</th>
              <th>Descripción</th>
              <th style={{width:120}}>Principal</th>
            </tr>
          </thead>
          <tbody>
            {actividades.length === 0 ? (
              <tr><td colSpan={3} style={{textAlign:'center', color:'#6b7280'}}>Sin actividades registradas</td></tr>
            ) : actividades.map((a) => (
              <tr key={a.id}>
                <td>{a.ciiu_codigo || '—'}</td>
                <td>{a.descripcion || '—'}</td>
                <td>{a.es_principal ? 'Sí' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientData;

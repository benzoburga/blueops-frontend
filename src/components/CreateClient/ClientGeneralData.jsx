const ClientGeneralData = ({ cliente, setCliente, catalogos }) => {
  const upd = (k, v) => setCliente(prev => ({ ...prev, [k]: v }));

  return (
    <div className="client-general-data">
      <label>Nombre Comercial</label>
      <input
        type="text"
        placeholder="Ingrese el nombre comercial"
        value={cliente.nombre_comercial}
        onChange={e => upd('nombre_comercial', e.target.value)}
      />

       <label>Tipo de Contribuyente</label>
      <select
        value={cliente.tipo_contribuyente_id || ''}
        onChange={e => upd('tipo_contribuyente_id', Number(e.target.value))}
      >
        {catalogos.tipos.map(t => (
          <option key={t.id} value={t.id}>{t.nombre}</option>
        ))}
      </select>

      <label>Domicilio Fiscal</label>
      <input
        type="text"
        placeholder="Ingrese el domicilio fiscal"
        value={cliente.domicilio_fiscal}
        onChange={e => upd('domicilio_fiscal', e.target.value)}
      />

      <label>Fecha de Inscripción</label>
      <input
        type="date"
        value={cliente.fecha_inscripcion || ''}
        onChange={e => upd('fecha_inscripcion', e.target.value)}
      />

      <label>Fecha de Inicio de Actividades</label>
      <input
        type="date"
        value={cliente.fecha_inicio_actividades || ''}
        onChange={e => upd('fecha_inicio_actividades', e.target.value)}
      />

      <label>Estado del Contribuyente</label>
      <select
        value={cliente.estado_contribuyente_id || ''}
        onChange={e => upd('estado_contribuyente_id', Number(e.target.value))}
      >
        {catalogos.estados.map(o => (
          <option key={o.id} value={o.id}>{o.nombre}</option>
        ))}
      </select>

      <label>Condición del Contribuyente</label>
      <select
        value={cliente.condicion_contribuyente_id || ''}
        onChange={e => upd('condicion_contribuyente_id', Number(e.target.value))}
      >
        {catalogos.condiciones.map(o => (
          <option key={o.id} value={o.id}>{o.nombre}</option>
        ))}
      </select>

      

      <label>Sistema Contabilidad</label>
      <select
        value={cliente.sistema_contabilidad_id || ''}
        onChange={e => upd('sistema_contabilidad_id', Number(e.target.value))}
      >
        {catalogos.sistemas.map(o => (
          <option key={o.id} value={o.id}>{o.nombre}</option>
        ))}
      </select>
    </div>
  );
};

export default ClientGeneralData;

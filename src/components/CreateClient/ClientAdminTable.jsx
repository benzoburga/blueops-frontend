import React, { useState } from 'react';

const emptyRep = { tipo_documento_id: 1, numero_documento: '', nombre: '', cargo: '', fecha_desde: '' };

const ClientAdminTable = ({ representantes, setRepresentantes }) => {
  const [draft, setDraft] = useState(emptyRep);

  const addRep = () => {
    if (!draft.numero_documento || !draft.nombre) return;
    setRepresentantes(prev => [...prev, draft]);
    setDraft(emptyRep);
  };

  const rmRep = (idx) => setRepresentantes(prev => prev.filter((_, i) => i !== idx));

  const upd = (k, v) => setDraft(prev => ({ ...prev, [k]: v }));

  return (
    <div className="client-admin-table">
      <h3>Representante Legal</h3>

      <div className="inline-form">
        <select value={draft.tipo_documento_id} onChange={e => upd('tipo_documento_id', Number(e.target.value))}>
          <option value={1}>DNI</option>
          <option value={2}>CE</option>
          <option value={3}>PASAPORTE</option>
        </select>
        <input placeholder="N° Documento" value={draft.numero_documento} onChange={e => upd('numero_documento', e.target.value)} />
        <input placeholder="Nombre" value={draft.nombre} onChange={e => upd('nombre', e.target.value)} />
        <input placeholder="Cargo" value={draft.cargo} onChange={e => upd('cargo', e.target.value)} />
        <input type="date" value={draft.fecha_desde} onChange={e => upd('fecha_desde', e.target.value)} />
        <button onClick={addRep}>Añadir</button>
      </div>

      <table>
        <thead>
          <tr><th>Doc</th><th>N°</th><th>Nombre</th><th>Cargo</th><th>Fecha desde</th><th></th></tr>
        </thead>
        <tbody>
          {representantes.map((r, idx) => (
            <tr key={idx}>
              <td>{r.tipo_documento_id === 1 ? 'DNI' : r.tipo_documento_id === 2 ? 'CE' : 'PAS'}</td>
              <td>{r.numero_documento}</td>
              <td>{r.nombre}</td>
              <td>{r.cargo}</td>
              <td>{r.fecha_desde}</td>
              <td><button onClick={() => rmRep(idx)}>Quitar</button></td>
            </tr>
          ))}
          {representantes.length === 0 && (
            <tr><td colSpan={6} style={{textAlign:'center'}}>Sin representantes</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ClientAdminTable;

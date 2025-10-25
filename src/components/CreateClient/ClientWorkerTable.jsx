import React, { useState } from 'react';

const emptyRow = { periodo: '', num_trabajadores: '', num_pensionistas: '', num_prestadores: '' };

const ClientWorkerTable = ({ indicadores, setIndicadores }) => {
  const [draft, setDraft] = useState(emptyRow);

  const addRow = () => {
    if (!draft.periodo) return;
    setIndicadores(prev => [...prev, draft]);
    setDraft(emptyRow);
  };

  const removeRow = (idx) => {
    setIndicadores(prev => prev.filter((_, i) => i !== idx));
  };

  const updDraft = (k, v) => setDraft(prev => ({ ...prev, [k]: v }));

  return (
    <div className="client-worker-table">
      <h3>Cantidad de Trabajadores y/o Prestadores de Servicio</h3>

      <div className="inline-form">
        <input placeholder="Periodo (YYYY-MM)" value={draft.periodo} onChange={e => updDraft('periodo', e.target.value)} />
        <input placeholder="Trabajadores" type="number" value={draft.num_trabajadores} onChange={e => updDraft('num_trabajadores', e.target.value)} />
        <input placeholder="Pensionistas" type="number" value={draft.num_pensionistas} onChange={e => updDraft('num_pensionistas', e.target.value)} />
        <input placeholder="Prestadores" type="number" value={draft.num_prestadores} onChange={e => updDraft('num_prestadores', e.target.value)} />
        <button onClick={addRow}>Añadir</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Periodo</th><th>N° Trabajadores</th><th>N° Pensionistas</th><th>N° Prestadores</th><th></th>
          </tr>
        </thead>
        <tbody>
          {indicadores.map((r, idx) => (
            <tr key={idx}>
              <td>{r.periodo}</td>
              <td>{r.num_trabajadores}</td>
              <td>{r.num_pensionistas}</td>
              <td>{r.num_prestadores}</td>
              <td><button onClick={() => removeRow(idx)}>Quitar</button></td>
            </tr>
          ))}
          {indicadores.length === 0 && (
            <tr><td colSpan={5} style={{textAlign:'center'}}>Sin registros</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ClientWorkerTable;

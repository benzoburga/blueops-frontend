// components/CreateClient/ClientActivitiesTable.jsx
import "../../styles/createclient/createclient.css";

export default function ClientActivitiesTable({ actividades, setActividades }) {
  const addRow = () => {
    setActividades(prev => [
      ...prev,
      { ciiu_codigo: "", descripcion: "", es_principal: prev.length === 0, orden: prev.length }
    ]);
  };

  const removeRow = (idx) => {
    setActividades(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (!next.some(a => a.es_principal) && next[0]) next[0].es_principal = true;
      return next;
    });
  };

  const setField = (idx, key, val) => {
    setActividades(prev => prev.map((row, i) => i === idx ? { ...row, [key]: val } : row));
  };

  const setPrincipal = (idx) => {
    setActividades(prev => prev.map((row, i) => ({ ...row, es_principal: i === idx })));
  };

  return (
    <section className="act-card">
      <header className="act-card-header">
        <h3>Actividades Económicas (CIIU)</h3>
        <button type="button" className="act-btn act-btn-primary" onClick={addRow}>
          Añadir actividad
        </button>
      </header>

      <table className="act-table">
        <thead>
          <tr>
            <th className="act-col-ciiu">CIIU</th>
            <th>Descripción</th>
            <th className="act-col-pri">Principal</th>
            <th className="act-col-act">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {actividades.length === 0 ? (
            <tr>
              <td colSpan={4} className="act-empty">Sin actividades. Usa “Añadir actividad”.</td>
            </tr>
          ) : (
            actividades.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <input
                    className="act-input"
                    value={row.ciiu_codigo || ""}
                    onChange={e=>setField(idx, "ciiu_codigo", e.target.value)}
                    placeholder="5223"
                  />
                </td>
                <td>
                  <input
                    className="act-input"
                    value={row.descripcion || ""}
                    onChange={e=>setField(idx, "descripcion", e.target.value)}
                    placeholder="ACTIVIDADES DE SERVICIOS VINCULADAS AL TRANSPORTE AÉREO"
                  />
                </td>
                <td className="act-center">
                  <input
                    type="radio"
                    name="act_principal"
                    checked={!!row.es_principal}
                    onChange={()=>setPrincipal(idx)}
                    title="Marcar como principal"
                  />
                </td>
                <td>
                  <button type="button" className="act-btn act-btn-danger" onClick={()=>removeRow(idx)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}

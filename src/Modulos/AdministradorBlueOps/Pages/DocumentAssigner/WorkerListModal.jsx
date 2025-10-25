// src/Modulos/Cliente Administrador/Components/WorkerListModal.jsx
import  { useState, useEffect } from 'react';
import axios from 'axios';
import '../../Styles/WorkerListModal.css';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const WorkerListModal = ({ clientId, selectedWorkers, setSelectedWorkers, closeModal }) => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  // Cargar trabajadores (cada uno debe traer usuario_id)
  useEffect(() => {
    const load = async () => {
      if (!clientId) return;
      try {
        setLoading(true);
        setError('');
        const { data } = await axios.get(`${API}/api/trabajadores/cliente/${clientId}`, {
          params: { q: nameFilter, riesgo: riskFilter }
        });
        // Esperamos que cada item tenga: { id (trabajador_id), nombreCompleto, puesto, riesgo, usuario_id }
        setWorkers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setError('No se pudieron cargar los trabajadores.');
        setWorkers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [clientId, nameFilter, riskFilter]);

  // Helpers selección (trabajamos con usuario_id)
  const isChecked = (w) => selectedWorkers.some(sw => sw.usuario_id === w.usuario_id);

  // Helpers selección: trabajamos con usuario_id (array de numbers)
const toggleWorker = (w) => {
  if (!w.usuario_id) return;                    // no seleccionable si no tiene usuario
  const id = Number(w.usuario_id);
  const exists = selectedWorkers.includes(id);
  setSelectedWorkers(exists
    ? selectedWorkers.filter(x => x !== id)
    : [...selectedWorkers, id]
  );
};

const selectAllWorkers = () => {
  const allUserIds = Array.from(new Set(
    workers.filter(w => !!w.usuario_id).map(w => Number(w.usuario_id))
  ));
  setSelectedWorkers(allUserIds);
};


  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2>Seleccionar trabajadores</h2>
          <button onClick={closeModal} className="close-button">&times;</button>
        </div>

        <div className="filter-bar">
          <input
            type="text"
            placeholder="Buscar por nombre"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
            <option value="">Todos los riesgos</option>
            <option value="Alto">Alto</option>
            <option value="Bajo">Bajo</option>
          </select>
          <button
            onClick={selectAllWorkers}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Seleccionar todos
          </button>
        </div>

        {error && <p className="text-red-500">{error}</p>}
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <table className="worker-table">
            <thead>
              <tr>
                <th>Nombre y Apellido</th>
                <th>Puesto de trabajo</th>
                <th>Riesgo</th>
                <th>Usuario</th>
                <th>Seleccionar</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => (
                <tr key={w.id}>
                  <td>{w.nombreCompleto}</td>
                  <td>{w.puesto}</td>
                  <td>{w.riesgo}</td>
                  <td>{w.usuario_id ? w.usuario_id : <em>Sin usuario</em>}</td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                       disabled={!w.usuario_id}
                       checked={w.usuario_id ? selectedWorkers.includes(Number(w.usuario_id)) : false}
                       onChange={() => toggleWorker(w)}
                      title={!w.usuario_id ? 'Este trabajador no tiene usuario creado' : ''}
                    />
                  </td>
                </tr>
              ))}
              {workers.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center">Sin resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        <div className="modal-footer">
          <button
            onClick={() => {
              setSelectedWorkers([]);
              closeModal();
            }}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 mr-2"
          >
            Cancelar
          </button>
          <button
            onClick={closeModal}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkerListModal;

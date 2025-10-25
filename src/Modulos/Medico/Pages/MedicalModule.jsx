//MedicalModule.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarMedico from "../Components/SidebarMedico";
import "../Styles/LayoutMedico.css";
import WorkerDocumentsModal from "../Components/WorkerDocumentsModal";


const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const MedicalModule = () => {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem("medico.sidebar_open");
    return saved === null ? true : saved === "true";
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [rows, setRows] = useState([]);          // ← datos reales
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const navigate = useNavigate();

// construye la ruta hacia los EMO's de un trabajador
function buildTargetFromWorker(w) {
  const clienteId =
    w.cliente_id ?? w.clienteId ?? w.client_id ?? w.clientId;
  const trabajadorId =
    w.trabajador_id ?? w.trabajadorId ?? w.trabId ?? w.id; // suele ser w.id

  if (!clienteId || !trabajadorId) return null;
  return `/medico/clientes/${clienteId}/trabajadores/${trabajadorId}/emos`;
}

   const toggleSidebar = () => {
    setIsOpen(prev => {
      const next = !prev;
      localStorage.setItem("medico.sidebar_open", String(next));
      return next;
    });
  };

  // Cargar una sola vez (puedes agregar headers Authorization si usas USE_AUTH=true)
  useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token'); // o de tu store
      const res = await fetch(`${API}/medico/trabajadores`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Backend dijo:', data);
        setRows([]);              // evita el .map error
        return;
      }

      const withDocs = (Array.isArray(data) ? data : []).map(r => ({
        ...r,
        documents: []
      }));
      setRows(withDocs);
    } catch (e) {
      console.error('Error cargando trabajadores:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);


  const handleFileSelect = (rowIndex, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const newDoc = { name: file.name, url: URL.createObjectURL(file) };
    setRows(prev => {
      const copy = [...prev];
      (copy[rowIndex].documents ||= []).push(newDoc);
      return copy;
    });
  };

  const handleOpenModal = (worker) => {
    setSelectedWorker(worker);
    setModalOpen(true);
  };

  const handleDeleteFile = (worker, fileIndex) => {
    worker.documents.splice(fileIndex, 1);
    setSelectedWorker({ ...worker }); // trigger rerender modal
  };

  const filteredWorkers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return rows.filter(w =>
      `${w.nombreCompleto ?? ''} ${w.puesto ?? ''} ${w.riesgo ?? ''} ${w.cliente ?? ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [rows, searchTerm]);

  return (
    <div className="layout-container">
      <SidebarMedico isOpen={isOpen} toggleSidebar={toggleSidebar} />
      <main className={`main-content ${isOpen ? "expanded" : "collapsed"}`}>
        <h2 className="title">Lista de Trabajadores</h2>

        <input
          type="text"
          placeholder="Buscar por nombre, puesto o riesgo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <table className="workers-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Puesto</th>
                <th>Nivel de Riesgo</th>
                <th>Cliente</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.map((w, index) => (
                <tr
                  key={w.id ?? index}
                  className="clickable-row"
                  title="Abrir EMO's del trabajador"
                  onClick={() => {
                    const t = buildTargetFromWorker(w);
                    if (t) navigate(t);
                    else alert("No se puede abrir: faltan IDs (cliente_id o trabajador_id).");
                  }}
                >
                  <td>{w.nombreCompleto}</td>
                  <td>{w.puesto || '-'}</td>
                  <td>{w.riesgo || '-'}</td>
                  <td>{w.cliente || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <WorkerDocumentsModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          worker={selectedWorker}
          onDeleteFile={handleDeleteFile}
        />
      </main>
    </div>
  );
};

export default MedicalModule;

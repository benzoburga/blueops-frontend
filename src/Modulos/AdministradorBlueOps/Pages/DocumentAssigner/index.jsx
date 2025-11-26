//index.jsx
import { useEffect, useMemo, useState } from 'react';
import api from '@/services/api';
import FileTreeWithCheckbox from './FileTreeWithCheckbox';
import WorkerListModal from './WorkerListModal';
import '../../../../styles/filesSection.css';
import Toast from '@/components/Toast';

// 🔹 Convierte el slug de la ruta al nombre real del apartado (con tildes)
const decodeSectionName = (slug) => {
  const mapa = {
    "linea-base": "Línea Base",
    "politicas-y-reglamentos": "Políticas y Reglamentos",
    "objetivos-y-estadisticas": "Objetivos y estadísticas",
    "comite": "Comité",
    "iperc": "IPERC",
    "procedimientos": "Procedimientos",
    "capacitacion": "Capacitación",
    "planes-y-programas": "Planes y programas",
    "registros": "Registros",
    "mapas-de-riesgo": "Mapas de riesgo",
    "auditorias": "Auditorías",
    "matrices": "Matrices",
    "accidentes-e-incidentes": "Accidentes e Incidentes",
    "fiscalizacion": "Fiscalización",
    "emo": "EMO´s",
    "docgen": "DocGen",
    "monitoreos": "Monitoreos",
    "informes": "Informes"
  };
  return mapa[slug] || slug;
};

const DocumentAssigner = () => {
  const [filesData, setFilesData] = useState([]);

  // selects
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  // asignación
  const [showModal, setShowModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);

  // loading / error
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingCats, setLoadingCats] = useState(false);
  const [error, setError] = useState('');

  const [toast, setToast] = useState({ open: false, type: 'success', message: '' });
  const showToast = (type, message) => setToast({ open: true, type, message });

  // 1) Cargar clientes
  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoadingClients(true);
        setError('');
        const { data } = await api.get('/clientes');
        const list = Array.isArray(data)
          ? data
          : (Array.isArray(data?.clientes) ? data.clientes
          : (Array.isArray(data?.rows) ? data.rows : []));
        setClients(list);
        setSelectedClient(list[0]?.id ? String(list[0].id) : '');
      } catch (e) {
        console.error(e);
        setError('No se pudieron cargar los clientes.');
        setClients([]);
        setSelectedClient('');
      } finally {
        setLoadingClients(false);
      }
    };
    loadClients();
  }, []);

  // 2) Cargar apartados del cliente
  useEffect(() => {
    const loadCategories = async () => {
      if (!selectedClient) {
        setCategories([]);
        setSelectedCategory('');
        return;
      }
      try {
        setLoadingCats(true);
        setError('');
        const { data } = await api.get(`/apartados/cliente/${selectedClient}`);
        const list = (Array.isArray(data) ? data : [])
          .map(x => ({ id: x.id, nombre: x.nombre ?? x.nombre_apartado ?? '—' }));
        setCategories(list);
        setSelectedCategory(list[0]?.id ? String(list[0].id) : '');
      } catch (e) {
        console.error(e);
        setError('No se pudieron cargar los apartados del cliente.');
        setCategories([]);
        setSelectedCategory('');
      } finally {
        setLoadingCats(false);
      }
    };
    loadCategories();
  }, [selectedClient]);

  // 3) Obtener nombre del apartado seleccionado
  const selectedCategoryName = useMemo(() => {
    const obj = categories.find(c => String(c.id) === String(selectedCategory));
    return obj?.nombre || '';
  }, [categories, selectedCategory]);

  // 4) Cargar árbol real (recursivo)
  useEffect(() => {
    const loadTree = async () => {
      const cli = (clients || []).find(c => String(c.id) === String(selectedClient));
      const clienteNombre = cli?.nombre ?? cli?.nombre_comercial ?? '';
      const apartadoNombre = selectedCategoryName;

      if (!clienteNombre || !apartadoNombre) {
        setFilesData([]);
        return;
      }

      try {
        const res = await api.get(`/estructura/${encodeURIComponent(clienteNombre)}/${encodeURIComponent(apartadoNombre)}`);
        const payload = res?.data;

        const toArray = (x) => {
          if (Array.isArray(x)) return x;
          if (x && typeof x === 'object') {
            if (Array.isArray(x.carpetas)) return x.carpetas;
            if (Array.isArray(x.data)) return x.data;
            if (Array.isArray(x.rows)) return x.rows;
            if (Array.isArray(x.tree)) return x.tree;
            if (Array.isArray(x.items)) return x.items;
          }
          return [];
        };

        const rawRoots = toArray(payload);

        const mapFiles = (arr = []) =>
          (arr || []).map(f => ({
            id: f.id,
            name: f.nombre,
            code: f.codigo || 'no disponible',
            approvalDate: f.fecha_aprobacion ? String(f.fecha_aprobacion).slice(0,10) : 'no disponible',
            version: f.version,
            uploadDate: f.fecha_subida ? String(f.fecha_subida).slice(0,10) : 'no disponible',
            url: f.url_archivo ? `${f.url_archivo}` : undefined,
          }));

        const mapSubs = (subs = []) =>
          toArray(subs)
            .sort((a,b) => (a.orden ?? 0) - (b.orden ?? 0))
            .map(s => ({
              id: s.id,
              name: s.name || s.nombre,
              files: mapFiles(s.files || s.archivos || []),
              subfolders: mapSubs(s.subfolders || s.hijos || []),
              orden: s.orden ?? 0,
            }));

        const transformed = rawRoots
          .sort((a,b) => (a.orden ?? 0) - (b.orden ?? 0))
          .map(c => ({
            year: c.name || c.nombre,
            carpeta_id: c.id,
            orden: c.orden ?? 0,
            files: mapFiles(c.files || c.archivos || []),
            subfolders: mapSubs(c.subfolders || c.hijos || []),
          }));

        setFilesData(transformed);
      } catch (e) {
        console.error('Error cargando estructura:', e);
        setFilesData([]);
      }
    };

    loadTree();
  }, [clients, selectedClient, selectedCategoryName]);

  const isCheckboxEnabled = selectedWorkers.length > 0;

  const handleAsignar = async () => {
    try {
      if (!selectedFiles?.length) {
        showToast('error', 'Selecciona al menos un archivo');
        return;
      }
      if (!selectedWorkers?.length) {
        showToast('error', 'Selecciona al menos un usuario');
        return;
      }

      const usuario_ids = selectedWorkers.map(Number);

      await Promise.all(
        selectedFiles.map(f => api.post(`/asignaciones`, { archivo_id: Number(f.id), usuario_ids }))
      );

      showToast('success', 'Asignación realizada');
      setSelectedFiles([]);
      setSelectedWorkers([]);
    } catch (err) {
      console.error(err);
      showToast('error', 'Error asignando archivos');
    }
  };

  return (
    <div className="p-4 files-section">
      <h1 className="text-xl font-semibold mb-4">Asignación de Documentos</h1>

      <div className="flex gap-4 mb-8">
        {/* Clientes */}
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="border px-2 py-1 rounded min-w-[280px]"
          disabled={loadingClients}
        >
          {(Array.isArray(clients) ? clients : []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre ?? c.nombre_comercial ?? '—'}
            </option>
          ))}
        </select>

        {/* Apartados */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border px-2 py-1 rounded min-w-[280px]"
          disabled={!selectedClient || loadingCats}
        >
          {(Array.isArray(categories) ? categories : []).map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 text-white px-4 py-1 rounded"
        >
          Seleccionar trabajadores
        </button>

        {selectedWorkers.length > 0 && (
          <span className="text-sm text-gray-700 ml-6 self-center">
            {selectedWorkers.length} trabajador{selectedWorkers.length > 1 ? 'es' : ''} seleccionado{selectedWorkers.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <FileTreeWithCheckbox
        filesData={filesData}
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
        isEnabled={isCheckboxEnabled}
      />

      <div className="flex gap-2 mt-4">
        <button onClick={handleAsignar} className="bg-green-600 text-white px-6 py-2 rounded">
          Asignar
        </button>
        <button onClick={() => setSelectedFiles([])} className="bg-red-600 text-white px-6 py-2 rounded">
          Cancelar
        </button>
      </div>

      {showModal && (
        <WorkerListModal
          clientId={selectedClient}
          selectedWorkers={selectedWorkers}
          setSelectedWorkers={setSelectedWorkers}
          closeModal={() => setShowModal(false)}
        />
      )}
      {toast.open && (
        <Toast
          type={toast.type}
          message={toast.message}
          duration={2200}
          onClose={() => setToast(t => ({ ...t, open: false }))}
        />
      )}
    </div>
  );
};

export default DocumentAssigner;

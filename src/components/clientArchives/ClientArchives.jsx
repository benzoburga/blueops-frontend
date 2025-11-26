// src/pages/ClientArchives.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/clientarchives.css';
import ClientArchivesCard from './ClientArchivesCard';
import { useParams, useNavigate } from "react-router-dom";
import axios from 'axios';
import {
  FaChartLine, FaFileAlt, FaChartBar, FaUsers, FaExclamationTriangle, FaClipboardList, FaChalkboardTeacher,
  FaCalendarAlt, FaFolderOpen, FaMapMarkedAlt, FaSearch, FaThList, FaAmbulance, FaBalanceScale,
  FaFileMedical, FaFileSignature, FaEye, FaRegFileAlt, FaPlusCircle, FaTrash
} from 'react-icons/fa';
import NameInputModal from '@/components/NameInputModal';

// Slugs por tipo de apartado (controla navegación)
const slugByTipo = {
  1: 'linea-base',
  2: 'politicas-y-reglamentos',
  3: 'objetivos-y-estadisticas',
  4: 'comite',
  5: 'iperc',
  6: 'procedimientos',
  7: 'capacitacion',
  8: 'planes-y-programas',
  9: 'registros',
  10: 'mapas-de-riesgo',
  11: 'auditorias',
  12: 'matrices',
  13: 'accidentes-e-incidentes',
  14: 'fiscalizacion',
  15: 'emo', // caso especial
  16: 'docgen',
  17: 'monitoreos',
  18: 'informes',
};

// Ícono + título por tipo
const tipoApartadoMap = {
  1: { title: "Línea Base", icon: <FaChartLine /> },
  2: { title: "Políticas y Reglamentos", icon: <FaFileAlt /> },
  3: { title: "Objetivos y estadísticas", icon: <FaChartBar /> },
  4: { title: "Comité", icon: <FaUsers /> },
  5: { title: "IPERC", icon: <FaExclamationTriangle /> },
  6: { title: "Procedimientos", icon: <FaClipboardList /> },
  7: { title: "Capacitación", icon: <FaChalkboardTeacher /> },
  8: { title: "Planes y programas", icon: <FaCalendarAlt /> },
  9: { title: "Registros", icon: <FaFolderOpen /> },
  10: { title: "Mapas de riesgo", icon: <FaMapMarkedAlt /> },
  11: { title: "Auditorías", icon: <FaSearch /> },
  12: { title: "Matrices", icon: <FaThList /> },
  13: { title: "Accidentes e Incidentes", icon: <FaAmbulance /> },
  14: { title: "Fiscalización", icon: <FaBalanceScale /> },
  15: { title: "EMO´s", icon: <FaFileMedical /> },
  16: { title: "DocGen", icon: <FaFileSignature /> },
  17: { title: "Monitoreos", icon: <FaEye /> },
  18: { title: "Informes", icon: <FaRegFileAlt /> },
};

// Orden oficial (1→18). Los custom quedan al final.
const ORDER = {
  1: 1,  2: 2,  3: 3,  4: 4,  5: 5,  6: 6,  7: 7,  8: 8,  9: 9,
  10: 10, 11: 11, 12: 12, 13: 13, 14: 14, 15: 15, 16: 16, 17: 17, 18: 18,
};
const sortApartados = (list = []) => {
  const known = [];
  const custom = [];
  for (const a of list) {
    const k = ORDER[a?.tipo_apartado_id];
    if (k) known.push(a);
    else custom.push(a);
  }
  known.sort((x, y) => ORDER[x.tipo_apartado_id] - ORDER[y.tipo_apartado_id]);
  custom.sort((x, y) =>
    (x?.nombre_apartado || '').localeCompare(y?.nombre_apartado || '')
  );
  return [...known, ...custom];
};

// Normaliza filas desde backend
const normalizeApartados = (raw = []) =>
  raw.map(r => ({
    ac_id: Number(r.ac_id ?? r.apartado_cliente_id ?? r.id ?? 0), // id relación apartados_cliente
    tipo_apartado_id: Number(r.tipo_apartado_id ?? r.tipo_id ?? 0), // id de tipos_apartado
    nombre_apartado: String(
      r.nombre_apartado ??
      r.nombre ??
      (tipoApartadoMap[r.tipo_apartado_id]?.title || '')
    ).trim(),
  }));

const ClientArchives = () => {
  const navigate = useNavigate();
  const { clientName } = useParams();
  const [clienteId, setClienteId] = useState(null);
  const [apartados, setApartados] = useState([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1) Obtener cliente_id por nombre comercial
  useEffect(() => {
    const fetchClienteId = async () => {
      try {
        const res = await axios.get("/api/clientes");
        const cliente = res.data.find(
          c => c.nombre_comercial === decodeURIComponent(clientName)
        );
        if (cliente) setClienteId(cliente.id);
      } catch (err) {
        console.error("Error obteniendo cliente:", err);
      }
    };
    fetchClienteId();
  }, [clientName]);

  // 2) Cargar apartados del cliente
  useEffect(() => {
    if (!clienteId) return;
    const fetchApartados = async () => {
      try {
        const res = await axios.get(
          `/api/apartados/cliente/${clienteId}`
        );
        setApartados(sortApartados(normalizeApartados(res.data || [])));
      } catch (err) {
        console.error("Error cargando apartados del cliente:", err);
      }
    };
    fetchApartados();
  }, [clienteId]);

  // Crear apartado personalizado
  const handleAddSection = () => setIsModalOpen(true);

  const handleModalSubmit = async (value) => {
    if (!value || !clienteId) return;
    try {
      await axios.post("/api/apartados/crear", {
        cliente_id: clienteId,
        nombre: value
      });
      // Refrescar normalizando y ordenando
      const res = await axios.get(
        `/api/apartados/cliente/${clienteId}`
      );
      setApartados(sortApartados(normalizeApartados(res.data || [])));
      setIsModalOpen(false);
    } catch (err) {
      console.error("❌ Error al crear apartado:", err);
      alert("Error al crear apartado.");
    }
  };

  // Click sobre tarjeta
  const handleCardClick = (apartado) => {
    if (apartado === 'Añadir nuevo apartado') { handleAddSection(); return; }
    if (apartado === 'Eliminar apartado')    { handleToggleDeleteMode(); return; }

    const tipoId = apartado?.tipo_apartado_id || 0;
    const slug = slugByTipo[tipoId] ||
      String(apartado?.nombre_apartado || '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (!slug) return;
    navigate(`/admin/archivos-cliente/${clientName}/${slug}`);
  };

  const handleToggleDeleteMode = () => setIsDeleteMode(prev => !prev);

  // Eliminar apartado (por tipo_apartado_id)
  const handleDeleteSection = async (titleToDelete) => {
    try {
      const target = apartados.find(a => {
        const tipo = tipoApartadoMap[a.tipo_apartado_id];
        const nombre = tipo ? tipo.title : a.nombre_apartado;
        return nombre === titleToDelete;
      });
      if (!target) return alert("Apartado no encontrado.");

      await axios.delete(
        `/api/apartados/${clienteId}/${target.tipo_apartado_id}`
      );

      setApartados(prev =>
        sortApartados(prev.filter(a => a.tipo_apartado_id !== target.tipo_apartado_id))
      );
    } catch (error) {
      console.error("❌ Error al eliminar apartado:", error);
      alert("Error al eliminar apartado.");
    }
  };

  return (
    <div className="client-archives">
      <h2>Archivos del Cliente: {clientName?.toUpperCase()}</h2>

      <div className="sections-container">
        {sortApartados(apartados).map((a, index) => {
          const tipo = tipoApartadoMap[a.tipo_apartado_id];
          const title = tipo ? tipo.title : (a.nombre_apartado || 'Apartado');
          const icon = tipo ? tipo.icon : <FaFolderOpen />;

          return (
            <ClientArchivesCard
              key={`apartado-${index}`}
              title={title}
              icon={icon}
              onClick={() => handleCardClick(a)}
              showDelete={isDeleteMode}
              onDelete={() => handleDeleteSection(title)}
            />
          );
        })}

        <ClientArchivesCard
          title="Añadir nuevo apartado"
          icon={<FaPlusCircle />}
          onClick={() => handleCardClick("Añadir nuevo apartado")}
        />

        <ClientArchivesCard
          title="Eliminar apartado"
          icon={<FaTrash />}
          onClick={() => handleCardClick("Eliminar apartado")}
        />
      </div>

      <NameInputModal
        isOpen={isModalOpen}
        title="Nuevo Apartado"
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default ClientArchives;

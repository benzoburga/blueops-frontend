// src/components/clientArchives/ClientArchives.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/clientarchives.css';
import ClientArchivesCard from './ClientArchivesCard';
import { useParams, useNavigate } from "react-router-dom";
import axios from 'axios';
import {
  FaChartLine, FaFileAlt, FaChartBar, FaUsers, FaExclamationTriangle, FaClipboardList,
  FaChalkboardTeacher, FaCalendarAlt, FaFolderOpen, FaMapMarkedAlt, FaSearch, FaThList,
  FaAmbulance, FaBalanceScale, FaFileMedical, FaFileSignature, FaEye, FaRegFileAlt,
  FaPlusCircle, FaTrash
} from 'react-icons/fa';
import NameInputModal from '@/components/NameInputModal';

// Mapa de títulos e iconos
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

const ORDER = Object.fromEntries([...Array(18)].map((_, i) => [i + 1, i + 1]));

const sortApartados = list => {
  const def = list.filter(a => ORDER[a.tipo_apartado_id]);
  const custom = list.filter(a => !ORDER[a.tipo_apartado_id]);

  def.sort((a, b) => ORDER[a.tipo_apartado_id] - ORDER[b.tipo_apartado_id]);
  custom.sort((a, b) => a.nombre_apartado.localeCompare(b.nombre_apartado));

  return [...def, ...custom];
};

const normalize = raw =>
  raw.map(r => ({
    ac_id: Number(r.ac_id ?? r.apartado_cliente_id ?? r.id ?? 0),
    tipo_apartado_id: Number(r.tipo_apartado_id ?? r.tipo_id ?? 0),
    nombre_apartado: r.nombre_apartado || r.nombre || (tipoApartadoMap[r.tipo_apartado_id]?.title || '')
  }));

const ClientArchives = () => {
  const navigate = useNavigate();
  const { clientId, clientName } = useParams();

  const [apartados, setApartados] = useState([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ya NO se busca por nombre. clientId llega directo de la URL.
  const realClientId = Number(clientId);

  // Cargar apartados
  useEffect(() => {
    if (!realClientId) return;
    (async () => {
      try {
        const res = await axios.get(`/api/apartados/cliente/${realClientId}`);
        setApartados(sortApartados(normalize(res.data || [])));
      } catch (err) {
        console.error("Error cargando apartados:", err);
      }
    })();
  }, [realClientId]);

  // Crear apartado personalizado
  const handleModalSubmit = async (value) => {
    if (!value) return;

    try {
      await axios.post("/api/apartados/crear", {
        cliente_id: realClientId,
        nombre: value
      });

      const res = await axios.get(`/api/apartados/cliente/${realClientId}`);
      setApartados(sortApartados(normalize(res.data || [])));
      setIsModalOpen(false);
    } catch (err) {
      console.error("❌ Error al crear apartado:", err);
      alert("Error al crear apartado");
    }
  };

  const handleCardClick = (apartado) => {
    if (apartado === 'Añadir nuevo apartado') return setIsModalOpen(true);
    if (apartado === 'Eliminar apartado') return setIsDeleteMode(v => !v);

    const slug =
      tipoApartadoMap[apartado.tipo_apartado_id]?.title
        ?.toLowerCase()
        .replace(/\s+/g, '-')
        .normalize("NFD").replace(/[\u0300-\u036f]/g, '');

    navigate(`/admin/archivos-cliente/${realClientId}/${clientName}/${slug}`);
  };

  return (
    <div className="client-archives">
      <h2>Archivos del Cliente: {decodeURIComponent(clientName)?.toUpperCase()}</h2>

      <div className="sections-container">
        {apartados.map((a, i) => {
          const tipo = tipoApartadoMap[a.tipo_apartado_id];
          const title = tipo ? tipo.title : a.nombre_apartado;
          const icon = tipo ? tipo.icon : <FaFolderOpen />;

          return (
            <ClientArchivesCard
              key={i}
              title={title}
              icon={icon}
              onClick={() => handleCardClick(a)}
              showDelete={isDeleteMode}
            />
          );
        })}

        <ClientArchivesCard
          title="Añadir nuevo apartado"
          icon={<FaPlusCircle />}
          onClick={() => setIsModalOpen(true)}
        />

        <ClientArchivesCard
          title="Eliminar apartado"
          icon={<FaTrash />}
          onClick={() => setIsDeleteMode(v => !v)}
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

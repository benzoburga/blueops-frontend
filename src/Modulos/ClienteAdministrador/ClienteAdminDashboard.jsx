import React, { useState, useEffect } from 'react';
import { Routes, Route } from "react-router-dom";

import SidebarClienteAdmin from "@modulos/ClienteAdministrador/Components/SidebarClienteAdmin";
import AddWorker from "@modulos/ClienteAdministrador/Pages/AddWorker";
import WorkersList from "@modulos/ClienteAdministrador/Pages/WorkersList";
import DocumentosCliente from "@modulos/ClienteAdministrador/Pages/DocumentosCliente";
import "@modulos/ClienteAdministrador/Styles/LayoutClienteAdmin.css";


import axios from 'axios';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const parseJSON = (s) => { try { return JSON.parse(s || '{}'); } catch { return {}; } };
const getAuthUser = () =>
  parseJSON(localStorage.getItem('authUser')) ||
  parseJSON(sessionStorage.getItem('authUser'));
const mapRows = (rows = []) => rows.map(r => ({
  identificacion: r.numero_identificacion,
  nombre: r.nombres,
  apellido: r.apellidos,
  puesto: r.puesto,
  fechaInicio: r.fecha_inicio,
  tipo: r.tipo,
  trabajador_id: r.id,
  usuario_id: r.usuario_id ?? null,
}));

const ClienteAdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        // intenta con token (USE_AUTH=true)
        const { data } = await axios.get(`${API}/api/trabajadores`);
        setWorkers(mapRows(data));
      } catch {
        // fallback por cliente_id (USE_AUTH=false o sin token)
        const u = getAuthUser();
        const { data } = await axios.get(`${API}/api/trabajadores/cliente/${u?.cliente_id}`);
        setWorkers(mapRows(data));
      }
    };
    // Asegura Authorization si no estaba
    const u = getAuthUser();
    if (u?.token && !axios.defaults.headers.common.Authorization) {
      axios.defaults.headers.common.Authorization = `Bearer ${u.token}`;
    }
    load();
  }, []);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className={`cliente-admin-dashboard ${isSidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"}`}>
      <SidebarClienteAdmin isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="cliente-admin-content">
      <Routes>
        <Route path="añadir-trabajador" element={<AddWorker workers={workers} setWorkers={setWorkers} />} />
        <Route path="lista-trabajadores" element={<WorkersList workers={workers} setWorkers={setWorkers} />} />
        <Route path="documentos/:clientId" element={<DocumentosCliente />} />
      </Routes>
      </div>
    </div>
  );
};

export default ClienteAdminDashboard;

//ClienteAdminDashboard.jsx
import { useState, useEffect } from 'react';
import { Routes, Route } from "react-router-dom";

import SidebarClienteAdmin from "@modulos/ClienteAdministrador/Components/SidebarClienteAdmin";
import AddWorker from "@modulos/ClienteAdministrador/Pages/AddWorker";
import WorkersList from "@modulos/ClienteAdministrador/Pages/WorkersList";
import DocumentosCliente from "@modulos/ClienteAdministrador/Pages/DocumentosCliente";
import "@modulos/clienteadministrador/styles/layoutclienteadmin.css";

import axios from 'axios';

// ✅ asegura baseURL a 4000 (producción local sirviendo el build desde 4000)
//axios.defaults.baseURL = `${window.location.origin}/api`;

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
    const u = getAuthUser();

    // Header Authorization si hay token
    if (u?.token && !axios.defaults.headers.common.Authorization) {
      axios.defaults.headers.common.Authorization = `Bearer ${u.token}`;
    }

    // 🚫 Nada de /api/trabajadores “pelado”.
    // ✅ Pide SIEMPRE por cliente.
    const load = async () => {
      if (!u?.cliente_id) {
        setWorkers([]);
        return;
      }
      try {
        // Puedes usar cualquiera de tus dos rutas válidas:
        // const { data } = await axios.get(`/trabajadores/cliente/${u.cliente_id}`);
        const { data } = await axios.get(`/clientes/${u.cliente_id}/trabajadores`);
        setWorkers(mapRows(Array.isArray(data) ? data : (data?.rows || [])));
      } catch (e) {
        console.error('Error cargando trabajadores:', e);
        setWorkers([]);
      }
    };

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

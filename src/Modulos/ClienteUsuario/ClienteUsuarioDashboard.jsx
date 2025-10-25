import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";

import SidebarClienteUsuario from "@modulos/ClienteUsuario/Components/SidebarClienteUsuario";
import PerfilPage from "@modulos/ClienteUsuario/Pages/PerfilPage";   // 👈 nueva página
import MyDocuments from "@modulos/ClienteUsuario/Pages/MyDocuments";

import "@styles/sidebar.css";
import "@modulos/ClienteUsuario/Styles/LayoutClienteUsuario.css";

const ClienteUsuarioDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className={`cliente-usuario-dashboard ${isSidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"}`}>
      <SidebarClienteUsuario isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="cliente-usuario-content">
        <Routes>
          <Route path="perfil" element={<PerfilPage />} />         {/* 👈 sin mock */}
          <Route path="documentos" element={<MyDocuments />} />
        </Routes>
      </div>
    </div>
  );
};

export default ClienteUsuarioDashboard;

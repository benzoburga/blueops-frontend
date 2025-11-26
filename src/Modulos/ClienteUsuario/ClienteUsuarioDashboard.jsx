// ClienteUsuarioDashboard.jsx
import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import SidebarClienteUsuario from "@modulos/ClienteUsuario/Components/SidebarClienteUsuario";
import PerfilPage from "@modulos/ClienteUsuario/Pages/PerfilPage";
import MyDocuments from "@modulos/ClienteUsuario/Pages/MyDocuments";

import "@styles/sidebar.css";
import "@modulos/ClienteUsuario/Styles/LayoutClienteUsuario.css";

const ClienteUsuarioDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const isMobile = window.innerWidth <= 768;

  return (
    <div className="cliente-usuario-dashboard">

      {/* 🔥 Sidebar solo en PC */}
      {!isMobile && (
        <SidebarClienteUsuario
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />
      )}

      <div className="cliente-usuario-content">
        <Routes>

          {/* 🔥 Perfil solo en PC */}
          {!isMobile && (
            <Route path="perfil" element={<PerfilPage />} />
          )}

          {/* 🔥 Documentos SIEMPRE visible */}
          <Route path="documentos" element={<MyDocuments />} />
        </Routes>
      </div>
    </div>
  );
};

export default ClienteUsuarioDashboard;

import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "@components/Sidebar";
import Content from "@components/Content";
import FileList from "@components/GlobalSearch/FileList";
import PublicacionesList from "@components/PublicacionesList/PublicacionesList";
import CreateClientForm from "@components/CreateClient/CreateClientForm";
import DataClientForm from "@components/DataClient/DataClientForm";
import ClientArchives from "@components/clientArchives/ClientArchives";
import FileSection from "@components/clientArchives/FileSection";
import DocumentAssigner from "@modulos/AdministradorBlueOps/Pages/DocumentAssigner";
import "@/App.css";

const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className={`dashboard ${isSidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"}`}>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="dashboard--content">
          <Routes>
            <Route path="/" element={<Content />} />
            <Route path="buscar-archivo" element={<FileList />} />
            <Route path="publicaciones" element={<PublicacionesList />} />
            <Route path="crear-cliente" element={<CreateClientForm />} />
            <Route path="ver-cliente/:ruc" element={<DataClientForm />} />
            <Route path="archivos-cliente" element={<Navigate to="/" replace />} />
            <Route path="archivos-cliente/:clientName" element={<ClientArchives />} />
            <Route path="archivos-cliente/:clientName/:sectionName" element={<FileSection />} />
            <Route path="asignar-documentos" element={<DocumentAssigner />} />
            <Route path="gestor-documentos" element={<DocumentAssigner />} />
          </Routes>

      </div>
    </div>
  );
};

export default AdminDashboard;

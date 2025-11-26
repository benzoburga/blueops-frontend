// src/Modulos/AdministradorBlueOps/AdminDashboard.jsx
import { useEffect, useState } from "react";
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

import useIsMobile from "@/utils/useIsMobile";
import "@/styles/mobile-shell.css";

export default function AdminDashboard() {
  const isMobile = useIsMobile(1024);

  // MÓVIL: drawer abierto/cerrado
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // DESKTOP: sidebar colapsado/expandido
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Si paso a desktop, cierra el drawer (no aplica)
  useEffect(() => { if (!isMobile) setIsDrawerOpen(false); }, [isMobile]);

  // Click del botón del Sidebar:
  const handleToggleSidebar = () => {
    if (isMobile) {
      setIsDrawerOpen(v => !v);         // abrir/cerrar drawer en móvil
    } else {
      setIsCollapsed(v => !v);          // colapsar/expandir en desktop
    }
  };

  return (
    <div className={`app-shell ${!isMobile && isCollapsed ? "collapsed" : ""}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${isMobile ? (isDrawerOpen ? "open" : "") : "static"}`}>
        <Sidebar
          // En desktop, el Sidebar necesita saber si está expandido o colapsado
          isOpen={!isMobile ? !isCollapsed : true}
          toggleSidebar={handleToggleSidebar}
          onNavigate={() => { if (isMobile) setIsDrawerOpen(false); }}
        />
      </aside>

      {/* Overlay para cerrar drawer tocando fuera (solo móvil) */}
      {isMobile && isDrawerOpen && <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)} />}

      {/* Contenido */}
      <section className="app-content">
        <header className="app-header">
          {isMobile && (
            <button className="menu-btn" onClick={() => setIsDrawerOpen(v => !v)} aria-label="Abrir menú">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <h1 className="app-title">BlueOps</h1>
        </header>

        <main className="app-main">
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
        </main>
      </section>
    </div>
  );
}

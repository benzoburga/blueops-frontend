//TrabajadorEMOs.jsx
import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import SidebarMedico from "../Components/SidebarMedico";
import "../styles/layoutmedico.css";
import FilesSectionWorker from "../Components/FilesSectionWorker"; // 👈 fijado (mayúscula)
import { MOCK_TRABAJADORES } from "../data/mockTrabajadores";

export default function TrabajadorEMOs() {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem("medico.sidebar_open");
    return saved === null ? true : saved === "true";
  });
  const toggleSidebar = () => {
    setIsOpen(prev => {
      const next = !prev;
      localStorage.setItem("medico.sidebar_open", String(next));
      return next;
    });
  };

  const nav = useNavigate();
  const { trabId } = useParams();
  const location = useLocation();
  const qs = new URLSearchParams(location.search);

  // Query params que llegan del buscador
  const openId = qs.get("open");        // carpeta_id
  const subId = qs.get("sub");          // subcarpeta_id
  const highlightId = qs.get("highlight"); // archivo_id

  const worker = MOCK_TRABAJADORES.find(w => String(w.id) === String(trabId));
  const titulo = `EMO'S del trabajador ${worker ? `“${worker.nombreCompleto}”` : ""}`;

  return (
    <div className="layout-container">
      <SidebarMedico isOpen={isOpen} toggleSidebar={toggleSidebar} />
      <main className={`main-content ${isOpen ? "expanded" : "collapsed"}`}>
        <h2 className="title">{titulo}</h2>

        {/* 👉 pasamos los 3 parámetros */}
        <FilesSectionWorker
          defaultOpenFolderId={openId}
          defaultOpenSubId={subId}
          highlightFileId={highlightId}
        />

        <div style={{ marginTop: 16 }}>
          <button className="close-btn" onClick={() => nav(-1)}>Volver</button>
        </div>
      </main>
    </div>
  );
}

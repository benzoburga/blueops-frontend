import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SidebarMedico from "../Components/SidebarMedico";
import "../Styles/LayoutMedico.css";
import { MOCK_TRABAJADORES } from "../data/mockTrabajadores";

const TrabajadorDetalleMedico = () => {
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
  const { id, trabId } = useParams(); // id cliente, id trabajador
  const navigate = useNavigate();

  const worker = MOCK_TRABAJADORES.find(w => String(w.id) === String(trabId));

  return (
    <div className="layout-container">
      <SidebarMedico isOpen={isOpen} toggleSidebar={toggleSidebar} />
      <main className={`main-content ${isOpen ? "expanded" : "collapsed"}`}>
        <h2 className="title">Trabajador</h2>
        {worker ? (
          <div className="card">
            <p><strong>Nombre:</strong> {worker.nombreCompleto}</p>
            <p><strong>Puesto:</strong> {worker.puesto}</p>
            <p><strong>Nivel de riesgo:</strong> {worker.riesgo}</p>
            <p><strong>DNI:</strong> {worker.dni}</p>
          </div>
        ) : (
          <p>No se encontró el trabajador.</p>
        )}

        <button
  className="btn"
  onClick={() => navigate(`/medico/clientes/${id}/trabajadores/${trabId}/emos`)}
>
  Ver EMO’s
</button>
        <button className="close-btn" onClick={() => navigate(-1)}>Volver</button>

      
      </main>
    </div>
  );
};

export default TrabajadorDetalleMedico;

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaUser, FaFileAlt, FaBars } from "react-icons/fa";
import LogoutButton from "@components/LogoutButton"; // 👈 Importa el botón
import "../../../styles/sidebar.css";

const SidebarClienteUsuario = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();

  return (
    <div className={`menu ${!isOpen ? "collapsed" : ""}`}>
      <div className="logo">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <FaBars />
        </button>
      </div>

      <div className="menu--list">
        <Link
          to="/cliente-usuario/perfil"
          className={`item ${location.pathname === "/cliente-usuario/perfil" ? "active" : ""}`}
        >
          <FaUser className="icon" />
          <span>Perfil</span>
        </Link>

        <Link
          to="/cliente-usuario/documentos"
          className={`item ${location.pathname === "/cliente-usuario/documentos" ? "active" : ""}`}
        >
          <FaFileAlt className="icon" />
          <span>Documentos</span>
        </Link>

        {/* 🔴 CERRAR SESIÓN ABAJO */}
        <LogoutButton />
      </div>
    </div>
  );
};

export default SidebarClienteUsuario;

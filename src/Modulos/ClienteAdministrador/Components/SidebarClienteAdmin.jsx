//SidebarClienteAdmin.jsx
import { NavLink } from "react-router-dom";
import {
  BiUserPlus,
  BiListCheck,
  BiHelpCircle,
  BiMenu,
  BiX,
  BiSolidGroup,
  BiFolder
} from "react-icons/bi";
import LogoutButton from "@components/LogoutButton"; // 👈 Importa el botón
import "../../../styles/sidebar.css";

const SidebarClienteAdmin = ({ isOpen, toggleSidebar }) => {
  return (
    <div className={`menu ${isOpen ? "expanded" : "collapsed"}`}>
      <div className="logo">
        <button className="menu-toggle" onClick={toggleSidebar}>
          {isOpen ? <BiX /> : <BiMenu />}
        </button>
        {isOpen && <h2>Admin</h2>}
      </div>

      <div className="menu--list">
        <NavLink
          to="/cliente-admin/añadir-trabajador"
          className={({ isActive }) => (isActive ? "item active" : "item")}
        >
          <BiUserPlus className="icon" />
          {isOpen && <span>Añadir trabajador</span>}
        </NavLink>

        <NavLink
          to="/cliente-admin/lista-trabajadores"
          className={({ isActive }) => (isActive ? "item active" : "item")}
        >
          <BiSolidGroup className="icon" />
          {isOpen && <span>Lista de trabajadores</span>}
        </NavLink>

        <NavLink
          to="/cliente-admin/documentos/20485632917"
          className={({ isActive }) => (isActive ? "item active" : "item")}
        >
          <BiFolder className="icon" />
          {isOpen && <span>Documentos</span>}
        </NavLink>

        <NavLink
          to="/cliente-admin/ayuda"
          className={({ isActive }) => (isActive ? "item active" : "item")}
        >
          <BiHelpCircle className="icon" />
          {isOpen && <span>Ayuda</span>}
        </NavLink>

        {/* 🔴 BOTÓN DE CERRAR SESIÓN */}
        <LogoutButton />
      </div>
    </div>
  );
};

export default SidebarClienteAdmin;

//SidebarMedico.jsx
import { NavLink } from "react-router-dom";
import { BiListCheck, BiMenu, BiX } from "react-icons/bi";
import { FaBuilding, FaUsers, FaAddressBook } from "react-icons/fa"; // ⬅️ NUEVO
import LogoutButton from "@components/LogoutButton";
import "../../../styles/sidebar.css";
import { FaSearch } from "react-icons/fa";

const SidebarMedico = ({ isOpen, toggleSidebar }) => {
  return (
    <div className={`menu ${isOpen ? "expanded" : "collapsed"}`}>
      <div className="logo">
        <button className="menu-toggle" onClick={toggleSidebar}>
          {isOpen ? <BiX /> : <BiMenu />}
        </button>
        {isOpen && <h2>Médico</h2>}
      </div>

      <div className="menu--list">
        <NavLink
          to="/medico/lista"
          className={({ isActive }) => (isActive ? "item active" : "item")}
        >
          <FaUsers className="icon" />
          {isOpen && <span>Lista de trabajadores</span>}
        </NavLink>

        {/* ⬇️ NUEVO: Clientes */}
        <NavLink
          to="/medico/clientes"
          className={({ isActive }) => (isActive ? "item active" : "item")}
        >
          <FaAddressBook className="icon" />
          {isOpen && <span>Clientes</span>}
        </NavLink>

        <NavLink
          to="/medico/emos-buscador"
          className={({ isActive }) => (isActive ? "item active" : "item")}
        >
          <FaSearch className="icon" />
          {isOpen && <span>Buscador EMO’s</span>}
        </NavLink>

        <LogoutButton />
      </div>
    </div>
  );
};

export default SidebarMedico;

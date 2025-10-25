import { NavLink } from 'react-router-dom';
import {
  
  BiSolidReport,
  BiHelpCircle,
  BiGroup,
  BiSearch,
  BiMenu,
  BiX,
  BiFolder
} from 'react-icons/bi';

import LogoutButton from '@components/LogoutButton'; // 👈 importa el botón
import '../styles/sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <div className={`menu ${isOpen ? 'expanded' : 'collapsed'}`}>
      <div className="logo">
        <button className="menu-toggle" onClick={toggleSidebar}>
          {isOpen ? <BiX /> : <BiMenu />}
        </button>
        {isOpen && <h2>BlueOps</h2>}
      </div>

      <div className="menu--list">
        <NavLink
          to="/admin"
          className={({ isActive }) => (isActive ? 'item active' : 'item')}
        >
          <BiGroup className="icon" />
          {isOpen && <span>Clientes</span>}
        </NavLink>

        <NavLink
          to="/admin/buscar-archivo"
          className={({ isActive }) => (isActive ? 'item active' : 'item')}
        >
          <BiSearch className="icon" />
          {isOpen && <span>Buscar Archivo</span>}
        </NavLink>

        <NavLink
          to="/admin/publicaciones"
          className={({ isActive }) => (isActive ? 'item active' : 'item')}
        >
          <BiSolidReport className="icon" />
          {isOpen && <span>Ultimos Movimientos</span>}
        </NavLink>

        <NavLink
          to="/admin/gestor-documentos"
          className={({ isActive }) => (isActive ? 'item active' : 'item')}
        >
          <BiFolder className="icon" />
          {isOpen && <span>Asignación de Documentos</span>}
        </NavLink>

        <NavLink
          to="/admin/ayuda"
          className={({ isActive }) => (isActive ? 'item active' : 'item')}
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

export default Sidebar;

import { NavLink } from 'react-router-dom';
import {
  BiSolidReport, BiHelpCircle, BiGroup, BiSearch, BiMenu, BiX, BiFolder
} from 'react-icons/bi';
import LogoutButton from '@components/LogoutButton';
import '../styles/sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar, onNavigate }) => {
  const handleNav = () => { onNavigate?.(); };
  return (
    <div className={`menu ${isOpen ? 'expanded' : 'collapsed'}`}>
      <div className="logo">
        <button className="menu-toggle" onClick={toggleSidebar}>
          {isOpen ? <BiX /> : <BiMenu />}
        </button>
        {isOpen && <h2>BlueOps</h2>}
      </div>

      <div className="menu--list">
        <NavLink to="/admin"                className={({ isActive }) => (isActive ? 'item active' : 'item')} onClick={handleNav}>
          <BiGroup className="icon" />      {isOpen && <span>Clientes</span>}
        </NavLink>
        <NavLink to="/admin/buscar-archivo" className={({ isActive }) => (isActive ? 'item active' : 'item')} onClick={handleNav}>
          <BiSearch className="icon" />     {isOpen && <span>Buscar Archivo</span>}
        </NavLink>
        <NavLink to="/admin/publicaciones"  className={({ isActive }) => (isActive ? 'item active' : 'item')} onClick={handleNav}>
          <BiSolidReport className="icon" />{isOpen && <span>Ultimos Movimientos</span>}
        </NavLink>
        <NavLink to="/admin/gestor-documentos" className={({ isActive }) => (isActive ? 'item active' : 'item')} onClick={handleNav}>
          <BiFolder className="icon" />     {isOpen && <span>Asignación de Documentos</span>}
        </NavLink>
        <NavLink to="/admin/ayuda"          className={({ isActive }) => (isActive ? 'item active' : 'item')} onClick={handleNav}>
          <BiHelpCircle className="icon" /> {isOpen && <span>Ayuda</span>}
        </NavLink>
        <LogoutButton />
      </div>
    </div>
  );
};
export default Sidebar;

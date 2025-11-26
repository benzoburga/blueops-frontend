import SidebarClienteAdmin from "./SidebarClienteAdmin";
import { Outlet } from "react-router-dom";
import "../../ClienteAdministrador/Styles/LayoutClienteAdmin.css";

const LayoutClienteAdmin = () => {
  return (
    <div className="cliente-admin-layout">
      <SidebarClienteAdmin />
      <div className="contenido-principal">
        <Outlet />
      </div>
    </div>
  );
};

export default LayoutClienteAdmin;

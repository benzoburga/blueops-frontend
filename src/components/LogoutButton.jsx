import React from "react";
import { useNavigate } from "react-router-dom";
import { BiLogOut } from "react-icons/bi"; // ícono bonito

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  return (
    <div
      onClick={handleLogout}
      className="item"
      style={{ cursor: "pointer", marginTop: "auto", color: "red", display: "flex", alignItems: "center", gap: "0.5rem", padding: "1rem" }}
    >
      <BiLogOut className="icon" />
      <span>Cerrar sesión</span>
    </div>
  );
};

export default LogoutButton;

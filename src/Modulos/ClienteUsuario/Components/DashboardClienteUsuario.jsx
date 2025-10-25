import React from "react";
import "../Styles/DashboardClienteUsuario.css";

const DashboardClienteUsuario = ({ worker }) => {
  if (!worker) return <p>No hay datos del trabajador.</p>;

  return (
    <div className="perfil-layout">
      <h2 className="perfil-title">Mi Perfil</h2>
      <form className="perfil-grid">
        <div className="form-group">
          <label>Identificación</label>
          <input type="text" value={worker.identificacion || ""} readOnly />
        </div>
        <div className="form-group">
          <label>Nombres</label>
          <input type="text" value={worker.nombre || ""} readOnly />
        </div>
        <div className="form-group">
          <label>Apellidos</label>
          <input type="text" value={worker.apellido || ""} readOnly />
        </div>
        <div className="form-group">
          <label>Sexo</label>
          <input type="text" value={worker.sexo || "No especificado"} readOnly />
        </div>
        <div className="form-group">
          <label>Dirección</label>
          <input type="text" value={worker.direccion || "No especificado"} readOnly />
        </div>
        <div className="form-group">
          <label>Fecha de nacimiento</label>
          <input type="text" value={worker.fechaNacimiento || "No registrada"} readOnly />
        </div>
        <div className="form-group">
          <label>Fecha de inicio de labores</label>
          <input type="text" value={worker.fechaInicio} readOnly />
        </div>
        <div className="form-group">
          <label>Número</label>
          <input type="text" value={worker.numero || "No registrado"} readOnly />
        </div>
        <div className="form-group">
          <label>Correo</label>
          <input type="text" value={worker.correo || "No registrado"} readOnly />
        </div>
        <div className="form-group">
          <label>Puesto de trabajo</label>
          <input type="text" value={worker.puesto} readOnly />
        </div>
        <div className="form-group">
          <label>Tipo de Riesgo</label>
          <input
            type="text"
            value={worker.tipo}
            readOnly
            className={worker.tipo === "Alto Riesgo" ? "input-riesgo-alto" : "input-riesgo-bajo"}
          />
        </div>
      </form>
    </div>
  );
};

export default DashboardClienteUsuario;

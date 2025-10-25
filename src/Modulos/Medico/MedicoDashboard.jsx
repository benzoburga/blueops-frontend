//MedicoDashboard.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import MedicalModule from "@modulos/Medico/Pages/MedicalModule";
import ClientesMedico from "@modulos/Medico/Pages/ClientesMedico";
import TrabajadoresDelCliente from "@modulos/Medico/Pages/TrabajadoresDelCliente";
import TrabajadorDetalleMedico from "@modulos/Medico/Pages/TrabajadoresDetalleMedico";
import TrabajadorEMOs from "@modulos/Medico/Pages/TrabajadorEMOs"; 
import BuscadorEmos from "@modulos/Medico/Pages/BuscadorEmos";

const MedicoDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<MedicalModule />} />
      <Route path="lista" element={<MedicalModule />} />
      <Route path="clientes" element={<ClientesMedico />} />
      <Route path="clientes/:id/trabajadores" element={<TrabajadoresDelCliente />} />
      <Route path="clientes/:id/trabajadores/:trabId" element={<TrabajadorDetalleMedico />} />
      <Route path="clientes/:id/trabajadores/:trabId/emos" element={<TrabajadorEMOs />} />
      <Route path="emos-buscador" element={<BuscadorEmos />} />
    </Routes>
  );
};

export default MedicoDashboard;

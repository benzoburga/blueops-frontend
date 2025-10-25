import React, { useEffect, useState } from "react";
import { obtenerRepresentantes } from "@/services/representantesServices";

const ClientBossTable = ({ cliente, editable }) => {
  const [representantes, setRepresentantes] = useState([]);

  useEffect(() => {
    if (cliente?.ruc) {
      obtenerRepresentantes(cliente.ruc).then(setRepresentantes).catch(console.error);
    }
  }, [cliente]);

  return (
    <div className="client-boss-table">
      <h3>Representante Legal</h3>
      <table>
        <thead>
          <tr>
            <th>Documento</th>
            <th>N° Documento</th>
            <th>Nombre</th>
            <th>Cargo</th>
            <th>Fecha desde</th>
          </tr>
        </thead>
        <tbody>
          {representantes.length > 0 ? (
            representantes.map((rep) => (
              <tr key={rep.id}>
                <td>{rep.tipo_documento}</td>
                <td>{rep.numero_documento}</td>
                <td>{rep.nombre}</td>
                <td>{rep.cargo}</td>
                <td>{rep.fecha_desde?.split("T")[0]}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No hay representantes registrados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ClientBossTable;

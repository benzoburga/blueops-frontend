import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { obtenerIndicadores } from "@/services/indicadoresService";

const ClientWorkersTable = () => {
  const { ruc } = useParams();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerIndicadores(ruc)
      .then((data) => setRows(data))
      .catch((e) => setError(e.message));
  }, [ruc]);

  return (
    <div className="client-workers-table">
      <h3>Cantidad de Trabajadores y/o Prestadores de Servicio</h3>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Periodo</th>
            <th>N° de Trabajadores</th>
            <th>N° de Pensionistas</th>
            <th>N° de Prestadores de Servicio</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((r) => (
              <tr key={r.periodo}>
                <td>{r.periodo}</td>
                <td>{r.num_trabajadores}</td>
                <td>{r.num_pensionistas}</td>
                <td>{r.num_prestadores}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No hay información registrada
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ClientWorkersTable;

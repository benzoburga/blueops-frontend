import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ClientData from "./ClientData";
import ClientWorkersTable from "./ClientWorkersTable";
import ClientBossTable from "./ClientBossTable";
import "../../styles/dataclient/dataclient.css";
import { obtenerClientePorRUC } from "@/services/clientesServices";

const DataClientForm = () => {
  const { ruc } = useParams();
  const [cliente, setCliente] = useState(null);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    obtenerClientePorRUC(ruc)
      .then(setCliente)
      .catch((e) => setError(e.message));
  }, [ruc]);

  if (error) return <p style={{ color: "crimson" }}>Error: {error}</p>;
  if (!cliente) return <p>Cargando datos del cliente...</p>;

  return (
    <div className="create-client">
      <h2>Datos del Cliente</h2>

      {!isEditing ? (
        <>
          <ClientData cliente={cliente} />
          <ClientWorkersTable /> {/* mock */}
          <ClientBossTable cliente={cliente} />
          <button onClick={() => setIsEditing(true)}>Editar Cliente</button>
        </>
      ) : (
        <>
          {/* formulario editable */}
          <p>Modo edición activado (próximamente)</p>
          <button onClick={() => setIsEditing(false)}>Cancelar</button>
          <button>Guardar cambios</button>
        </>
      )}
    </div>
  );
};

export default DataClientForm;

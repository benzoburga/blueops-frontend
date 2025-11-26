//WorkersList.jsx
import { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import WorkerListModal from "../Components/WorkerListModal";
import "../Styles/WorkersList.css";
import { toast } from "@/lib/toast";

// helpers ...
const parseJSON = (s) => { try { return JSON.parse(s || "{}"); } catch { return {}; } };
const getAuthUser = () => parseJSON(localStorage.getItem("authUser"));
const normDate = (d) => (d ? String(d).slice(0, 10) : "");

const mapRows = (rows = []) =>
  rows.map((r) => ({
    identificacion:  r.numero_identificacion ?? "",
    nombre:          r.nombres ?? "",
    apellido:        r.apellidos ?? "",
    direccion:       r.direccion ?? "",
    puesto:          r.puesto ?? "",
    fechaInicio:     normDate(r.fecha_inicio),
    tipo:            r.tipo ?? "",
    sexo:            r.sexo ?? "",
    fechaNacimiento: normDate(r.fecha_nacimiento),
    numero:          r.numero ?? "",
    correo:          r.correo ?? "",
    trabajador_id:   r.id ?? null,
    usuario_id:      r.usuario_id ?? null,
    _raw:            r,
  }));

export default function WorkersList({ workers, setWorkers }) {
  // ¿el padre realmente está controlando Y con datos?
  const parentControls = workers !== undefined && typeof setWorkers === "function";
  const hasParentData  = parentControls && Array.isArray(workers) && workers.length > 0;

  const [ownWorkers, setOwnWorkers] = useState([]);

  // fuente de verdad: si el padre trae datos, úsalo; si no, usa los propios
  const data   = hasParentData ? workers : ownWorkers;
  const setData = hasParentData ? setWorkers : setOwnWorkers;

  const [filtroRiesgo, setFiltroRiesgo] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(!hasParentData);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);

  const [modoEliminar, setModoEliminar] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);

  // Autoload SOLO si el padre no aporta datos
  useEffect(() => {
    if (hasParentData) return;

    const load = async () => {
      setLoading(true);
      try {
        const u = getAuthUser();
        if (!u?.cliente_id) throw new Error("authUser sin cliente_id");
        const { data } = await api.get(`/clientes/${u.cliente_id}/trabajadores`);
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.rows) ? data.rows : []);
        setOwnWorkers(mapRows(arr));
      } catch (e) {
     console.error(e);
     setOwnWorkers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [hasParentData]);

  // buffer de "nuevo trabajador"
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("worker:new");
      if (!raw) return;
      const mapped = mapRows([JSON.parse(raw)])[0];
      setData(prev => {
        if (!mapped) return prev;
        const exists = prev.some(w => String(w.identificacion) === String(mapped.identificacion));
        return exists ? prev : [mapped, ...prev];
      });
      sessionStorage.removeItem("worker:new");
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // creaciones en vivo
  useEffect(() => {
    const onCreated = (e) => {
      const mapped = mapRows([e.detail])[0];
      setData(prev => {
        if (!mapped) return prev;
        const exists = prev.some(w => String(w.identificacion) === String(mapped.identificacion));
        return exists ? prev : [mapped, ...prev];
      });
    };
    window.addEventListener("trabajador:creado", onCreated);
    return () => window.removeEventListener("trabajador:creado", onCreated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // filtro
  const trabajadoresFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return data.filter((t) => {
      const texto = [
        t.identificacion, t.nombre, t.apellido, t.puesto,
        t.fechaInicio, t.tipo, t.direccion,
      ].join(" ").toLowerCase();

    const coincideBusqueda = !q || texto.includes(q);
    const coincideRiesgo =
      filtroRiesgo === "Todos" ||
      String(t.tipo || "").toLowerCase() === String(filtroRiesgo).toLowerCase();

      return coincideBusqueda && coincideRiesgo;
    });
  }, [data, busqueda, filtroRiesgo]);

  // selección múltiple
  const toggleSeleccionado = (id) =>
    setSeleccionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const toggleSeleccionarTodos = () => {
    const ids = trabajadoresFiltrados.map(t => t.identificacion);
    const all = ids.every(id => seleccionados.includes(id));
    setSeleccionados(all ? seleccionados.filter(id => !ids.includes(id)) : [...new Set([...seleccionados, ...ids])]);
  };

  // detalle
  const handleViewDetails = async (row) => {
    try {
      let detail;
      if (row.trabajador_id) {
        const { data } = await api.get(`/trabajadores/${row.trabajador_id}`);
        detail = Array.isArray(data) ? data[0] : data;
      } else {
        const u = getAuthUser();
        const { data } = await api.get(`/clientes/${u?.cliente_id}/trabajadores`, { params: { q: row.identificacion } });
        detail = (Array.isArray(data) ? data.find(x => String(x.numero_identificacion) === String(row.identificacion)) : data) || row._raw || row;
      }
      setSelectedWorker(mapRows([detail])[0] || row);
      setIsModalOpen(true);
    } catch {
      setSelectedWorker(row);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => setIsModalOpen(false);
  const handleSaveChanges = async (updated) => {
  try {
    const id = updated.trabajador_id || selectedWorker?.trabajador_id;
    if (!id) {
      toast?.("No se pudo determinar el ID del trabajador", { type: "error" });
      return;
    }

    const payload = {
      nombre:          updated.nombre ?? "",
      apellido:        updated.apellido ?? "",
      direccion:       updated.direccion ?? "",
      sexo:            updated.sexo ?? "",
      fechaNacimiento: updated.fechaNacimiento || null,
      fechaInicio:     updated.fechaInicio || null,
      puesto:          updated.puesto ?? "", // ← nombre; el back resuelve puesto_id
      numero:          updated.numero ?? "",
      correo:          updated.correo ?? "",
    };

    const { data } = await api.put(`/trabajadores/${id}`, payload);
    const mapped = mapRows([data])[0];

    setData(prev =>
      prev.map(w =>
        (w.trabajador_id === id || w.identificacion === mapped.identificacion)
          ? mapped
          : w
      )
    );

    toast?.("Trabajador actualizado ✅", { type: "success" });
    setIsModalOpen(false);
  } catch (e) {
    console.error("Error actualizando trabajador:", e?.response?.data || e);
    toast?.("No se pudo actualizar el trabajador", { type: "error" });
  }
};

  const handleEliminarSeleccionados = () => {
    if (!modoEliminar) return setModoEliminar(true);
    if (seleccionados.length === 0) return alert("Selecciona al menos un trabajador.");
    if (!confirm(`¿Eliminar ${seleccionados.length} trabajador(es)?`)) return;
    setData(prev => prev.filter(w => !seleccionados.includes(w.identificacion)));
    setSeleccionados([]);
    setModoEliminar(false);
  };
  const handleCancelarEliminar = () => { setModoEliminar(false); setSeleccionados([]); };

  return (
    <div className="workers-list-container">
      <h2>Lista de Trabajadores</h2>

      <div className="filters">
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar..." />
        <select value={filtroRiesgo} onChange={(e) => setFiltroRiesgo(e.target.value)}>
          <option value="Todos">Todos</option>
          <option value="Alto Riesgo">Alto Riesgo</option>
          <option value="Bajo Riesgo">Bajo Riesgo</option>
        </select>
        <button className="btn-eliminar-global" onClick={handleEliminarSeleccionados}>
          {modoEliminar ? "Confirmar Eliminación" : "Eliminar"}
        </button>
        {modoEliminar && <button className="btn-cancelar" onClick={handleCancelarEliminar}>Cancelar</button>}
      </div>

      {!hasParentData && loading ? (
        <div style={{ padding: 12 }}>Cargando trabajadores…</div>
      ) : (
        <table className="workers-table">
          <thead>
            <tr>
              {modoEliminar && (
                <th>
                  <input
                    type="checkbox"
                    onChange={toggleSeleccionarTodos}
                    checked={trabajadoresFiltrados.length > 0 && trabajadoresFiltrados.every(t => seleccionados.includes(t.identificacion))}
                  />
                </th>
              )}
              <th>Identificación</th>
              <th>Nombre y Apellido</th>
              <th>Puesto de Trabajo</th>
              <th>Fecha de Inicio</th>
              <th>Tipo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {trabajadoresFiltrados.map((w, i) => (
              <tr key={w.identificacion || i}>
                {modoEliminar && (
                  <td>
                    <input
                      type="checkbox"
                      checked={seleccionados.includes(w.identificacion)}
                      onChange={() => toggleSeleccionado(w.identificacion)}
                    />
                  </td>
                )}
                <td>{w.identificacion}</td>
                <td>{w.nombre} {w.apellido}</td>
                <td>{w.puesto}</td>
                <td>{w.fechaInicio}</td>
                <td>{w.tipo}</td>
                <td><button className="btn-action" onClick={() => handleViewDetails(w)}>Ver Detalles</button></td>
              </tr>
            ))}
            {trabajadoresFiltrados.length === 0 && (
              <tr><td colSpan={modoEliminar ? 7 : 6}>Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      )}

      {isModalOpen && (
        <WorkerListModal
          worker={selectedWorker}
          onClose={handleCloseModal}
          onSave={handleSaveChanges}
        />
      )}
    </div>
  );
}

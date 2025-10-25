// src/Modulos/Cliente Administrador/Components/WorkerListModal.jsx
import { useState, useMemo, useEffect } from "react";
import "../Styles/WorkerListModal.css";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const parseJSON = (s) => { try { return JSON.parse(s || "{}"); } catch { return {}; } };
const getAuthUser = () => {
  const raw =
    localStorage.getItem("authUser") ||
    localStorage.getItem("user") ||
    localStorage.getItem("currentUser") ||
    "{}";
  const u = parseJSON(raw);
  return {
    token:      u?.token || u?.accessToken || u?.jwt || u?.usuario?.token || null,
    cliente_id: u?.cliente_id ?? u?.clienteId ?? u?.usuario?.cliente_id ?? null,
  };
};

const WorkerListModal = ({ worker, onClose, onSave }) => {
  // estado del form
  const [formData, setFormData] = useState({
    ...worker,
    numero:          worker?.numero ?? "",
    correo:          worker?.correo ?? "",
    sexo:            worker?.sexo ?? "",
    fechaNacimiento: worker?.fechaNacimiento ?? "",
    fechaInicio:     worker?.fechaInicio ?? "",
    puesto:          worker?.puesto ?? "",   // <- importante
    direccion:       worker?.direccion ?? "",
  });

  // puestos desde BD (cliente + globales)
  const [puestos, setPuestos] = useState([]);

  useEffect(() => {
    const auth = getAuthUser();
    if (!auth.cliente_id) return;

    const headers = {};
    if (auth.token) headers.Authorization = `Bearer ${auth.token}`;

    axios
      .get(`${API}/api/clientes/${auth.cliente_id}/puestos_trabajo?incluirGlobales=1`, { headers })
      .then(({ data }) => {
        const arr = Array.isArray(data) ? data : [];
        setPuestos(arr);

        // si el puesto actual del worker no está en la lista, lo agregamos para no perderlo
        const nombres = new Set(arr.map(p => p.nombre));
        if (formData.puesto && !nombres.has(formData.puesto)) {
          setPuestos([{ id: -1, nombre: formData.puesto, tipo_riesgo: "" }, ...arr]);
        }

        // si no hay puesto seleccionado, seleccionar el primero disponible
        if (!formData.puesto && arr.length) {
          setFormData(f => ({ ...f, puesto: arr[0].nombre }));
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "numero") {
      const cleaned = value.replace(/[^\d+ ]/g, "");
      setFormData(prev => ({ ...prev, [name]: cleaned }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // opciones renderizadas (orden alfabético)
  const puestoOptions = useMemo(() => {
    const set = new Set(puestos.map(p => p.nombre));
    // por si el user escribió algo distinto
    if (formData.puesto && !set.has(formData.puesto)) set.add(formData.puesto);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [puestos, formData.puesto]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData); // aquí sigues enviando el nombre del puesto; el back lo resolverá a puesto_id
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Detalles del Trabajador</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Identificación</label>
            <input type="text" name="identificacion" value={formData.identificacion || ""} readOnly />
          </div>

          <div className="form-group">
            <label>Nombre</label>
            <input type="text" name="nombre" value={formData.nombre || ""} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Apellido</label>
            <input type="text" name="apellido" value={formData.apellido || ""} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Dirección</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion || ""}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Sexo</label>
            <select name="sexo" value={formData.sexo || ""} onChange={handleChange}>
              <option value="">Seleccione…</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
          </div>

          <div className="form-group">
            <label>Fecha de Nacimiento</label>
            <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento || ""} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Fecha de Inicio de Labores</label>
            <input type="date" name="fechaInicio" value={formData.fechaInicio || ""} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Puesto de Trabajo</label>
            <select name="puesto" value={formData.puesto || ""} onChange={handleChange}>
              <option value="">Seleccione un puesto…</option>
              {puestoOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          

          <div className="form-group">
            <label>Número de Teléfono</label>
            <input type="tel" name="numero" value={formData.numero || ""} onChange={handleChange} inputMode="tel" maxLength={15} />
          </div>

          <div className="form-group">
            <label>Correo Electrónico</label>
            <input type="email" name="correo" value={formData.correo || ""} onChange={handleChange} />
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-save">Guardar</button>
            <button type="button" className="btn-cancel" onClick={onClose}>Cerrar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkerListModal;

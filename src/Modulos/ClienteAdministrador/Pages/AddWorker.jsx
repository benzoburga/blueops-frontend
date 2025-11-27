//AddWorker.jsx
import { useRef, useState, useEffect } from "react";
import "../styles/addworker.css";
import axios from "axios";
import { toast } from "@/lib/toast";
import BulkWorkersModal from "../Components/BulkWorkersModal";

const getAuthUser = () => {
  try {
    const raw =
      localStorage.getItem("authUser") ||
      localStorage.getItem("user") ||
      localStorage.getItem("currentUser") ||
      "{}";
    const u = JSON.parse(raw);
    return {
      token:
        u?.token || u?.accessToken || u?.jwt || u?.usuario?.token || null,
      cliente_id: u?.cliente_id ?? u?.clienteId ?? u?.usuario?.cliente_id ?? null,
    };
  } catch {
    return { token: null, cliente_id: null };
  }
};

const AddWorker = ({ workers, setWorkers }) => {
  const formRef = useRef();
  const [saving, setSaving] = useState(false);

  const [puestos, setPuestos] = useState([]);
  const [tiposIdent, setTiposIdent] = useState([]);
  const [sexos, setSexos] = useState([]);

  // Modal de múltiples
  const [bulkOpen, setBulkOpen] = useState(false);

  const [formData, setFormData] = useState({
    tipoIdentificacionId: "",
    identificacion: "",
    nombre: "",
    apellido: "",
    sexo: "",
    direccion: "",
    fechaNacimiento: "",
    fechaInicio: "",
    puesto: "",
    numero: "",
    correo: "",
  });

  // Cargar catálogos
  useEffect(() => {
    const { cliente_id, token } = getAuthUser();
    if (!cliente_id) return;

    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    axios
      .get(
        `/api/clientes/${cliente_id}/catalogos/trabajador?incluirGlobales=1`,
        { headers }
      )
      .then(({ data }) => {
        const p = data?.puestos || [];
        const t = data?.tiposIdentificacion || [];
        const s = data?.sexos || [];

        setPuestos(p);
        setTiposIdent(t);
        setSexos(s);

        setFormData((f) => ({
          ...f,
          puesto: p[0]?.nombre || "",
          tipoIdentificacionId: t[0]?.id || "",
          sexo: s[0] || "",
        }));
      })
      .catch(console.error);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toNull = (v) => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    return s === "" ? null : s;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const { cliente_id, token } = getAuthUser();
    if (!cliente_id) return alert("No hay cliente_id en sesión");

    try {
      setSaving(true);
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const { data: created } = await axios.post(
        `/api/clientes/${cliente_id}/trabajadores`,
        {
          ...formData,
          direccion: toNull(formData.direccion),
          fechaNacimiento: toNull(formData.fechaNacimiento),
          fechaInicio: toNull(formData.fechaInicio),
          numero: toNull(formData.numero),
          correo: toNull(formData.correo),
          // 👇 si quieres, podrías agregar aquí un select simple para tipoRiesgoPuesto en el form individual
          // tipoRiesgoPuesto: formData.tipoRiesgoPuesto || null,
        },
        { headers }
      );

      setWorkers?.((prev) => {
        const savedWorker = {
          identificacion: created.numero_identificacion ?? "",
          nombre: created.nombres ?? "",
          apellido: created.apellidos ?? "",
          puesto: created.puesto ?? "",
          fechaInicio: created.fecha_inicio ?? "",
          tipo: created.tipo ?? "",
          sexo: created.sexo ?? "",
          fechaNacimiento: created.fecha_nacimiento ?? "",
          numero: created.numero ?? null,
          correo: created.correo ?? null,
          trabajador_id: created.id ?? null,
          usuario_id: created.usuario_id ?? null,
        };
        const exists = prev?.some(
          (w) => String(w.identificacion) === String(savedWorker.identificacion)
        );
        return exists ? prev : [savedWorker, ...(prev || [])];
      });

      try {
        sessionStorage.setItem("worker:new", JSON.stringify(created));
      } catch {}
      window.dispatchEvent(
        new CustomEvent("trabajador:creado", { detail: created })
      );

      setFormData((f) => ({
        ...f,
        identificacion: "",
        nombre: "",
        apellido: "",
        direccion: "",
        fechaNacimiento: "",
        fechaInicio: "",
        numero: "",
        correo: "",
      }));

      toast("Trabajador creado ✅", { type: "success" });
    } catch (err) {
      console.error("Error al guardar trabajador:", err);
      const msg =
        err?.response?.data?.msg ||
        err?.message ||
        "Error creando trabajador";
      toast(msg, { type: "error", duration: 4500 });
    } finally {
      setSaving(false);
    }
  };

  // 🔥 GUARDA EN BD EN LOTE (incluye tipoRiesgoPuesto)
  const handleBulkAppend = async (rowsFromModal) => {
    const { cliente_id, token } = getAuthUser();
    if (!cliente_id) {
      toast("No hay cliente en sesión", { type: "error" });
      return;
    }

    const rows = (rowsFromModal || [])
      .map((r) => ({
        tipoIdentificacionId: r.tipoIdentificacionId || null,
        identificacion: (r.identificacion || "").trim(),
        nombre: (r.nombre || "").trim(),
        apellido: (r.apellido || "").trim(),
        sexo: r.sexo || null,
        direccion: (r.direccion || "").trim(),
        fechaNacimiento: r.fechaNacimiento || null,
        fechaInicio: r.fechaInicio || null,
        puesto: (r.puesto || "").trim(),
        tipoRiesgoPuesto: r.tipoRiesgoPuesto || "", // 👈 NUEVO
        numero: (r.numero || "").trim() || null,
        correo: (r.correo || "").trim() || null,
      }))
      .filter(
        (r) =>
          r.tipoIdentificacionId && r.identificacion && r.nombre && r.apellido
      );

    if (!rows.length) {
      toast("No hay filas válidas para guardar", { type: "warning" });
      return;
    }

    try {
      setSaving(true);
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const { data } = await axios.post(
        `/api/clientes/${cliente_id}/trabajadores/bulk`,
        { rows },
        { headers }
      );

      const created = Array.isArray(data?.items) ? data.items : [];

      setWorkers?.((prev = []) => [
        ...created.map((w) => ({
          identificacion: w.numero_identificacion ?? "",
          nombre: w.nombres ?? "",
          apellido: w.apellidos ?? "",
          puesto: w.puesto ?? "",
          direccion: w.direccion ?? "",
          fechaInicio: w.fecha_inicio ?? "",
          tipo: w.tipo ?? "",
          sexo: w.sexo ?? "",
          fechaNacimiento: w.fecha_nacimiento ?? "",
          numero: w.numero ?? null,
          correo: w.correo ?? null,
          trabajador_id: w.id ?? null,
          usuario_id: w.usuario_id ?? null,
        })),
        ...prev,
      ]);

      toast(`Se crearon ${created.length} trabajadores ✅`, {
        type: "success",
      });
    } catch (err) {
      console.error("Bulk save error:", err);
      const msg =
        err?.response?.data?.msg || err.message || "Error guardando en lote";
      toast(msg, { type: "error", duration: 5000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="add-worker-container">
      <div className="header-section">
        <h2>Añadir trabajador</h2>

        {/* Botón para abrir modal de múltiples */}
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setBulkOpen(true)}
          title="Añadir múltiples trabajadores"
        >
          + Añadir múltiples
        </button>
      </div>

      <form ref={formRef} className="add-worker-form" onSubmit={handleSubmit}>
        <div className="form-left">
          <label>Modo de identificación</label>
          <select
            name="tipoIdentificacionId"
            value={formData.tipoIdentificacionId}
            onChange={handleChange}
          >
            {tiposIdent.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>

          <div className="dni-row">
            <input
              type="text"
              name="identificacion"
              placeholder="Ingrese el número de identificación"
              value={formData.identificacion}
              onChange={handleChange}
              required
            />
          </div>

          <input
            type="text"
            name="nombre"
            placeholder="Nombres"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="apellido"
            placeholder="Apellidos"
            value={formData.apellido}
            onChange={handleChange}
            required
          />

          <label>Sexo</label>
          <select name="sexo" value={formData.sexo} onChange={handleChange}>
            {sexos.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="direccion"
            placeholder="Dirección"
            value={formData.direccion}
            onChange={handleChange}
          />

          <label>Fecha de nacimiento</label>
          <input
            type="date"
            name="fechaNacimiento"
            value={formData.fechaNacimiento}
            onChange={handleChange}
          />

          <label>Fecha de inicio de labores</label>
          <input
            type="date"
            name="fechaInicio"
            value={formData.fechaInicio}
            onChange={handleChange}
          />

          <label>Puesto de trabajo</label>
          <select name="puesto" value={formData.puesto} onChange={handleChange}>
            {puestos.map((p) => (
              <option
                key={`${p.id ?? "global"}-${p.nombre}`}
                value={p.nombre}
              >
                {p.nombre}
              </option>
            ))}
          </select>

          <label>Número de teléfono</label>
          <input
            type="tel"
            name="numero"
            placeholder="Ej: 922 345 678 (opcional)"
            inputMode="tel"
            maxLength={15}
            value={formData.numero}
            onChange={handleChange}
          />

          <label>Correo electrónico</label>
          <input
            type="email"
            name="correo"
            placeholder="Ej: usuario@correo.com (opcional)"
            value={formData.correo}
            onChange={handleChange}
          />
        </div>
      </form>

      <div className="form-actions">
        <button
          className="btn-save"
          disabled={saving}
          onClick={() => formRef.current.requestSubmit()}
        >
          {saving ? "Guardando..." : "REGISTRAR"}
        </button>
        <button
          type="button"
          className="btn-cancel"
          onClick={() => window.history.back()}
        >
          Cancelar
        </button>
      </div>

      {/* Modal de múltiples */}
      <BulkWorkersModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onConfirm={handleBulkAppend}
        puestos={puestos}
        tiposIdent={tiposIdent}
        sexos={sexos}
      />
    </div>
  );
};

export default AddWorker;

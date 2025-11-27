// src/Modulos/Admin/PublicacionesList.jsx
import { useEffect, useMemo, useState } from "react";
import api, { setAuthToken } from "@/services/api";
import { FiSearch, FiFilePlus, FiUserCheck, FiRefreshCw } from "react-icons/fi";
import { FaStethoscope } from "react-icons/fa";
import "@/styles/publicaciones/publicacioneslist.css";

/* ========= TIPOS (idénticos al backend) ========= */
const MOVEMENT_TYPES = {
  PUBLISH: "PUBLISH",
  ASSIGN: "ASSIGN",
  VERSION_ADD: "VERSION_ADD",
  MEDICO_ASSIGN: "MEDICO_ASSIGN",
};

/* ========= ICONOS / LABELS / BADGE ========= */
const typeMeta = {
  [MOVEMENT_TYPES.PUBLISH]: { label: "Publicación", icon: FiFilePlus, badge: "PUBLICACIÓN" },
  [MOVEMENT_TYPES.ASSIGN]: { label: "Asignación", icon: FiUserCheck, badge: "ASIGNACIÓN" },
  [MOVEMENT_TYPES.VERSION_ADD]: { label: "Versión", icon: FiRefreshCw, badge: "NUEVA VERSIÓN" },
  [MOVEMENT_TYPES.MEDICO_ASSIGN]: { label: "Médico", icon: FaStethoscope, badge: "MÉDICO" },
};

/* ========= HELPERS ========= */
function hhmm(iso) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
}
const safe = (v, fallback = "—") => (v && String(v).trim()) || fallback;

/** Normaliza posibles variantes que vengan del backend o datos antiguos */
function normalizeType(t = "") {
  const s = String(t).toUpperCase();
  if (["PUBLISH", "PUBLICACION", "PUBLICACIÓN"].includes(s)) return MOVEMENT_TYPES.PUBLISH;
  if (["ASSIGN", "ASIGNACION", "ASIGNACIÓN"].includes(s)) return MOVEMENT_TYPES.ASSIGN;
  if (["VERSION_ADD", "NUEVA_VERSION", "NUEVA VERSIÓN", "VERSION"].includes(s)) return MOVEMENT_TYPES.VERSION_ADD;
  if (["MEDICO_ASSIGN", "MEDICO", "MÉDICO"].includes(s)) return MOVEMENT_TYPES.MEDICO_ASSIGN;
  return s;
}

/* ========= BUILDER DE LÍNEA ========= */
function buildLine(m = {}) {
  const type = normalizeType(m.type);
  const archivo =
    m.fileName || m.archivo_nombre || m.archivo || m.nombre_archivo || m.nombre || "Archivo";
  const cliente =
    m.cliente_nombre || m.cliente || m.clientName || m.nombre_cliente || "cliente";
  const apartado =
    m.apartado_nombre || m.apartado || m.sectionName || m.nombre_apartado || "";
  const trabajador =
    m.trabajador_nombre || m.trabajador || m.workerName || m.nombre_trabajador || "";
  const version =
    m.version_nueva ?? m.nueva_version ?? m.version ?? m.num_version ?? "";

  switch (type) {
    case MOVEMENT_TYPES.PUBLISH:
      return apartado
        ? `Se publicó "${archivo}" en "${apartado}" de "${cliente}".`
        : `Se publicó "${archivo}" para "${cliente}".`;

    case MOVEMENT_TYPES.ASSIGN:
      if (trabajador) {
        return `Se asignó "${archivo}" a ${trabajador} (${cliente}).`;
      }
      return `Se asignó "${archivo}" en "${cliente}".`;

    case MOVEMENT_TYPES.VERSION_ADD:
      return `Se añadió una nueva versión "${version || "—"}" al archivo "${archivo}" en "${apartado || "—"}" de "${cliente}".`;

    case MOVEMENT_TYPES.MEDICO_ASSIGN:
      return `Médico subió "${archivo}" para "${cliente}".`;

    default:
      return `Movimiento sobre "${archivo}" para "${cliente}".`;
  }
}

/* ========= COMPONENTE ========= */
export default function PublicacionesList() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar desde backend con retry si 401
  useEffect(() => {
    let cancel = false;

    const getTokenFromStorage = () => {
      try {
        const saved =
          JSON.parse(localStorage.getItem("authUser") || "null") ||
          JSON.parse(sessionStorage.getItem("authUser") || "null") ||
          {};
        return saved?.token || localStorage.getItem("token") || "";
      } catch {
        return "";
      }
    };

    const load = async (retry = true) => {
      setLoading(true);
      try {
        const { data } = await api.get("/movimientos");
        if (cancel) return;
        const arr = Array.isArray(data) ? data : [];
        setRows(arr.map((m) => ({ ...m, type: normalizeType(m.type) })));
      } catch (err) {
        const status = err?.response?.status;
        if (retry && status === 401) {
          const t = getTokenFromStorage();
          if (t) {
            setAuthToken(t);
            return load(false);
          }
        }
        console.error("Error cargando movimientos:", err);
        if (!cancel) setRows([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    };

    load();

    return () => {
      cancel = true;
    };
  }, []);

  // Filtrado + búsqueda + orden
  const data = useMemo(() => {
    return rows
      .filter((e) => (type === "all" ? true : e.type === type))
      .filter((e) => JSON.stringify(e).toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [rows, search, type]);

  return (
    <div className="umv-container">
      <div className="umv-header">
        <h2>Últimos movimientos</h2>

        <div className="umv-search">
          <FiSearch />
          <input
            placeholder="Buscar por archivo, cliente, trabajador…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="umv-filters">
        <button className={type === "all" ? "active" : ""} onClick={() => setType("all")}>
          Todos
        </button>
        {Object.entries(typeMeta).map(([k, v]) => (
          <button key={k} className={type === k ? "active" : ""} onClick={() => setType(k)}>
            {v.label}
          </button>
        ))}
      </div>

      {loading && <div className="umv-loading">Cargando movimientos...</div>}

      {!loading && (
        <>
          <ul className="umv-feed">
            {data.map((e) => {
              const Ico = typeMeta[e.type]?.icon || FiFilePlus;
              const badge = typeMeta[e.type]?.badge || "MOVIMIENTO";
              return (
                <li key={e.id} className="umv-item">
                  <div className={`umv-icon umv-${String(e.type).toLowerCase()}`}>
                    <Ico size={18} />
                  </div>
                  <div className="umv-body">
                    <div className="umv-line">
                      <span className="umv-badge">{badge}</span>
                      <span className="umv-text">{buildLine(e)}</span>
                    </div>
                    <div className="umv-meta">
                      <span className="umv-actor">{safe(e.actor, "—")}</span>
                      <span className="umv-dot">•</span>
                      <span className="umv-time">
                        {new Date(e.timestamp).toLocaleDateString("es-PE")} {hhmm(e.timestamp)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {data.length === 0 && (
            <div className="umv-empty">No hay movimientos que coincidan con tu búsqueda.</div>
          )}
        </>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState, useCallback } from "react";
import "../../styles/GlobalSearch/fileList.css";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

// Convierte a URL absoluta usando el mismo origen del backend (4000)
const abs = (u = "") => {
  if (!u) return "#";
  if (/^https?:\/\//i.test(u)) return u;          // ya es absoluta
  if (u.startsWith("/")) return `${window.location.origin}${u}`; // /files..., /uploads...
  return `/${u}`;                                  // por si viene sin slash
};

export default function FileList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const norm = useCallback((r) => {
    const urlArchivo = r.url_archivo ? abs(String(r.url_archivo)) : "#";
    const tipo = r.tipo === "version" ? "archivo" : r.tipo;

    return {
      id: r.id,
      uid: `${r.tipo}-${r.id}-${r.archivo_id || 0}-${r.carpeta_id || 0}-${r.subcarpeta_id || 0}-${r.ruta || ""}`,
      tipo,
      nombre: r.nombre,
      version: tipo === "archivo"
        ? (r.version != null ? String(r.version).padStart(2, "0") : "no disponible")
        : "no disponible",
      cliente: r.cliente_nombre || "—",
      ruta: r.ruta || "—",
      targetUrl: r.target_url || "",
      urlArchivo,
      carpeta_id: r.carpeta_id || null,
      subcarpeta_id: r.subcarpeta_id || null,
      archivo_id: r.archivo_id || null,
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/admin/buscador");
        const list = Array.isArray(data) ? data.map(norm) : [];
        if (alive) setRows(list);
      } catch (e) {
        console.error("Error cargando buscador admin:", e);
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [norm]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      [r.nombre, r.version, r.cliente, r.ruta, r.tipo]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q))
    );
  }, [rows, searchTerm]);

  const handleRowClick = (row) => {
    if (!row?.targetUrl) return;
    navigate(row.targetUrl);
  };

  const handleNameClick = (e, row) => {
    if (row.tipo !== "archivo") return;
    e.stopPropagation();
    if (row.urlArchivo && row.urlArchivo !== "#") {
      window.open(row.urlArchivo, "_blank", "noopener");
    }
  };

  return (
    <div className="file-list-container">
      <div className="file-list-header">
        <h2>Buscador de Archivos</h2>
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por nombre, ruta, tipo, versión, cliente…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Ruta</th>
              <th>Tipo</th>
              <th>Versión</th>
              <th>Cliente</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="no-results">Cargando…</td></tr>
            ) : filtered.length > 0 ? (
              filtered.map((row) => (
                <tr
                  key={row.uid}
                  onClick={() => handleRowClick(row)}
                  className="clickable-row"
                >
                  <td className="archivo-cell">
                    <span
                      className={row.tipo === "archivo" ? "archivo-nombre link" : "archivo-nombre"}
                      title={row.tipo === "archivo" ? "Vista previa" : "Abrir ubicación"}
                      onClick={(e) => handleNameClick(e, row)}
                    >
                      {row.nombre}
                    </span>
                  </td>
                  <td title={row.ruta}>{row.ruta}</td>
                  <td>{row.tipo}</td>
                  <td>{row.version}</td>
                  <td>{row.cliente}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="no-results">No se encontraron resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

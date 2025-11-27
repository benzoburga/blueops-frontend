// src/Medico/Pages/BuscadorEmos.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarMedico from "../Components/SidebarMedico";
import "../styles/layoutmedico.css";
import api from "@/services/api";

const PAGE_SIZE = 20;

const COLUMNS = [
  { key: "nombre",       label: "Nombre",  width: "28%" },
  { key: "path_display", label: "Ruta",    width: "52%", mono: true },
  { key: "tipo",         label: "Tipo",    width: "10%" },
  { key: "cliente",      label: "Cliente", width: "10%" },
];

// Construye el target SOLO si ya trae trabajador_id
function buildTarget(r) {
  const clienteId =
    r.cliente_id ?? r.clienteId ?? r.client_id ?? r.clientId;
  const trabajadorId =
    r.trabajador_id ?? r.trabajadorId ?? r.trabId ?? r.worker_id ?? r.workerId;

  if (!clienteId || !trabajadorId) return null;

  const base = `/medico/clientes/${clienteId}/trabajadores/${trabajadorId}/emos`;
  const q = new URLSearchParams();
  if (r.carpeta_id ?? r.carpetaId)       q.set("open", String(r.carpeta_id ?? r.carpetaId));
  if (r.subcarpeta_id ?? r.subcarpetaId) q.set("sub", String(r.subcarpeta_id ?? r.subcarpetaId));
  if (r.archivo_id ?? r.archivoId)       q.set("highlight", String(r.archivo_id ?? r.archivoId));
  const tail = q.toString();
  return tail ? `${base}?${tail}` : base;
}

export default function BuscadorEmos() {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem("medico.sidebar_open");
    return saved === null ? true : saved === "true";
  });
  const toggleSidebar = () => {
    setIsOpen(prev => {
      const next = !prev;
      localStorage.setItem("medico.sidebar_open", String(next));
      return next;
    });
  };

  const navigate = useNavigate();
  const [query, setQuery]   = useState("");
  const [page, setPage]     = useState(1);
  const [rows, setRows]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/medico/buscador/emos", {
        params: { query, page, pageSize: PAGE_SIZE },
      });

      // Añadimos target si ya llegó trabajador_id; si no, quedará null y usaremos el resolver al click
      const items = (data?.items ?? []).map(r => ({ ...r, target: buildTarget(r) }));
      setRows(items);
      setTotal(data?.total ?? 0);
    } catch (err) {
      console.error("[BuscadorEmos] error:", err);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [query, page]);

  // ------- Fallback: si falta trabajador_id, resolvemos en backend y navegamos -------
  async function resolveAndNavigate(item) {
    try {
      if (item.target) {
        navigate(item.target);
        return;
      }

      // OJO: AQUÍ ES DONDE ANTES SOLO HACÍA console.warn. Ahora sí llamamos al resolver 👇
      const params = {
        cliente_id: item.cliente_id ?? item.clienteId ?? item.client_id ?? item.clientId ?? null,
        carpeta_id: item.carpeta_id ?? item.carpetaId ?? null,
        subcarpeta_id: item.subcarpeta_id ?? item.subcarpetaId ?? null,
        archivo_id: item.archivo_id ?? item.archivoId ?? null,
      };

      // Si no hay carpet/sub/archivo no se puede inferir
      if (!params.carpeta_id && !params.subcarpeta_id && !params.archivo_id) {
        console.warn("Faltan IDs para resolver:", item);
        alert("No se puede abrir: faltan IDs mínimos (carpeta/subcarpeta/archivo).");
        return;
      }

      const { data } = await api.get("/medico/buscador/resolve", { params });

      if (!data?.ok) {
        console.warn("[Resolver] respuesta:", data);
        alert("No se pudo determinar el trabajador para este resultado.");
        return;
      }

      const enriched = {
        ...item,
        cliente_id: data.cliente_id,
        trabajador_id: data.trabajador_id,
        carpeta_id: data.carpeta_id ?? item.carpeta_id,
        subcarpeta_id: data.subcarpeta_id ?? item.subcarpeta_id,
        archivo_id: data.archivo_id ?? item.archivo_id,
      };

      const target = buildTarget(enriched);
      if (!target) {
        alert("No se pudo construir la ruta de destino.");
        return;
      }
      navigate(target);
    } catch (e) {
      console.error("[Resolver] Error:", e);
      alert("Ocurrió un error al resolver la ubicación.");
    }
  }

  return (
    <div className="layout-container">
      <SidebarMedico isOpen={isOpen} toggleSidebar={toggleSidebar} />
      <main className={`main-content ${isOpen ? "expanded" : "collapsed"}`}>
        <h2 className="title">Buscador EMO’s</h2>

        <input
          type="text"
          className="search-input"
          placeholder="Buscar por cliente, carpeta, subcarpeta o archivo…"
          value={query}
          onChange={(e) => { setPage(1); setQuery(e.target.value); }}
          onKeyDown={(e) => e.key === "Enter" && fetchData()}
        />

        {loading ? (
          <p>Cargando…</p>
        ) : rows.length === 0 ? (
          <p>No se encontraron resultados.</p>
        ) : (
          <table className="workers-table">
            <thead>
              <tr>
                {COLUMNS.map(c => (
                  <th key={c.key} style={{ width: c.width }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={`${r.tipo}-${r.id}`}
                  className={`clickable-row ${!r.target ? "opacity-60" : ""}`}
                  onClick={() => resolveAndNavigate(r)}   // ← AQUÍ VA EL RESOLVER
                  title={r.target ? "Abrir ubicación" : "Intentar resolver y navegar"}
                >
                  {COLUMNS.map(col => {
                    const val = r[col.key] ?? "-";
                    const cls = col.mono ? "font-mono text-sm truncate" : "truncate";
                    return (
                      <td key={col.key} className={cls} title={String(val)}>
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 12 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
          <span>Página {page} de {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</button>
        </div>
      </main>
    </div>
  );
}

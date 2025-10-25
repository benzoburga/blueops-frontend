import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarMedico from "../Components/SidebarMedico";
import "../Styles/LayoutMedico.css";
import { FaSearch } from "react-icons/fa";

const API = (import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:3000/api");

const ClientesMedico = () => {
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

  const [query, setQuery] = useState("");
  const [clientes, setClientes] = useState([]);   // ← datos reales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/clientes`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        });
        if (!res.ok) throw new Error(`Error ${res.status} al cargar clientes`);

        const data = await res.json();
        // adaptar al shape que usa tu UI
        const mapped = data.map(c => ({
          id: c.id,
          ruc: c.ruc ?? "",
          nombreComercial: c.nombre_comercial ?? "",
          representanteLegal: c.representante_nombre || "Sin registrar",
          empresa: "BLUE OPS", // si no quieres mostrarlo, quita el chip en el UI
        }));
        if (alive) setClientes(mapped);
      } catch (e) {
        console.error(e);
        if (alive) setError(e.message || "No se pudo cargar clientes.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const rows = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return clientes;
    return clientes.filter((c) =>
      `${c.nombreComercial} ${c.representanteLegal} ${c.ruc} ${c.empresa}`
        .toLowerCase()
        .includes(q)
    );
  }, [query, clientes]);

  const handleClick = (id) => navigate(`/medico/clientes/${id}/trabajadores`);

  return (
    <div className="layout-container">
      <SidebarMedico isOpen={isOpen} toggleSidebar={toggleSidebar} />
      <main className={`main-content ${isOpen ? "expanded" : "collapsed"}`}>
        <div className="header-row">
          <h2 className="title">Clientes</h2>
          <div className="search-wrapper">
            <FaSearch />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar cliente aquí…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {loading && <p style={{ textAlign: "center", marginTop: 24 }}>Cargando clientes…</p>}
        {error && !loading && <p style={{ textAlign: "center", marginTop: 24, color: "crimson" }}>{error}</p>}

        {!loading && !error && (
          <>
            <ul className="clients-grid">
              {rows.map((c) => (
                <li
                  key={c.id}
                  className="client-card"
                  onClick={() => handleClick(c.id)}
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" ? handleClick(c.id) : null)}
                >
                  <div className="client-title">{c.nombreComercial}</div>

                  <div className="client-meta">
                    <span className="chip">
                      <span className="chip-label">RUC</span>
                      <span className="chip-value">{c.ruc}</span>
                    </span>
                    <span className="chip">
                      <span className="chip-label">Empresa</span>
                      <span className="chip-value">{c.empresa}</span>
                    </span>
                  </div>

                  <div className="client-foot">
                    <span className="rep-label">Representante</span>
                    <span className="rep-value">{c.representanteLegal}</span>
                  </div>
                </li>
              ))}
            </ul>

            {rows.length === 0 && (
              <p style={{ textAlign: "center", marginTop: 24 }}>
                No se encontraron clientes.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default ClientesMedico;

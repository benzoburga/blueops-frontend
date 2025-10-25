import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SidebarMedico from "../Components/SidebarMedico";
import "../Styles/LayoutMedico.css";
import { FaSearch, FaUserCircle } from "react-icons/fa";
import api from "@/services/api";

const TrabajadoresDelCliente = () => {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem("medico.sidebar_open");
    return saved === null ? true : saved === "true";
  });
  const toggleSidebar = () => {
    setIsOpen((prev) => {
      const next = !prev;
      localStorage.setItem("medico.sidebar_open", String(next));
      return next;
    });
  };

  const navigate = useNavigate();
  const { id } = useParams(); // cliente_id
  const [q, setQ] = useState("");

  const [clienteNombre, setClienteNombre] = useState(""); // título
  const [trabajadores, setTrabajadores] = useState([]);   // data real
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Cargar nombre del cliente y trabajadores reales
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        // 1) clientes -> buscar el nombre
        const { data: dataClientes } = await api.get("/clientes");
        const c = dataClientes.find((x) => String(x.id) === String(id));
        if (alive) setClienteNombre(c?.nombre_comercial || "");

        // 2) trabajadores del cliente
        const { data } = await api.get(`/clientes/${id}/trabajadores`);
        const mapped = (data || []).map((t) => ({
          id: t.id,
          dni: t.numero_identificacion ?? "",
          nombreCompleto:
            t.nombreCompleto ??
            `${t.nombres || ""} ${t.apellidos || ""}`.trim(),
          puesto: t.puesto || "—",
          riesgo: t.riesgo || "",
        }));

        if (alive) setTrabajadores(mapped);
      } catch (e) {
        console.error(e);
        if (alive)
          setError(
            e?.response?.data?.msg ||
              e?.message ||
              "No se pudo cargar trabajadores."
          );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // Filtro local
  const rows = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return trabajadores;
    return trabajadores.filter((t) =>
      `${t.nombreCompleto} ${t.puesto} ${t.riesgo} ${t.dni}`
        .toLowerCase()
        .includes(s)
    );
  }, [q, trabajadores]);

  const goDetalle = (trabId) =>
    navigate(`/medico/clientes/${id}/trabajadores/${trabId}/emos`);

  return (
    <div className="layout-container">
      <SidebarMedico isOpen={isOpen} toggleSidebar={toggleSidebar} />

      <main className={`main-content ${isOpen ? "expanded" : "collapsed"}`}>
        <div className="header-row">
          <h2 className="title">
            Trabajadores {clienteNombre ? `· ${clienteNombre}` : ""}
          </h2>
          <div className="search-wrapper">
            <FaSearch />
            <input
              className="search-input"
              placeholder="Buscar por nombre, puesto, DNI…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {loading && (
          <p style={{ textAlign: "center", marginTop: 24 }}>Cargando…</p>
        )}
        {error && !loading && (
          <p style={{ textAlign: "center", marginTop: 24, color: "crimson" }}>
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <ul className="worker-list">
              {rows.map((t) => (
                <li
                  key={t.id}
                  className="worker-item"
                  onClick={() => goDetalle(t.id)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && goDetalle(t.id)}
                >
                  <div className="worker-avatar">
                    <FaUserCircle />
                  </div>
                  <div className="worker-main">
                    <div className="worker-name">{t.nombreCompleto}</div>
                    <div className="worker-sub">
                      <span className="badge">{t.puesto}</span>
                      <span
                        className={`badge ${
                          t.riesgo === "Alto" ? "danger" : "ok"
                        }`}
                      >
                        {t.riesgo || "—"}
                      </span>
                      <span className="muted">DNI: {t.dni || "—"}</span>
                    </div>
                  </div>
                  <div className="worker-cta">Ver</div>
                </li>
              ))}
            </ul>

            {rows.length === 0 && (
              <p style={{ textAlign: "center", marginTop: 24 }}>
                Sin resultados.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default TrabajadoresDelCliente;

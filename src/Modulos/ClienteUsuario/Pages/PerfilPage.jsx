import { useEffect, useRef, useState } from "react";
import DashboardClienteUsuario from "../Components/DashboardClienteUsuario";
import { getPerfilClienteUsuario } from "../../../services/trabajadoresService.js";

export default function PerfilPage() {
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const calledRef = useRef(false);

  // PerfilPage.jsx
useEffect(() => {
  if (calledRef.current) return;
  calledRef.current = true;

  let alive = true;
  (async () => {
    try {
      const data = await getPerfilClienteUsuario();   // axios GET
      console.log("[perfil] data:", data);
      const perfil = Array.isArray(data) ? data[0] : data;   // 👈 tolera array u objeto
      if (!alive) return;
      setWorker(perfil || null);
    } catch (e) {
      if (!alive) return;
      setErr(e.message || String(e));
    } finally {
      if (alive) setLoading(false);
    }
  })();

  return () => { alive = false; };
}, []);


  if (loading) return <p>Cargando perfil…</p>;
  if (err) return <p>Error: {err}</p>;
  if (!worker) return <p>No hay datos del trabajador.</p>;

  return <DashboardClienteUsuario worker={worker} />;
}

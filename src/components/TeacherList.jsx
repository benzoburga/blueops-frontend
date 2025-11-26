import { useEffect, useState } from 'react';
import '../styles/teacherlist.css';
import { BiShow, BiMinusCircle } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, confirmToast } from '@/lib/toast';

export default function TeacherList({ searchText, isDeleteMode, compact = false }) {
  const [teachers, setTeachers] = useState([]);
  const navigate = useNavigate();

  // Cargar clientes activos
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`/api/clientes`);
        setTeachers(data || []);
      } catch (e) {
        console.error(e);
        toast('No se pudo cargar clientes', { type: 'error' });
      }
    })();
  }, []);

  const handleViewClient = (ruc) => navigate(`/admin/ver-cliente/${ruc}`);

  // Archivar (soft-delete) con confirm-toast
  const handleArchive = async (row) => {
    const ok = await confirmToast(`¿Archivar al cliente “${row.nombre_comercial}” (RUC ${row.ruc})?`);
    if (!ok) return;
    try {
      await axios.post(`/api/clientes/${row.id}/archivar`, { user_id: null });
      setTeachers(prev => prev.filter(t => t.id !== row.id));
      toast('Cliente archivado', { type: 'success' });
    } catch (e) {
      console.error(e);
      toast('No se pudo archivar el cliente', { type: 'error' });
    }
  };

  const filtered = teachers.filter(t =>
    Object.values(t).some(v => String(v ?? '').toLowerCase().includes(searchText.toLowerCase()))
  );

  // ======= VISTA COMPACTA (MÓVIL) =======
 if (compact) {
  return (
    <ul className="client-compact-list">
      {filtered.length ? filtered.map(row => (
        <li
          key={row.id}
          className="client-compact"
          onClick={() =>
            navigate(`/admin/archivos-cliente/${encodeURIComponent(row.nombre_comercial)}`)
          }
          title={row.nombre_comercial}
        >
          <div className="client-compact__name">{row.nombre_comercial}</div>

          <div className="client-compact__actions" onClick={e => e.stopPropagation()}>
            {isDeleteMode ? (
              <button className="btn-ghost danger" aria-label={`Archivar ${row.nombre_comercial}`} onClick={() => handleArchive(row)}>
                <BiMinusCircle size={20}/>
              </button>
            ) : (
              <button className="view-btn" aria-label={`Ver ${row.nombre_comercial}`} onClick={() => handleViewClient(row.ruc)}>
                <BiShow size={18}/>
              </button>
            )}
          </div>
        </li>
      )) : <p>No se encontraron resultados</p>}
    </ul>
  );
}

  // ======= VISTA TABLA (DESKTOP / LANDSCAPE) =======
  return (
    <div className="teacher--list">
      <div className="column--titles">
        <span>Nombre Comercial</span>
        <span>Representante Legal</span>
        <span>RUC</span>
        <span>Empresa</span>
        <span></span>
      </div>

      <div className="list--container">
        {filtered.length ? filtered.map(row => (
          <div
            className="list"
            key={row.id}
            onClick={() =>
              navigate(`/admin/archivos-cliente/${encodeURIComponent(row.nombre_comercial)}`)
            }
          >
            <span title={row.nombre_comercial}>{row.nombre_comercial}</span>
            <span title={row.representante_nombre}>{row.representante_nombre}</span>
            <span>{row.ruc}</span>
            <span>BLUE OPS</span>

            <span className="teacher--todo tooltip" onClick={(e) => e.stopPropagation()}>
              {isDeleteMode ? (
                <BiMinusCircle onClick={() => handleArchive(row)} className="delete-icon" />
              ) : (
                <>
                  <BiShow onClick={() => handleViewClient(row.ruc)} />
                  <span className="tooltip-text">Ver información del cliente</span>
                </>
              )}
            </span>
          </div>
        )) : <p>No se encontraron resultados</p>}
      </div>
    </div>
  );
}

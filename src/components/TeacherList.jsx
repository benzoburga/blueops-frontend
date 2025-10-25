import { useEffect, useState } from 'react';
import '../styles/teacherList.css';
import { BiShow, BiMinusCircle } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, confirmToast } from '@/lib/toast';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function TeacherList({ searchText, isDeleteMode }) {
  const [teachers, setTeachers] = useState([]);
  const navigate = useNavigate();

  // Cargar clientes activos
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/api/clientes`);
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
      await axios.post(`${API}/api/clientes/${row.id}/archivar`, { user_id: null });
      setTeachers(prev => prev.filter(t => t.id !== row.id)); // quitar de la lista
      toast('Cliente archivado', { type: 'success' });
    } catch (e) {
      console.error(e);
      toast('No se pudo archivar el cliente', { type: 'error' });
    }
  };

  const filtered = teachers.filter(t =>
    Object.values(t).some(v => String(v ?? '').toLowerCase().includes(searchText.toLowerCase()))
  );

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
            key={row.id}                                      // usa ID
            onClick={() => navigate(`/admin/archivos-cliente/${encodeURIComponent(row.nombre_comercial)}`)}
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

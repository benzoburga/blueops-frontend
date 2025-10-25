//CreateClientForm.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import RucSearch from './RucSearch';
import ClientGeneralData from './ClientGeneralData';
import ClientWorkerTable from './ClientWorkerTable';
import ClientAdminTable from './ClientAdminTable';
import '../../styles/CreateClient/createClient.css';
import { toast } from '../../lib/toast';
import ClientActivitiesTable from './ClientActivitiesTable';

// Base con /api incluido
const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const CreateClientForm = () => {
  const [cliente, setCliente] = useState({
    ruc: '',
    nombre_comercial: '',
    domicilio_fiscal: '',
    fecha_inscripcion: '',
    fecha_inicio_actividades: '',
    actividad_economica: '',
    tipo_contribuyente_id: '',
    estado_contribuyente_id: '',
    condicion_contribuyente_id: '',
    sistema_contabilidad_id: '',
  });

  const [catalogos, setCatalogos] = useState({ tipos: [], estados: [], condiciones: [], sistemas: [] });
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [errorCatalogos, setErrorCatalogos] = useState(null);
  const [actividades, setActividades] = useState([
  // opcional: fila vacía por defecto
  // { ciiu_codigo: "", descripcion: "", es_principal: true }
]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/catalogos`);
        const norm = {
          tipos: data?.tipos ?? [],
          estados: data?.estados ?? [],
          condiciones: data?.condiciones ?? [],
          sistemas: data?.sistemas ?? [],
        };
        setCatalogos(norm);

        setCliente(prev => ({
          ...prev,
          tipo_contribuyente_id: prev.tipo_contribuyente_id || norm.tipos[0]?.id || '',
          estado_contribuyente_id: prev.estado_contribuyente_id || norm.estados[0]?.id || '',
          condicion_contribuyente_id: prev.condicion_contribuyente_id || norm.condiciones[0]?.id || '',
          sistema_contabilidad_id: prev.sistema_contabilidad_id || norm.sistemas[0]?.id || '',
        }));

        setErrorCatalogos(null);
      } catch (e) {
        console.error('[catalogos][error]', e);
        setErrorCatalogos('No se pudieron cargar los catálogos.');
        setCatalogos({ tipos: [], estados: [], condiciones: [], sistemas: [] });
      } finally {
        setLoadingCatalogos(false);
      }
    })();
  }, []);

  const [representantes, setRepresentantes] = useState([]);
  const [indicadores, setIndicadores] = useState([]);

  const handleGuardar = async () => {
    try {
      if (
        !cliente.ruc ||
        !cliente.nombre_comercial ||
        !cliente.tipo_contribuyente_id ||
        !cliente.estado_contribuyente_id ||
        !cliente.condicion_contribuyente_id
      ) {
        toast('Completa los campos obligatorios del cliente.', { type: 'warn' });
        return;
      }

      const payload = { cliente, representantes, indicadores, actividades };
      await axios.post(`${API}/clientes`, payload);          // ✅ sin doble /api

      toast('Cliente creado correctamente ✅', { type: 'success', duration: 3500 });
    } catch (e) {
      const msg = e?.response?.data?.message || 'No se pudo crear el cliente.';
      toast(msg, { type: 'error', duration: 4500 });
    }
  };

  return (
    <div className="create-client">
      <h2>Crear Nuevo Cliente</h2>

      <RucSearch
  value={cliente.ruc}
  onChange={(ruc)=> setCliente(p=>({ ...p, ruc }))}
  onFill={(dataParcial)=> {
    setCliente(p=>({ ...p, ...dataParcial }));
    if (dataParcial?.actividad_economica && actividades.length === 0) {
      setActividades([{
        ciiu_codigo: (dataParcial.actividad_economica.match(/\d{4}/)?.[0]) || "",
        descripcion: dataParcial.actividad_economica,
        es_principal: true
      }]);
    }
  }}
/>

      {loadingCatalogos ? (
        <p>Cargando catálogos…</p>
      ) : errorCatalogos ? (
        <p style={{color:'crimson'}}>{errorCatalogos}</p>
      ) : (
        <ClientGeneralData
          cliente={cliente}
          setCliente={setCliente}
          catalogos={catalogos}
        />
      )}
      <ClientActivitiesTable
        actividades={actividades}
        setActividades={setActividades}
      />

      <ClientWorkerTable
        indicadores={indicadores}
        setIndicadores={setIndicadores}
      />

      <ClientAdminTable
        representantes={representantes}
        setRepresentantes={setRepresentantes}
      />

      <button className="save-button" onClick={handleGuardar}>Guardar Cliente</button>
    </div>
  );
};

export default CreateClientForm;

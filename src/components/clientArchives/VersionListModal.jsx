import { useEffect, useRef, useState } from 'react';
import '../../styles/versionlistmodal/versionlistmodal.css';
import { FaEye, FaDownload, FaTrash, FaFolderOpen } from 'react-icons/fa';
import ModalConfirmAdapter from '@/components/ModalConfirmAdapter';

const VersionListModal = ({ file, onClose, onDeleteVersion, onSetAsMain, onDownloadVersion }) => {
  // Estado local con la lista que se pinta
  const [versions, setVersions] = useState(Array.isArray(file?.versions) ? file.versions : []);
  const [confirmState, setConfirmState] = useState({ open: false, version: null });
  const [busy, setBusy] = useState(false);
  const mountedRef = useRef(true);

  // Mantén un guard para no setState tras unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Rehidrata al cambiar de archivo
  useEffect(() => {
    setVersions(Array.isArray(file?.versions) ? file.versions : []);
  }, [file]);

  if (!file) return null;

  const handleView = (version) => {
    if (!version?.url) return alert('No se encontró el archivo para visualizar.');
    window.open(`${API}${version.url}`, '_blank');
  };

  const handleDownload = (version) => {
   if (!version?.id) return alert('Versión inválida.');
   if (typeof onDownloadVersion === 'function') {
     onDownloadVersion(version); // usa el endpoint /api/archivos/versiones/:id/descargar
   }
 };

  const requestDelete = (version) => {
    if (!version) return;
    // Evita pedir eliminar la vigente (el backend devolvería 409)
    if (version.vigente) {
      alert('No puedes eliminar la versión vigente. Marca otra como vigente primero.');
      return;
    }
    setConfirmState({ open: true, version });
  };

  const confirmDelete = async () => {
  const ver = confirmState.version;
  setConfirmState({ open: false, version: null });
  if (!ver?.id) return;

  try {
    setBusy(true);
    const res = await fetch(`/api/archivos/versiones/${ver.id}`, { method: 'DELETE' });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const j = await res.json(); if (j?.message) msg = j.message; } catch {}
      alert(msg);
      return;
    }

    // 1) quitar de la lista local del modal
    setVersions(prev => (Array.isArray(prev) ? prev.filter(v => v?.id !== ver.id) : []));

    // 2) avisar al padre SOLO para que actualice su estado/árbol (sin DELETE)
    if (typeof onDeleteVersion === 'function') {
      onDeleteVersion(ver); // <-- una sola vez
    }
  } catch (e) {
    console.error('Error eliminando versión:', e);
    alert('No se pudo eliminar la versión.');
  } finally {
    setBusy(false);
  }
};


  const cancelDelete = () => setConfirmState({ open: false, version: null });

  const handleSetAsMain = async (version) => {
    if (!version?.id) return;
    try {
      setBusy(true);
      const res = await fetch(`/api/archivos/versiones/${version.id}/vigente`, { method: 'PUT' });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); if (j?.message) msg = j.message; } catch {}
        alert(msg);
        return;
      }

      // Marca localmente la vigente
      if (mountedRef.current) {
        setVersions(prev => {
          const arr = Array.isArray(prev) ? prev : [];
          return arr.map(v => ({ ...v, vigente: v?.id === version.id }));
        });
      }

      if (typeof onSetAsMain === 'function') await onSetAsMain(version);
    } catch (error) {
      console.error('Error al establecer como vigente:', error);
      alert('No se pudo establecer la versión como vigente.');
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const list = Array.isArray(versions) ? versions : [];

  return (
    <div className="version-modal-overlay" onClick={onClose}>
      <div className="version-modal-content wide" onClick={(e) => e.stopPropagation()}>
        <h3>Versiones de: <span className="file-title">{file.name}</span></h3>

        {list.length > 0 ? (
          <table className="version-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Versión</th>
                <th>Fecha de Subida</th>
                <th>Fecha de Aprobación</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((ver) => (
                <tr key={ver?.id ?? ver?.name}>
                  <td>{ver?.name || 'No aplica'}</td>
                  <td>{ver?.version || 'No aplica'}</td>
                  <td>{ver?.uploadDate || 'No aplica'}</td>
                  <td>{ver?.approvalDate || 'No aplica'}</td>
                  <td className="actions">
                    <FaEye title="Ver" onClick={() => !busy && handleView(ver)} />
                    <FaDownload title="Descargar" onClick={() => !busy && onDownloadVersion?.(ver)} />
                    <FaTrash
                      title={ver?.vigente ? 'No se puede eliminar la vigente' : 'Eliminar'}
                      style={{ opacity: busy || ver?.vigente ? 0.5 : 1, cursor: busy || ver?.vigente ? 'not-allowed' : 'pointer' }}
                      onClick={() => !busy && requestDelete(ver)}
                    />
                    <FaFolderOpen
                      title="Establecer como vigente"
                      style={{ cursor: busy ? 'not-allowed' : 'pointer', color: ver?.vigente ? 'green' : 'black', opacity: busy ? 0.5 : 1 }}
                      onClick={() => !busy && handleSetAsMain(ver)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No hay versiones aún.</p>
        )}

        <button className="close-btn" onClick={onClose} disabled={busy}>Cerrar</button>

        <ModalConfirmAdapter
          open={confirmState.open}
          title="Confirmar eliminación"
          message="¿Seguro que deseas eliminar esta versión?"
          onAccept={confirmDelete}
          onCancel={cancelDelete}
        />
      </div>
    </div>
  );
};

export default VersionListModal;

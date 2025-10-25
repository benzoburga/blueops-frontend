//WorkerDocumentsModal.jsx
import { FaDownload, FaTrash, FaEye } from 'react-icons/fa';
import '../Styles/WorkerDocumentsModal.css';

const WorkerDocumentsModal = ({ isOpen, onClose, worker, onDeleteFile }) => {
  if (!isOpen || !worker) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        <h3>📄 Documentos de <strong>{worker.name}</strong></h3>

        {worker.documents.length > 0 ? (
          <table className="doc-table">
            <thead>
              <tr>
                <th>Nombre del Documento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {worker.documents.map((doc, idx) => (
                <tr key={idx}>
                  <td>{doc.name}</td>
                  <td className="actions">
                    <FaEye title="Ver" onClick={() => window.open(doc.url, '_blank')} />
                    <FaDownload
                      title="Descargar"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = doc.url;
                        link.download = doc.name;
                        link.click();
                      }}
                    />
                    <FaTrash title="Eliminar" onClick={() => onDeleteFile(worker, idx)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No hay archivos aún.</p>
        )}

        <button onClick={onClose} className="close-btn">Cerrar</button>
      </div>
    </div>
  );
};

export default WorkerDocumentsModal;

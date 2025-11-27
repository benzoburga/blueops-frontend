import React from "react";
import '../styles/deleteconfirmmodal.css';
 // crea si deseas estilos bonitos

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h4>Confirmar eliminación</h4>
        <p>{message}</p>
        <div className="modal-actions">
          <button onClick={onConfirm} className="confirm-btn">Sí, eliminar</button>
          <button onClick={onClose} className="cancel-btn">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;

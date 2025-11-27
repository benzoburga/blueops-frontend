// src/components/NameInputModal.jsx
import React, { useState } from 'react';
import '../styles/nameinputmodal.css';

const NameInputModal = ({ isOpen, onClose, onSubmit, title = "Ingrese el nombre:" }) => {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSubmit(inputValue.trim());
      setInputValue('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title}</h3>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Nombre de la carpeta"
        />
        <div className="modal-buttons">
          <button onClick={handleSubmit}>Aceptar</button>
          <button onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default NameInputModal;

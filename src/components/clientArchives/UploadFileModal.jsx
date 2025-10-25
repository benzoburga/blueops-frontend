import React, { useState } from 'react';
import '../../styles/UploadFileModal/UploadFileModal.css';
import { FaTimes, FaFolder, FaCalendarAlt, FaPaperclip, FaFileAlt, FaFileExcel, FaFilePowerpoint } from 'react-icons/fa';

const UploadFileModal = ({ isOpen, onClose, handleFileUpload, isVersionUpload = false }) => {

  const [selectedFile, setSelectedFile] = useState(null);
  const [code, setCode] = useState("");
  const [approvalDate, setApprovalDate] = useState("");
  const [version, setVersion] = useState("1");

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      const allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel .xlsx
        'application/vnd.ms-excel', // Otra variante de Excel
        'application/vnd.openxmlformats-officedocument.presentationml.presentation' // PowerPoint .pptx
      ];

      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        alert('Solo se permiten archivos en formato PDF, Word, Excel o PPT.');
      }
    }
  };

  // Función para obtener el icono según el tipo de archivo
  const getFileIcon = (fileName) => {
    if (!fileName) return <FaFileAlt />;
    if (fileName.endsWith('.pdf')) return <FaFileAlt />;
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return <FaFileAlt />;
    if (fileName.endsWith('.xlsx')) return <FaFileExcel />;
    if (fileName.endsWith('.pptx')) return <FaFilePowerpoint />;
    return <FaFileAlt />;
  };

const handleSubmit = () => {
  if (!selectedFile) {
    alert("Por favor seleccione un archivo.");
    return;
  }

  handleFileUpload(selectedFile, code, approvalDate, version);
  onClose(); // Cierra el modal después de la subida
};


  return isOpen ? (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Encabezado */}
        <div className="modal-header">
          <FaFolder className="modal-icon" />
          <h2>Políticas y reglamentos JetSmart</h2>
          <FaTimes className="close-icon" onClick={onClose} />
        </div>

        <h3 className="modal-title">Subir este archivo</h3>

        {/* Línea de archivo seleccionado */}
        <div className="selected-file">
          <FaPaperclip className="attach-icon" onClick={() => document.getElementById('fileInput').click()} style={{ cursor: 'pointer' }} />
          <span>{selectedFile ? selectedFile.name : "Seleccione un archivo (PDF, Word, Excel o PPT)"}</span>
          {getFileIcon(selectedFile ? selectedFile.name : "")}
        </div>

        {/* Input oculto para seleccionar archivo */}
        <input
          type="file"
          id="fileInput"
          style={{ display: 'none' }}
          accept=".pdf,.doc,.docx,.xlsx,.pptx"
          onChange={handleFileChange}
        />

        {/* Formulario */}
        <div className="modal-body">
          <div className="input-group">
            <label>Código:</label>
            <input type="text" className="modal-input" placeholder="Ingrese código" value={code} onChange={(e) => setCode(e.target.value)} />

            <label>Versión:</label>
            <input type="number" className="modal-input small" min="1" value={version} onChange={(e) => setVersion(e.target.value)} />
          </div>

          <label>Seleccione fecha de aprobación:</label>
          <div className="modal-input date-picker">
            <FaCalendarAlt className="calendar-icon" />
            <input type="date" value={approvalDate} onChange={(e) => setApprovalDate(e.target.value)} />
          </div>
        </div>

        {/* Botones */}
        <div className="modal-footer">
          <button className="modal-btn submit" onClick={handleSubmit}>Enviar</button>
          <button className="modal-btn cancel" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  ) : null;
};

export default UploadFileModal;

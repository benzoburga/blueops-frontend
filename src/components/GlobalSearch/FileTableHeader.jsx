import React from 'react';
import '../../styles/globalsearch/filelist.css';

const FileTableHeader = () => {
  return (
    <div className="file-table-header">
      <span>Archivo</span>
      <span>Código</span>
      <span>Versión</span>
      <span>Empresa</span>
    </div>
  );
};

export default FileTableHeader;

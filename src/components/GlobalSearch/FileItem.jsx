import React from 'react';
import '../../styles/GlobalSearch/fileList.css';
import { FaFilePdf, FaFileWord, FaEllipsisV } from 'react-icons/fa';

const FileItem = ({ file }) => {
  const getFileIcon = (fileName) => {
    if (fileName.endsWith('.pdf')) return <FaFilePdf className="pdf-icon" />;
    if (fileName.endsWith('.docx')) return <FaFileWord className="word-icon" />;
    return null;
  };

  return (
    <div className="file-item">
      <span className="file-icon">{getFileIcon(file.name)}</span>
      <span className="file-name">{file.name}</span>
      <span>{file.code}</span>
      <span>{file.version}</span>
      <span>{file.company}</span>
      <span className="file-options">
        <FaEllipsisV />
      </span>
    </div>
  );
};

export default FileItem;

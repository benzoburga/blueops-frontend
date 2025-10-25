//FileTreeWithCheckbox.jsx
import  { useMemo, useState } from 'react';
import { FaFilePdf } from 'react-icons/fa';

// Icono básico por extensión
const getFileIcon = (name = '') => {
  const ext = String(name).split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf': return <FaFilePdf />;
    default:    return <FaFilePdf />;
  }
};

const FileRow = ({ file, isEnabled, isChecked, toggleFile }) => (
  <div className="file-item">
    <span className="file-icon">{getFileIcon(file.name)}</span>
    <span className="file-name">{file.name}</span>
    <span>{file.code}</span>
    <span>{file.approvalDate}</span>
    <span>{file.version}</span>
    <span>{file.uploadDate}</span>
    <span>
      <input
        type="checkbox"
        disabled={!isEnabled}
        checked={isChecked(file)}
        onChange={() => toggleFile(file)}
      />
    </span>
  </div>
);

// Nodo de carpeta recursivo
const FolderNode = ({
  node,                // { name/year, files:[], subfolders:[] }
  depth = 0,
  pathKey,             // string único acumulado para llaves de apertura
  openMap, setOpenMap,
  isEnabled,
  isChecked,
  toggleFile,
}) => {
  const label = node.year ?? node.name ?? '';
  const key = `${pathKey}/${label}`;

  const isOpen = !!openMap[key];
  const toggleOpen = () => setOpenMap(prev => ({ ...prev, [key]: !prev[key] }));

  // Orden: primero por "orden" (si existe), después alfabético
  const subfolders = useMemo(() => {
    const arr = Array.isArray(node.subfolders) ? node.subfolders : [];
    return [...arr].sort((a, b) => {
      const o = (a.orden ?? 0) - (b.orden ?? 0);
      return o !== 0 ? o : String(a.name ?? a.year ?? '').localeCompare(String(b.name ?? b.year ?? ''));
    });
  }, [node.subfolders]);

  const files = Array.isArray(node.files) ? node.files : [];

  return (
    <div className="subfolder-content" style={{ marginLeft: depth ? 16 : 0 }}>
      <div className="subfolder-header" onClick={toggleOpen}>
        <span>{isOpen ? '📂' : '📁'} {label}</span>
      </div>

      {isOpen && (
        <>
          {subfolders.map((sf, idx) => (
            <FolderNode
              key={`${key}/sf-${idx}-${sf.id ?? sf.name}`}
              node={sf}
              depth={depth + 1}
              pathKey={key}
              openMap={openMap}
              setOpenMap={setOpenMap}
              isEnabled={isEnabled}
              isChecked={isChecked}
              toggleFile={toggleFile}
            />
          ))}

          {(files || []).map((file, i) => (
            <FileRow
              key={`${key}/f-${file.id ?? i}`}
              file={file}
              isEnabled={isEnabled}
              isChecked={isChecked}
              toggleFile={toggleFile}
            />
          ))}

          {subfolders.length === 0 && files.length === 0 && (
            <div className="empty-folder-msg">Esta carpeta está vacía.</div>
          )}
        </>
      )}
    </div>
  );
};

const FileTreeWithCheckbox = ({ filesData = [], selectedFiles, setSelectedFiles, isEnabled }) => {
  const [openMap, setOpenMap] = useState({}); // { pathKey: boolean }

  const isChecked = (file) => selectedFiles.some(f => f.id === file.id);
  const toggleFile = (file) => {
    if (!isEnabled) return;
    setSelectedFiles(prev => {
      const exists = prev.some(f => f.id === file.id);
      return exists ? prev.filter(f => f.id !== file.id) : [...prev, file];
    });
  };

  // Ordena raíces
  const roots = useMemo(() => {
    const arr = Array.isArray(filesData) ? filesData : [];
    return [...arr].sort((a, b) => {
      const o = (a.orden ?? 0) - (b.orden ?? 0);
      return o !== 0 ? o : String(a.year ?? a.name ?? '').localeCompare(String(b.year ?? b.name ?? ''));
    });
  }, [filesData]);

  return (
    <div>
      <div className="table-header">
        <span>Carpeta</span>
        <span>Archivo</span>
        <span>Código</span>
        <span>Fecha de Aprobación</span>
        <span>Versión</span>
        <span>Fecha de Subida</span>
      </div>

      {roots.map((root, idx) => (
        <FolderNode
          key={`root-${root.carpeta_id ?? idx}`}
          node={root}
          depth={0}
          pathKey="root"
          openMap={openMap}
          setOpenMap={setOpenMap}
          isEnabled={isEnabled}
          isChecked={isChecked}
          toggleFile={toggleFile}
        />
      ))}
    </div>
  );
};

export default FileTreeWithCheckbox;

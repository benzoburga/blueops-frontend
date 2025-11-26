// MobileFolder.jsx
import { useState } from "react";
import { FaFolder, FaFolderOpen, FaFilePdf } from "react-icons/fa";

const MobileFolder = ({ node, setSelectedFile, level = 0 }) => {
  const [open, setOpen] = useState(false);

  const indent = {
    paddingLeft: `${level * 16}px`
  };

  return (
    <div className="mobile-folder-wrapper">

      {/* === FOLDER HEADER === */}
      <div
        className="mobile-folder-header"
        style={indent}
        onClick={() => setOpen(!open)}
      >
        {open ? <FaFolderOpen /> : <FaFolder />}
        <span className="mobile-folder-name">{node.name}</span>
      </div>

      {/* === CONTENT === */}
      {open && (
        <div className="mobile-folder-content">

          {/* Archivos del folder */}
          {node.files?.map((f) => (
            <div key={f.id} className="mobile-file-row" style={indent}>
              <FaFilePdf style={{ marginRight: 6 }} />
              <span className="mobile-file-name truncate">{f.name}</span>
              <button
                className="mobile-details-btn"
                onClick={() => setSelectedFile(f)}
              >
                Detalles
              </button>
            </div>
          ))}

          {/* Subcarpetas recursivas */}
          {node.subfolders?.map((sf) => (
            <MobileFolder
              key={sf.id}
              node={sf}
              setSelectedFile={setSelectedFile}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileFolder;

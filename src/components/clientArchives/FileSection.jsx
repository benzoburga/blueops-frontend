// FileSection.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import '../../styles/filessection.css';
import {
  FaFilePdf, FaFileWord, FaFolderOpen, FaFileExcel, FaFilePowerpoint,
  FaChevronDown, FaChevronRight, FaEllipsisV, FaFileAlt
} from 'react-icons/fa';
import UploadButton from './uploadButton';
import UploadFileModal from './UploadFileModal';
import { useParams, useSearchParams } from "react-router-dom";
import VersionListModal from './VersionListModal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '@/services/api';
import NameInputModal from '@/components/NameInputModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

/* ================== helpers para buscar rutas ================== */
function findSubPath(list, targetId) {
  if (!targetId) return null;
  const T = String(targetId);
  const dfs = (node, path) => {
    const here = [...path, String(node.id)];
    if (String(node.id) === T) return here;
    for (const child of node.subfolders || []) {
      const r = dfs(child, here);
      if (r) return r;
    }
    return null;
  };
  for (const root of list) {
    const r = dfs(root, []);
    if (r) return r;
  }
  return null;
}
function findFilePath(list, fileId) {
  if (!fileId) return null;
  const T = String(fileId);
  const dfs = (node, path) => {
    const here = [...path, String(node.id)];
    if ((node.files || []).some(f => String(f.id) === T)) return here;
    for (const child of node.subfolders || []) {
      const r = dfs(child, here);
      if (r) return r;
    }
    return null;
  };
  for (const root of list) {
    const r = dfs(root, []);
    if (r) return r;
  }
  return null;
}
/* ¿existe subcarpeta con id = targetId en cualquier nivel? */
function hasSubId(roots, targetId) {
  const T = String(targetId);
  const stack = [...roots];
  while (stack.length) {
    const node = stack.pop();
    if (String(node.id) === T) return true;
    if (node.subfolders?.length) stack.push(...node.subfolders);
  }
  return false;
}

/* ============== helpers UI / URL absolutas ================= */
const getFileIcon = (fileName = "") => {
  const low = String(fileName).toLowerCase();
  if (low.endsWith('.pdf')) return <FaFilePdf />;
  if (low.endsWith('.doc') || low.endsWith('.docx')) return <FaFileWord />;
  if (low.endsWith('.xls') || low.endsWith('.xlsx')) return <FaFileExcel />;
  if (low.endsWith('.ppt') || low.endsWith('.pptx')) return <FaFilePowerpoint />;
  return <FaFileAlt />;
};

const toAbsoluteUrl = (u = "") => {
  if (!u) return "#";
  if (/^https?:\/\//i.test(u)) return u;
  try {
    // usa el mismo origin que el backend (funciona con proxy y en prod)
    const base = new URL(api.defaults.baseURL || '/api', window.location.origin);
    return `${base.origin}${u}`;
  } catch {
    return u;
  }
};

/* ================== Ítem de archivo ================== */
const FileItem = ({ file, onDelete, onAddVersion, onViewVersions, onDownload, isHighlighted = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const rowRef = useRef(null);

  useEffect(() => {
    if (isHighlighted && rowRef.current) {
      const t = setTimeout(() => {
        rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
      return () => clearTimeout(t);
    }
  }, [isHighlighted]);

  return (
    <div ref={rowRef} className={`file-item ${isHighlighted ? 'file-item--highlight' : ''}`}>
      <span className="file-icon">{getFileIcon(file.name)}</span>
      <span className="file-name">{file.name}</span>
      <span className="file-code">{file.code}</span>
      <span>{file.approvalDate}</span>
      <span>{file.version}</span>
      <span>{file.uploadDate}</span>
      <div className="file-options">
        <FaEllipsisV onClick={() => setMenuOpen(!menuOpen)} className="menu-icon" />
        {menuOpen && (
          <div className="dropdown-menu">
            <p onClick={(e) => { e.stopPropagation(); if (file.url) window.open(toAbsoluteUrl(file.url), '_blank'); }}>Ver</p>
            <p onClick={(e) => { e.stopPropagation(); onDelete(); }}>Eliminar</p>
            <p onClick={(e) => { e.stopPropagation(); onDownload(file.id); }}>Descargar</p>
            <p onClick={(e) => { e.stopPropagation(); onAddVersion(); }}>Añadir Versión</p>
            <p onClick={(e) => { e.stopPropagation(); onViewVersions(); }}>Ver Versiones</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ================== Subcarpeta (recursivo) ================== */
const SubFolder = ({
  subfolder,
  depth = 0,
  searchQuery,
  openModal,
  handleRename,
  handleDelete,
  handleDeleteFile,
  openVersionModal,
  openVersionList,
  handleCreateSubfolder,
  onDownload,
  defaultOpen = false,
  highlightId = null,
  targetType = 'archivo',
  openIdsSet = null
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (openIdsSet) setOpen(openIdsSet.has(String(subfolder.id)));
    else setOpen(!!defaultOpen);
  }, [openIdsSet, defaultOpen, subfolder.id]);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const headerRef = useRef(null);

  const isSubHighlighted = String(highlightId) === String(subfolder.id);

  useEffect(() => {
    if (isSubHighlighted && headerRef.current) {
      const t = setTimeout(() => {
        headerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
      return () => clearTimeout(t);
    }
  }, [isSubHighlighted]);

  const filteredSubfolders = subfolder.subfolders || [];
  const filteredFiles = (subfolder.files || []).filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMenu = (e) => { e.stopPropagation(); setMenuOpen(!menuOpen); };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, [menuOpen]);

  const headerHighlightStyle = isSubHighlighted ? {
    outline: '2px solid #2dd4bf',
    background: 'rgba(45, 212, 191, 0.18)',
    borderRadius: 8
  } : undefined;

  return (
    <div className="folder-section">
      <div
        ref={headerRef}
        className={`subfolder-header ${isSubHighlighted ? 'subfolder-header--highlight' : ''}`}
        style={headerHighlightStyle}
        onClick={() => setOpen(!open)}
      >
        {open ? <FaChevronDown /> : <FaChevronRight />} <FaFolderOpen />
        <h4>{subfolder.name}</h4>
        <div className="folder-options" ref={menuRef}>
          <FaEllipsisV onClick={toggleMenu} className="menu-icon" />
          {menuOpen && (
            <div className="dropdown-menu">
              <p onClick={(e) => { e.stopPropagation(); openModal(subfolder); }}>Subir Archivo</p>
              <p onClick={(e) => { e.stopPropagation(); handleCreateSubfolder(subfolder); }}>Crear subcarpeta</p>
              <p onClick={(e) => { e.stopPropagation(); handleRename(subfolder, true); }}>Renombrar</p>
              <p onClick={(e) => { e.stopPropagation(); handleDelete(subfolder, true); }}>Eliminar</p>
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="folder-content">
          <Droppable droppableId={`subfolders-${subfolder.id}-${depth}`} type={`subfolder-${depth}`}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="droppable-container">
                {filteredSubfolders.map((sub, idx) => (
                  <Draggable key={`subfolder-${sub.id}`} draggableId={`subfolder-${sub.id}`} index={idx}>
                    {(prov) => (
                      <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                        <SubFolder
                          subfolder={sub}
                          depth={depth + 1}
                          defaultOpen={openIdsSet?.has(String(sub.id))}
                          highlightId={highlightId}
                          targetType={targetType}
                          openIdsSet={openIdsSet}
                          parentFolder={subfolder}
                          openModal={openModal}
                          handleRename={handleRename}
                          handleDelete={handleDelete}
                          handleDeleteFile={handleDeleteFile}
                          openVersionModal={openVersionModal}
                          openVersionList={openVersionList}
                          searchQuery={searchQuery}
                          handleCreateSubfolder={handleCreateSubfolder}
                          onDownload={onDownload}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {filteredFiles.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              isHighlighted={targetType === 'archivo' && String(highlightId) === String(file.id)}
              onDelete={() => handleDeleteFile(file)}
              onAddVersion={() => openVersionModal(file)}
              onViewVersions={() => openVersionList(file)}
              onDownload={onDownload}
            />
          ))}

          {filteredSubfolders.length === 0 && filteredFiles.length === 0 && (
            <div className="empty-folder-msg">Esta carpeta está vacía.</div>
          )}
        </div>
      )}
    </div>
  );
};

/* ================== Carpeta raíz ================== */
const Folder = ({
  folder,
  searchQuery,
  openModal,
  handleCreateSubfolder,
  handleRename,
  handleDelete,
  handleDeleteFile,
  openVersionModal,
  openVersionList,
  onDownload,
  defaultOpen = false,
  highlightId = null,
  targetType = 'archivo',
  openIdsSet = null
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (openIdsSet) setOpen(openIdsSet.has(String(folder.carpeta_id)));
    else setOpen(!!defaultOpen);
  }, [openIdsSet, defaultOpen, folder.carpeta_id]);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const headerRef = useRef(null);

  const isFolderHighlighted = String(highlightId) === String(folder.carpeta_id);

  useEffect(() => {
    if (isFolderHighlighted && headerRef.current) {
      const t = setTimeout(() => {
        headerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
      return () => clearTimeout(t);
    }
  }, [isFolderHighlighted]);

  const filteredFiles = (folder.files || []).filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMenu = (e) => { e.stopPropagation(); setMenuOpen(!menuOpen); };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, [menuOpen]);

  const headerHighlightStyle = isFolderHighlighted ? {
    outline: '2px solid #2dd4bf',
    background: 'rgba(45, 212, 191, 0.18)',
    borderRadius: 8
  } : undefined;

  return (
    <div className="folder-section">
      <div
        ref={headerRef}
        className={`folder-header ${isFolderHighlighted ? 'folder-header--highlight' : ''}`}
        style={headerHighlightStyle}
        onClick={() => setOpen(!open)}
      >
        {open ? <FaChevronDown /> : <FaChevronRight />} <FaFolderOpen />
        <h4>{folder.year}</h4>
        <div className="folder-options" ref={menuRef}>
          <FaEllipsisV onClick={toggleMenu} className="menu-icon" />
          {menuOpen && (
            <div className="dropdown-menu">
              <p onClick={(e) => { e.stopPropagation(); openModal(folder); }}>Subir Archivo</p>
              <p onClick={(e) => { e.stopPropagation(); handleCreateSubfolder(folder); }}>Crear subcarpeta</p>
              <p onClick={(e) => { e.stopPropagation(); handleRename(folder, false); }}>Renombrar</p>
              <p onClick={(e) => { e.stopPropagation(); handleDelete(folder, false); }}>Eliminar</p>
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="folder-content">
          <Droppable droppableId={`subfolders-${folder.carpeta_id}`} type="subfolder">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: '1px' }}>
                {folder.subfolders?.map((sub, idx) => (
                  <Draggable key={`subfolder-${sub.id}`} draggableId={`subfolder-${sub.id}`} index={idx}>
                    {(prov) => (
                      <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                        <SubFolder
                          subfolder={sub}
                          depth={0}
                          defaultOpen={openIdsSet?.has(String(sub.id))}
                          highlightId={highlightId}
                          targetType={targetType}
                          openIdsSet={openIdsSet}
                          parentFolder={folder}
                          openModal={openModal}
                          handleRename={handleRename}
                          handleDelete={handleDelete}
                          handleDeleteFile={handleDeleteFile}
                          openVersionModal={openVersionModal}
                          openVersionList={openVersionList}
                          searchQuery={searchQuery}
                          handleCreateSubfolder={handleCreateSubfolder}
                          onDownload={onDownload}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {filteredFiles.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              isHighlighted={targetType === 'archivo' && String(highlightId) === String(file.id)}
              onDelete={() => handleDeleteFile(file)}
              onAddVersion={() => openVersionModal(file)}
              onViewVersions={() => openVersionList(file)}
              onDownload={onDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ================== Vista principal ================== */
const FilesSection = () => {
  const [filesData, setFilesData] = useState([]);
  const [showSubNameModal, setShowSubNameModal] = useState(false);
  const [targetFolderForSub, setTargetFolderForSub] = useState(null);
  const { clientName: clienteSlug, sectionName: apartadoSlug } = useParams();
  const [qs] = useSearchParams();

  // --- apertura/resaltado desde el buscador ---
  const path = qs.get('path') || '';
  const targetTypeQS = (qs.get('t') || 'archivo').toLowerCase(); // 'archivo' | 'carpeta' | 'subcarpeta'
  const highlightIdQS = (qs.get('highlight') ?? '').trim() || null;

  const pathParts = useMemo(() =>
    String(path).split(/[:/,\s]+/).filter(Boolean).map(String),
    [path]
  );

  const openIds = useMemo(() => new Set(
    String(path).split(/[:/,\s]+/).filter(Boolean).map(String)
  ), [path]);

  const [derivedOpenIds, setDerivedOpenIds] = useState(openIds);

  /* ====== Inferir highlight/type si no viene highlight QS ====== */
  const [autoType, setAutoType] = useState(null); // 'carpeta' | 'subcarpeta' | null
  const [autoHighlight, setAutoHighlight] = useState(null);

  useEffect(() => {
    if (!filesData?.length) return;
    if (highlightIdQS) { setAutoType(null); setAutoHighlight(null); return; }

    const parts = String(path).split(/[:/,\s]+/).filter(Boolean).map(String);
    const lastId = parts[parts.length - 1];
    if (!lastId) { setAutoType(null); setAutoHighlight(null); return; }

    const isRoot = filesData.some(f => String(f.carpeta_id) === String(lastId));
    if (isRoot) { setAutoType('carpeta'); setAutoHighlight(String(lastId)); return; }

    const roots = filesData.map(f => ({
      id: String(f.carpeta_id),
      subfolders: f.subfolders || [],
      files: f.files || [],
    }));
    if (hasSubId(roots.flatMap(r => r.subfolders || []), lastId)) {
      setAutoType('subcarpeta');
      setAutoHighlight(String(lastId));
      return;
    }
    setAutoType(null);
    setAutoHighlight(null);
  }, [filesData, path, highlightIdQS]);

  const effectiveTargetType  = (highlightIdQS ? targetTypeQS : (autoType || targetTypeQS));
  const effectiveHighlightId = (highlightIdQS || autoHighlight || null);

  console.log('[QS]', { path, targetTypeQS, highlightIdQS });
  console.log('[PATH parts]', pathParts);
  console.log('[AUTO]', { autoType, autoHighlight });
  console.log('[EFFECTIVE]', { effectiveTargetType, effectiveHighlightId });
  console.log('[OPEN IDS from URL]', Array.from(openIds));

  // Completar ruta con ancestros
  useEffect(() => {
    if (!filesData?.length) return;

    const ids = new Set(Array.from(openIds).map(String));
    const roots = filesData.map(f => ({
      id: String(f.carpeta_id),
      subfolders: f.subfolders,
      files: f.files,
    }));

    if (effectiveHighlightId) {
      let pathArr = null;
      if (effectiveTargetType === 'subcarpeta') pathArr = findSubPath(roots, effectiveHighlightId);
      else if (effectiveTargetType === 'archivo') pathArr = findFilePath(roots, effectiveHighlightId);
      else if (effectiveTargetType === 'carpeta') pathArr = [String(effectiveHighlightId)];
      if (Array.isArray(pathArr)) for (const x of pathArr) ids.add(String(x));
    }
    setDerivedOpenIds(ids);
    console.log('[DERIVED OPEN IDS]', Array.from(ids));
  }, [filesData, openIds, effectiveTargetType, effectiveHighlightId]);

  // highlight temporal
  const [flashId, setFlashId] = useState(effectiveHighlightId);
  useEffect(() => {
    setFlashId(effectiveHighlightId);
    if (effectiveHighlightId) {
      const t = setTimeout(() => setFlashId(null), 2500);
      return () => clearTimeout(t);
    }
  }, [effectiveHighlightId]);

  const [showNameModal, setShowNameModal] = useState(false);
  const [searchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedVersionTarget, setSelectedVersionTarget] = useState(null);
  const [versionListOpen, setVersionListOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [isRenamingSub, setIsRenamingSub] = useState(false);
  const [, setRenameParentFolder] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [showDeleteFileModal, setShowDeleteFileModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [deleteFileForce, setDeleteFileForce] = useState(false);

  /* ================== descargas y versiones ================== */
  const dlBase = (api.defaults.baseURL || '/api').replace(/\/$/, '');
  const handleDownloadVersion = (version) => {
    if (!version?.id) return;
    window.open(`${dlBase}/archivos/versiones/${version.id}/descargar`, '_blank');
  };
  const forceDownload = (archivoId) => {
    window.open(`${dlBase}/archivos/${archivoId}/descargar`, '_blank');
  };
  const handleDeleteVersionFromApi = async (version) => {
    try {
      await api.delete(`/archivos/versiones/${version.id}`);
      setSelectedVersionTarget(prev => ({
        ...prev,
        versions: (prev?.versions || []).filter(v => v.id !== version.id)
      }));
    } catch (err) {
      if (err.response?.status === 409) {
        alert(err.response.data?.message || 'No puedes eliminar la versión vigente.');
      } else {
        console.error('❌ Error al eliminar versión:', err);
        alert('Error al eliminar la versión.');
      }
    }
  };

  /* ================== drag & drop ================== */
  const onDragEnd = async (result) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === "DEFAULT") {
      const reordered = Array.from(filesData);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      const reorderedWithOrder = reordered.map((folder, index) => ({ ...folder, orden: index }));
      setFilesData(reorderedWithOrder);

      for (let i = 0; i < reorderedWithOrder.length; i++) {
        try { await api.put(`/carpetas/${reorderedWithOrder[i].carpeta_id}`, { orden: i }); }
        catch (err) { console.error("❌ Error actualizando carpeta:", err); }
      }
    }

    if (type.startsWith("subfolder")) {
      const getIdFromDroppable = (droppableId) => {
        const match = droppableId.match(/^subfolders-(\d+)-\d+$/);
        return match ? parseInt(match[1]) : null;
      };
      const sourceId = getIdFromDroppable(source.droppableId);
      const destId = getIdFromDroppable(destination.droppableId);
      if (!sourceId || !destId || sourceId !== destId) return;

      const updateSubfoldersRecursively = (folders) => {
        return folders.map((folder) => {
          if (folder.carpeta_id === sourceId || folder.id === sourceId) {
            const reordered = Array.from(folder.subfolders);
            const [moved] = reordered.splice(source.index, 1);
            reordered.splice(destination.index, 0, moved);
            reordered.forEach(async (sub, idx) => {
              try { await api.put(`/subcarpetas/${sub.id}`, { orden: idx }); }
              catch (err) { console.error("❌ Error actualizando subcarpeta:", err); }
            });
            return { ...folder, subfolders: reordered };
          }
          if (folder.subfolders?.length) {
            return { ...folder, subfolders: updateSubfoldersRecursively(folder.subfolders) };
          }
          return folder;
        });
      };

      const updated = updateSubfoldersRecursively(filesData);
      setFilesData(updated);
    }
  };

  /* ================== carga de estructura ================== */
  const fetchCarpetas = async () => {
    try {
      const cli = encodeURIComponent(clienteSlug || '');
      const ap  = encodeURIComponent(apartadoSlug || '');
      const { data } = await api.get(`/estructura/${cli}/${ap}`);

      const root = Array.isArray(data) ? data : (data?.carpetas || []);

      const mapFiles = (arr = []) =>
        (arr || []).map(f => ({
          id: f.id,
          name: f.nombre,
          code: f.codigo || "no disponible",
          approvalDate: f.fecha_aprobacion ? String(f.fecha_aprobacion).slice(0, 10) : "no disponible",
          version: f.version,
          uploadDate: f.fecha_subida ? String(f.fecha_subida).slice(0, 10) : "no disponible",
          url: f.url_archivo || "#",  // el backend devuelve '/uploads/...'
        }));

      const mapSubs = (subs = []) =>
        (subs || [])
          .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
          .map(s => ({
            id: s.id,
            name: s.name,
            files: mapFiles(s.files),
            subfolders: mapSubs(s.subfolders || []),
          }));

      const transformed = (root || [])
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
        .map(c => ({
          year: c.name,
          carpeta_id: c.id,
          orden: c.orden ?? 0,
          files: mapFiles(c.files),
          subfolders: mapSubs(c.subfolders || []),
        }));

      setFilesData(transformed);
      console.log('[FILES DATA ROOT IDS]', transformed.map(f => f.carpeta_id));
    } catch (err) {
      console.error("Error cargando estructura:", err);
      setFilesData([]);
    }
  };

  useEffect(() => { fetchCarpetas(); }, [clienteSlug, apartadoSlug]);

  /* ================== Subir/Versionar/Eliminar ================== */
  const findCarpetaId = (folder) => {
    if (folder.carpeta_id) return folder.carpeta_id;
    for (let topFolder of filesData) {
      const search = (subfolders) => {
        for (let sub of subfolders) {
          if (sub === folder) return topFolder.carpeta_id;
          if (sub.subfolders?.length) {
            const found = search(sub.subfolders);
            if (found) return found;
          }
        }
        return null;
      };
      const found = search(topFolder.subfolders);
      if (found) return found;
    }
    return null;
  };

  const openModal = (folder) => {
    setSelectedVersionTarget(null);
    setSelectedFolder(folder);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFolder(null);
    setSelectedVersionTarget(null);
  };
  const openVersionModal = (file) => {
    setSelectedFolder(null);
    setSelectedVersionTarget(file);
    setIsModalOpen(true);
  };

  const openVersionList = async (file) => {
    try {
      const archivoId = file.id || file.archivo_id;
      const res = await api.get(`/archivos/${archivoId}/versiones`);

      const formatDate = (fecha) => {
        if (!fecha) return "No aplica";
        try { return new Date(fecha).toISOString().split("T")[0]; }
        catch { return "No aplica"; }
      };

      const versiones = (res.data || []).map(v => ({
        id: v.id,
        name: v.nombre || "No aplica",
        version: v.version || "No aplica",
        uploadDate: formatDate(v.fecha_subida),
        approvalDate: formatDate(v.fecha_aprobacion),
        url: v.url_archivo || "#",
        vigente: !!v.vigente
      }));

      const fileConVersiones = { ...file, versions: versiones };
      setSelectedVersionTarget(fileConVersiones);
      setVersionListOpen(true);
    } catch (error) {
      console.error("❌ Error al obtener versiones:", error);
      alert("Error al obtener las versiones del archivo.");
    }
  };

  const handleFileUpload = async (file, code, approvalDate, version) => {
    if (selectedVersionTarget?.id) return;
    if (!selectedFolder) return;

    try {
      const formData = new FormData();
      formData.append("archivo", file);
      formData.append("codigo", code || "no disponible");
      formData.append("version", version || "1");
      formData.append("fecha_aprobacion", approvalDate || null);

      const tipoApartado = decodeSectionName(apartadoSlug);
      const apartadoRes = await api.get(`/apartados/${clienteSlug}/${tipoApartado}`);
      const apartadoId = apartadoRes.data.id;
      formData.append("apartado_cliente_id", apartadoId);

      if (selectedFolder.carpeta_id) {
        formData.append("carpeta_id", selectedFolder.carpeta_id);
      } else {
        const carpetaId = findCarpetaId(selectedFolder);
        formData.append("carpeta_id", carpetaId);
        formData.append("subcarpeta_id", selectedFolder.id);
      }

      await api.post(`/archivos`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      await fetchCarpetas();
    } catch (error) {
      console.error("❌ Error al subir archivo:", error);
      alert("Error al subir el archivo.");
    } finally {
      setIsModalOpen(false);
    }
  };

  const handleAddVersion = async (file, code, approvalDate, version) => {
    if (!selectedVersionTarget?.id) return;

    try {
      const formData = new FormData();
      formData.append("archivo", file);
      formData.append("codigo", code || "no disponible");
      formData.append("version", version || "1");
      formData.append("fecha_aprobacion", approvalDate || null);

      const archivoId = selectedVersionTarget.id || selectedVersionTarget.archivo_id;
      await api.post(`/archivos/${archivoId}/version`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      await fetchCarpetas();
    } catch (error) {
      console.error("❌ Error al subir nueva versión:", error);
      alert("Error al subir nueva versión.");
    } finally {
      setIsModalOpen(false);
      setSelectedVersionTarget(null);
    }
  };

  const decodeSectionName = (slug) => {
    const mapa = {
      "linea-base": "Línea Base",
      "politicas-y-reglamentos": "Políticas y Reglamentos",
      "objetivos-y-estadisticas": "Objetivos y estadísticas",
      "comite": "Comité",
      "iperc": "IPERC",
      "procedimientos": "Procedimientos",
      "capacitacion": "Capacitación",
      "planes-y-programas": "Planes y programas",
      "registros": "Registros",
      "mapas-de-riesgo": "Mapas de riesgo",
      "auditorias": "Auditorías",
      "matrices": "Matrices",
      "accidentes-e-incidentes": "Accidentes e Incidentes",
      "fiscalizacion": "Fiscalización",
      "emo": "EMO´s",
      "docgen": "DocGen",
      "monitoreos": "Monitoreos",
      "informes": "Informes"
    };
    return mapa[slug] || slug;
  };

  const triggerCreateFolder = () => setShowNameModal(true);
  const handleCreateSubfolder = (targetFolder) => { setTargetFolderForSub(targetFolder); setShowSubNameModal(true); };
  const handleRename = (target, isSubfolder = false, parentFolder = null) => {
    setRenameTarget(target); setIsRenamingSub(isSubfolder); setRenameParentFolder(parentFolder);
  };

  const handleDelete = async (target, isSubfolder = false) => {
    if (!target) return;
    try {
      if (!isSubfolder) {
        await api.delete(`/carpetas/${target.carpeta_id}`);
        await fetchCarpetas();
      } else {
        await api.delete(`/subcarpetas/${target.id}`);
        await fetchCarpetas();
      }
    } catch (error) {
      if (error.response?.status === 409) {
        setDeleteTarget({ ...target, isSubfolder, carpeta_id: target.carpeta_id || null, id: target.id || null });
        const msg = error.response?.data?.message
          || "Esta carpeta o subcarpeta contiene archivos o subcarpetas. ¿Deseas eliminarla de todas formas?";
        setDeleteMessage(msg);
        setShowDeleteModal(true);
      } else {
        console.error("❌ Error al eliminar carpeta o subcarpeta:", error);
      }
    }
  };

  const confirmDeleteAnyway = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.isSubfolder) {
        if (!deleteTarget?.id) return alert("Subcarpeta inválida");
        await api.delete(`/subcarpetas/${deleteTarget.id}?force=true`);
      } else {
        if (!deleteTarget?.carpeta_id) return alert("Carpeta inválida");
        await api.delete(`/carpetas/${deleteTarget.carpeta_id}?force=true`);
      }
      await fetchCarpetas();
    } catch (err) {
      console.error("❌ No se pudo eliminar:", err);
      alert("Error al eliminar.");
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const handleDeleteFile = async (targetFile) => {
    if (!targetFile?.id) return alert('No se encontró el ID del archivo.');
    const archivoId = targetFile.id;

    try {
      const { data: versiones } = await api.get(`/archivos/${archivoId}/versiones`);
      const tieneVersiones = Array.isArray(versiones) && versiones.length > 0;

      setFileToDelete(targetFile);
      if (tieneVersiones) {
        setDeleteMessage('Borrar el archivo se eliminará junto con sus versiones.');
        setDeleteFileForce(true);
      } else {
        setDeleteMessage('¿Seguro que quiere eliminar el archivo?');
        setDeleteFileForce(false);
      }
      setShowDeleteFileModal(true);
    } catch (err) {
      console.error('❌ No se pudo consultar versiones del archivo:', err);
      setFileToDelete(targetFile);
      setDeleteMessage('¿Seguro que quiere eliminar el archivo?');
      setDeleteFileForce(false);
      setShowDeleteFileModal(true);
    }
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete?.id) return;
    try {
      const url = `/archivos/${fileToDelete.id}${deleteFileForce ? '?force=true' : ''}`;
      await api.delete(url);
      await fetchCarpetas();
    } catch (err) {
      console.error('❌ Error al eliminar archivo:', err);
      alert('No se pudo eliminar el archivo.');
    } finally {
      setShowDeleteFileModal(false);
      setFileToDelete(null);
      setDeleteMessage('');
      setDeleteFileForce(false);
    }
  };

  const handleSetVersionAsMain = (versionIndex) => {
    const updatedData = filesData.map(folder => {
      if (folder.files?.some(f => f.name === selectedVersionTarget.name)) {
        return {
          ...folder,
          files: folder.files.map(f => {
            if (f.name === selectedVersionTarget.name) {
              const versions = [...(f.versions || [])];
              const selected = versions.splice(versionIndex, 1)[0];
              const currentAsVersion = { ...f, versions: undefined };
              return { ...selected, versions: [currentAsVersion, ...versions] };
            }
            return f;
          }),
        };
      }
      if (folder.subfolders?.length) {
        const updatedSubfolders = folder.subfolders.map(sub => {
          if (sub.files?.some(f => f.name === selectedVersionTarget.name)) {
            return {
              ...sub,
              files: sub.files.map(f => {
                if (f.name === selectedVersionTarget.name) {
                  const versions = [...(f.versions || [])];
                  const selected = versions.splice(versionIndex, 1)[0];
                  const currentAsVersion = { ...f, versions: undefined };
                  return { ...selected, versions: [currentAsVersion, ...versions] };
                }
                return f;
              }),
            };
          }
          return sub;
        });
        return { ...folder, subfolders: updatedSubfolders };
      }
      return folder;
    });

    setFilesData(updatedData);
    setVersionListOpen(false);
  };

  const handleDeleteVersionFromModal = async (ver) => {
    setSelectedVersionTarget(prev => {
      if (!prev) return prev;
      const safe = Array.isArray(prev.versions) ? prev.versions : [];
      return { ...prev, versions: safe.filter(v => v.id !== ver.id) };
    });
    try { await fetchCarpetas(); } catch { /* noop */ }
  };

  /* ================== Render ================== */
  return (
    <>
      <NameInputModal
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        onSubmit={async (name) => {
          try {
            const tipoApartado = decodeSectionName(apartadoSlug);
            const apartadoRes = await api.get(`/apartados/${clienteSlug}/${tipoApartado}`);
            const apartadoId = apartadoRes.data.id;

            const res = await api.post(`/carpetas`, {
              nombre: name,
              apartado_cliente_id: apartadoId,
              orden: filesData.length
            });

            const newFolder = {
              year: name,
              carpeta_id: res.data.id,
              orden: filesData.length,
              files: [],
              subfolders: [],
            };

            setFilesData((prev) => [...prev, newFolder]);
          } catch (error) {
            console.error("❌ Error al crear carpeta:", error);
            alert("Error al crear la carpeta.");
          } finally {
            setShowNameModal(false);
          }
        }}
      />

      <NameInputModal
        isOpen={showSubNameModal}
        onClose={() => setShowSubNameModal(false)}
        onSubmit={async (subName) => {
          if (!subName || !targetFolderForSub) return;

          const carpetaId = findCarpetaId(targetFolderForSub);
          if (!carpetaId) { alert("No se encontró carpeta_id"); return; }

          try {
            const res = await api.post(`/subcarpetas`, {
              nombre: subName,
              carpeta_id: carpetaId,
              orden: targetFolderForSub.subfolders?.length || 0,
              subcarpeta_padre_id: targetFolderForSub.id || null
            });

            const newSubfolder = { name: subName, id: res.data.id, files: [], subfolders: [] };

            const addSubfolderRecursively = (folders) => {
              return folders.map((folder) => {
                if (folder === targetFolderForSub) {
                  return { ...folder, subfolders: [...(folder.subfolders || []), newSubfolder] };
                } else if (folder.subfolders?.length) {
                  return { ...folder, subfolders: addSubfolderRecursively(folder.subfolders) };
                }
                return folder;
              });
            };

            setFilesData(prev => addSubfolderRecursively(prev));
          } catch (error) {
            console.error("❌ Error al crear subcarpeta:", error);
            alert("Error al crear subcarpeta");
          } finally {
            setShowSubNameModal(false);
            setTargetFolderForSub(null);
          }
        }}
      />

      <NameInputModal
        isOpen={!!renameTarget}
        onClose={() => {
          setRenameTarget(null);
          setRenameParentFolder(null);
          setIsRenamingSub(false);
        }}
        onSubmit={async (newName) => {
          if (!newName) return;

          try {
            if (isRenamingSub) {
              if (!renameTarget?.id) { console.error("❌ No se encontró el ID de subcarpeta a renombrar"); return; }
              await api.put(`/subcarpetas/nombre/${renameTarget.id}`, { nombre: newName });
            } else {
              await api.put(`/carpetas/nombre/${renameTarget.carpeta_id}`, { nombre: newName });
            }
          } catch (error) {
            console.error("❌ Error al renombrar:", error);
            alert("Error al renombrar");
          }

          const updateNameRecursively = (folders) => {
            return folders.map(folder => {
              if (!isRenamingSub && folder === renameTarget) return { ...folder, year: newName };
              const updateSubs = (subs) =>
                subs.map(sub => {
                  if (sub.id === renameTarget.id) return { ...sub, name: newName };
                  if (sub.subfolders?.length) return { ...sub, subfolders: updateSubs(sub.subfolders) };
                  return sub;
                });
              return { ...folder, subfolders: folder.subfolders?.length ? updateSubs(folder.subfolders) : folder.subfolders };
            });
          };

          setFilesData((prev) => updateNameRecursively(prev));
          setRenameTarget(null);
          setRenameParentFolder(null);
          setIsRenamingSub(false);
        }}
      />

      <UploadFileModal
        isOpen={isModalOpen}
        onClose={closeModal}
        isVersionUpload={!!selectedVersionTarget}
        handleFileUpload={(file, code, approvalDate, version) => {
          const isVersion = !!selectedVersionTarget?.id;
          if (isVersion) {
            handleAddVersion(file, code, approvalDate, version);
          } else {
            handleFileUpload(file, code, approvalDate, version);
          }
          closeModal();
        }}
      />

      {versionListOpen && selectedVersionTarget && (
        <VersionListModal
          file={selectedVersionTarget}
          onClose={() => setVersionListOpen(false)}
          onDeleteVersion={handleDeleteVersionFromModal}
          onSetAsMain={async (version) => {
            await fetchCarpetas();
            setSelectedVersionTarget(prev => ({
              ...prev,
              versions: (prev?.versions || []).map(v => ({ ...v, vigente: v.id === version.id }))
            }));
          }}
          onDownloadVersion={handleDownloadVersion}
        />
      )}

      <div className="files-section">
        <div className="header-with-search">
          <h3>
            Todos los archivos {apartadoSlug?.toUpperCase().replace(/-/g, ' ')} de {clienteSlug?.toUpperCase()} 📝
          </h3>
        </div>

        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
          onConfirm={confirmDeleteAnyway}
          message={deleteMessage || 'Esta carpeta o subcarpeta contiene elementos. ¿Eliminar de todas formas?'}
        />

        <DeleteConfirmModal
          isOpen={showDeleteFileModal}
          onClose={() => { setShowDeleteFileModal(false); setFileToDelete(null); }}
          onConfirm={confirmDeleteFile}
          message={deleteMessage || 'Borrar el archivo se eliminará junto con sus versiones.'}
        />

        <UploadButton onOpenCreateFolder={triggerCreateFolder} />

        {filesData.length === 0 ? (
          <div className="empty-folder-msg" style={{ margin: "2rem", fontSize: "1.1rem" }}>
            No hay carpetas disponibles para este apartado.
          </div>
        ) : (
          <>
            <div className="table-header">
              <span>Carpeta</span>
              <span>Archivo</span>
              <span>Código</span>
              <span>Fecha de Aprobación</span>
              <span>Versión</span>
              <span>Fecha de Subida</span>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="folders">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {[...filesData]
                      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
                      .map((folder, index) => (
                        <Draggable
                          key={`folder-${folder.carpeta_id}`}
                          draggableId={`folder-${folder.carpeta_id}`}
                          index={index}
                        >
                          {(prov) => (
                            <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                              <Folder
                                folder={folder}
                                defaultOpen={derivedOpenIds.has(String(folder.carpeta_id))}
                                highlightId={flashId}
                                targetType={effectiveTargetType}
                                openIdsSet={derivedOpenIds}
                                searchQuery={searchQuery}
                                openModal={openModal}
                                handleCreateSubfolder={handleCreateSubfolder}
                                handleRename={handleRename}
                                handleDelete={handleDelete}
                                handleDeleteFile={handleDeleteFile}
                                openVersionModal={openVersionModal}
                                openVersionList={openVersionList}
                                onDownload={forceDownload}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </>
        )}
      </div>
    </>
  );
};

export default FilesSection;

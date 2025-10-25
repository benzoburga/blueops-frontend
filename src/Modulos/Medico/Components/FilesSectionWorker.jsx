//FilesSectionWorker.jsx
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  FaFilePdf, FaFileWord, FaFileExcel, FaFilePowerpoint,
  FaChevronDown, FaChevronRight, FaEllipsisV, FaFileAlt, FaFolderOpen
} from "react-icons/fa";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import api from "@/services/api";

// Modales
import UploadFileModal from "@components/clientArchives/UploadFileModal";
import NameInputModal from "@components/NameInputModal";
import DeleteConfirmModal from "@components/DeleteConfirmModal";

// Estilos de la sección (dejamos igual tu import)
import "@styles/filesSection.css";

/* -------------------------------- helpers UI -------------------------------- */
const getFileIcon = (fileName = "") => {
  const low = fileName.toLowerCase();
  if (low.endsWith(".pdf")) return <FaFilePdf />;
  if (low.endsWith(".doc") || low.endsWith(".docx")) return <FaFileWord />;
  if (low.endsWith(".xls") || low.endsWith(".xlsx")) return <FaFileExcel />;
  if (low.endsWith(".ppt") || low.endsWith(".pptx")) return <FaFilePowerpoint />;
  return <FaFileAlt />;
};

const fmtDate = (s) => {
  if (!s) return "";
  // si ya viene como '2025-09-19'
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // si viene ISO u otro formato, intenta recortar
  try { return new Date(s).toISOString().slice(0, 10); }
  catch { return String(s).slice(0, 10); }
};

const toAbsoluteUrl = (u = "") => {
  if (!u) return "#";
  if (/^https?:\/\//i.test(u)) return u;

  // baseURL del axios (p.ej. http://localhost:3000/api)
  const base = (api?.defaults?.baseURL || "").replace(/\/+$/, "");

  // si el path es /uploads/... necesitamos el ORIGIN del backend (sin /api)
  if (u.startsWith("/uploads")) {
    try {
      const url = new URL(base, window.location.origin);
      return `${url.origin}${u}`; // http://localhost:3000 + /uploads/...
    } catch {
      // fallback: quitar /api manualmente
      return base.replace(/\/api\/?$/, "") + u;
    }
  }

  // para otros paths relativos, pegamos normal al base
  return base + u;
};


/* --------------------------- Helpers API (usa tu api.js) --------------------------- */

const getRoot = (trabajadorId) =>
  api.get(`/carpetas/medico/trabajadores/${trabajadorId}/root`).then(r => r.data);

const getTree = (rootId) =>
  api.get(`/subcarpetas/subcarpetas-recursivas/${rootId}`).then(r => r.data);

const getRootFiles = (rootId) =>
  api.get(`/archivos/carpeta/${rootId}`).then(r => r.data);

const createSubfolderMedico = (trabajadorId, payload) =>
  api.post(`/subcarpetas/medico/trabajadores/${trabajadorId}/carpetas`, payload).then(r => r.data);

const uploadArchivoMedico = (trabajadorId, formData) =>
  api.post(`/medico/trabajadores/${trabajadorId}/archivos`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(r => r.data);

const renameSubfolder = (id, nombre) =>
  api.put(`/subcarpetas/nombre/${id}`, { nombre: String(nombre || '').trim() })
     .then(r => r.data);

const deleteSubfolder = (id, force = false) =>
  api.delete(`/subcarpetas/${id}${force ? '?force=true' : ''}`).then(r => r.data);

// DESCARGAR archivo vigente por ID
const downloadArchivo = (archivoId) =>
  api.get(`/archivos/${archivoId}/descargar`, { responseType: "blob" });

// ELIMINAR archivo (si devuelve 409, reintenta con force=true)
const deleteArchivo = (archivoId, force = false) =>
  api.delete(`/archivos/${archivoId}${force ? '?force=true' : ''}`);

/* ------------------------------ FileItem (compacto) ------------------------------ */
const FileItem = ({ file, onDelete, onDownload, highlighted }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (highlighted && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlighted]);

  return (
    <div
      ref={ref}
      className={`file-item compact ${highlighted ? "highlighted" : ""}`}
      data-file-id={file.id}
      title={file.name}
    >
      <span className="file-icon">{getFileIcon(file.name)}</span>
      <span className="file-name">{file.name}</span>
      <span>{fmtDate(file.uploadDate)}</span>
      <div className="file-options">
        <FaEllipsisV onClick={() => setMenuOpen(!menuOpen)} className="menu-icon" />
        {menuOpen && (
          <div className="dropdown-menu file-menu">
            <p onClick={() => window.open(toAbsoluteUrl(file.url), "_blank")}>Ver</p>
            <p onClick={() => onDownload?.(file.id)}>Descargar</p>
            <p onClick={() => onDelete?.(file)}>Eliminar</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------------------- Subcarpeta (recursivo) ---------------------------- */
const SubFolder = ({
  subfolder, depth = 0, searchQuery,
  openModal, handleRename, handleDelete, handleDeleteFile,
  handleCreateSubfolder, onDownload,
  defaultOpenSubId,     // <- id de subcarpeta “objetivo” (para highlight)
  highlightFileId,      // <- id de archivo “objetivo” (para highlight)
  openSubIds,           // <- set con todos los ids de subcarpetas a abrir
}) => {
  const [open, setOpen] = useState(() =>
    openSubIds ? openSubIds.has(subfolder.id) : String(subfolder.id) === String(defaultOpenSubId)
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // cabecera de la subcarpeta (para flash + scroll)
  const headerRef = useRef(null);
  const isHighlightedOnce = String(subfolder.id) === String(defaultOpenSubId);

  useEffect(() => {
    if (openSubIds) setOpen(openSubIds.has(subfolder.id));
  }, [openSubIds, subfolder.id]);

  useEffect(() => {
    if (isHighlightedOnce && headerRef.current) {
      headerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlightedOnce]);

  const filteredSubfolders = subfolder.subfolders || [];
  const filteredFiles = (subfolder.files || []).filter(f =>
    f.name.toLowerCase().includes((searchQuery || "").toLowerCase())
  );

  const toggleMenu = (e) => { e.stopPropagation(); setMenuOpen(!menuOpen); };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="subfolder-content">
      <div
        ref={headerRef}
        className={`subfolder-header ${isHighlightedOnce ? "highlighted-once" : ""}`}
        onClick={() => setOpen(!open)}
      >
        {open ? <FaChevronDown /> : <FaChevronRight />} <FaFolderOpen />
        <span style={{ fontWeight: 700 }}>{subfolder.name}</span>
        <div className="folder-options">
          <FaEllipsisV onClick={toggleMenu} className="menu-icon" />
          {menuOpen && (
            <div className="dropdown-menu" ref={menuRef}>
              <p onClick={(e) => (e.stopPropagation(), openModal(subfolder))}>Subir Archivo</p>
              <p onClick={(e) => (e.stopPropagation(), handleCreateSubfolder(subfolder))}>Crear subcarpeta</p>
              <p onClick={(e) => (e.stopPropagation(), handleRename(subfolder, true))}>Renombrar</p>
              <p onClick={(e) => (e.stopPropagation(), handleDelete(subfolder, true))}>Eliminar</p>
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="folder-content">
          <Droppable droppableId={`subfolders-${subfolder.id}-${depth}`} type={`subfolder-${depth}`}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {filteredSubfolders.map((sub, idx) => (
                  <Draggable key={`subfolder-${sub.id}`} draggableId={`subfolder-${sub.id}`} index={idx}>
                    {(prov) => (
                      <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                        <SubFolder
                          subfolder={sub}
                          depth={depth + 1}
                          openModal={openModal}
                          handleRename={handleRename}
                          handleDelete={handleDelete}
                          handleDeleteFile={handleDeleteFile}
                          searchQuery={searchQuery}
                          handleCreateSubfolder={handleCreateSubfolder}
                          onDownload={onDownload}
                          defaultOpenSubId={defaultOpenSubId}
                          highlightFileId={highlightFileId}
                          openSubIds={openSubIds}
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
              onDelete={() => handleDeleteFile(file)}
              onDownload={onDownload}
              highlighted={String(file.id) === String(highlightFileId)}
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

/* --------------------------- Carpeta raíz (del trabajador) --------------------------- */
const Folder = ({
  folder, searchQuery, openModal, handleCreateSubfolder,
  handleRename, handleDelete, handleDeleteFile, onDownload, rootName,
  defaultOpenFolderId, defaultOpenSubId, highlightFileId, openSubIds
}) => {
  const [open, setOpen] = useState(() =>
    String(folder.carpeta_id) === String(defaultOpenFolderId) || true
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // cabecera de la carpeta (para flash + scroll)
  const headerRef = useRef(null);
  const isHighlightedOnce = String(folder.carpeta_id) === String(defaultOpenFolderId);

  useEffect(() => {
    if (isHighlightedOnce && headerRef.current) {
      headerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlightedOnce]);

  const filteredFiles = (folder.files || []).filter(f =>
    f.name.toLowerCase().includes((searchQuery || "").toLowerCase())
  );

  const toggleMenu = (e) => { e.stopPropagation(); setMenuOpen(!menuOpen); };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const isRoot = folder.year === rootName;

  return (
    <div className="folder-section">
      <div
        ref={headerRef}
        className={`folder-header ${isHighlightedOnce ? "highlighted-once" : ""}`}
        onClick={() => setOpen(!open)}
      >
        {open ? <FaChevronDown /> : <FaChevronRight />} <FaFolderOpen />
        <span style={{ fontWeight: 700 }}>{folder.year}</span>
        <div className="folder-options">
          <FaEllipsisV onClick={toggleMenu} className="menu-icon" />
          {menuOpen && (
            <div className="dropdown-menu" ref={menuRef}>
              <p onClick={(e) => (e.stopPropagation(), openModal(folder))}>Subir Archivo</p>
              <p onClick={(e) => (e.stopPropagation(), handleCreateSubfolder(folder))}>Crear subcarpeta</p>
              {!isRoot && <p onClick={(e) => (e.stopPropagation(), handleRename(folder, false))}>Renombrar</p>}
              {!isRoot && <p onClick={(e) => (e.stopPropagation(), handleDelete(folder, false))}>Eliminar</p>}
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="folder-content">
          <Droppable droppableId={`subfolders-${folder.carpeta_id}`} type="subfolder">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {folder.subfolders?.map((sub, idx) => (
                  <Draggable
                    key={`subfolder-${sub.id}`}
                    draggableId={`subfolder-${sub.id}`}
                    index={idx}
                  >
                    {(prov) => (
                      <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                        <SubFolder
                          subfolder={sub}
                          depth={0}
                          openModal={openModal}
                          handleRename={handleRename}
                          handleDelete={handleDelete}
                          handleDeleteFile={handleDeleteFile}
                          searchQuery={searchQuery}
                          handleCreateSubfolder={handleCreateSubfolder}
                          onDownload={onDownload}
                          defaultOpenSubId={defaultOpenSubId}
                          highlightFileId={highlightFileId}
                          openSubIds={openSubIds}
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
              onDelete={() => handleDeleteFile(file)}
              onDownload={onDownload}
              highlighted={String(file.id) === String(highlightFileId)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ------------------------------- Vista principal ------------------------------- */
export default function FilesSectionWorker({
  defaultOpenFolderId,
  defaultOpenSubId,
  highlightFileId,
}) {
  const { trabId: trabajadorId } = useParams();

  // backend state
  const [rootId, setRootId] = useState(null);
  const [rootName, setRootName] = useState("");
  const [filesData, setFilesData] = useState([]);

  // set con subcarpetas abiertas (soporta N niveles)
  const [openSubIds, setOpenSubIds] = useState(new Set());

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);

  const [showSubNameModal, setShowSubNameModal] = useState(false);
  const [targetFolderForSub, setTargetFolderForSub] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  const [showDeleteFileModal, setShowDeleteFileModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [trabajadorId]);

  async function load() {
    const r = await getRoot(trabajadorId);
    if (!r?.ok) { console.error("root error", r); return; }
    setRootId(r.rootId);
    setRootName(r.rootName);
    await refreshTree(r.rootId, r.rootName);
  }

  // helpers para armar árbol local
  const mapSub = (n) => ({
    id: n.id,
    name: n.nombre,
    files: (n.files || []).map(f => ({
      id: f.id, name: f.nombre, uploadDate: fmtDate(f.fecha_subida), url: f.url_archivo,
    })),
    subfolders: (n.subfolders || []).map(mapSub),
  });

  // DFS: ruta de IDs a una subcarpeta (ancestros → target)
  function findSubPath(list, targetId) {
    if (!targetId) return null;
    const t = String(targetId);
    const dfs = (node, path) => {
      if (!node) return null;
      const here = [...path, node.id];
      if (String(node.id) === t) return here;
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

  // DFS: ruta de IDs a la subcarpeta que contiene un archivo
  function findFilePath(list, fileId) {
    if (!fileId) return null;
    const t = String(fileId);
    const dfs = (node, path) => {
      const here = [...path, node.id];
      if ((node.files || []).some(f => String(f.id) === t)) return here;
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

  async function refreshTree(rid = rootId, rname = rootName) {
    if (!rid) return;
    const [treeRaw, rootFiles] = await Promise.all([ getTree(rid), getRootFiles(rid) ]);

    const tree = (treeRaw || []).map(mapSub);
    const rootNode = {
      year: rname,
      carpeta_id: rid,
      orden: 0,
      files: (rootFiles || []).map(f => ({
        id: f.id, name: f.nombre, uploadDate: fmtDate(f.fecha_subida), url: f.url_archivo,
      })),
      subfolders: tree,
    };

    setFilesData([rootNode]);

    // Abre automáticamente ancestros y prepara el set de subcarpetas abiertas
    setTimeout(() => {
      let ids = [];

      // subcarpeta objetivo
      const p1 = findSubPath(tree, defaultOpenSubId);
      if (p1) ids = ids.concat(p1);

      // archivo objetivo
      const p2 = findFilePath(tree, highlightFileId);
      if (p2) ids = ids.concat(p2);

      if (ids.length) setOpenSubIds(new Set(ids));
    }, 0);
  }

  /* --------------------------- Modales --------------------------- */
  const openModal = (folder) => { setSelectedFolder(folder); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setSelectedFolder(null); };

  const onDragEnd = (result) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (type === "DEFAULT") {
      const reordered = Array.from(filesData);
      const [m] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, m);
      setFilesData(reordered.map((f, i) => ({ ...f, orden: i })));
    }
  };

  const handleCreateSubfolder = (target) => { setTargetFolderForSub(target); setShowSubNameModal(true); };
    const handleRename = (target, isSub = false) => {
      setRenameTarget({ ...target, isSubfolder: isSub });
      setShowRenameModal(true);
    };
  const handleDelete = (target, isSub = false) => {
    setDeleteTarget({ ...target, isSubfolder: isSub });
    setDeleteMessage("Esta carpeta o subcarpeta podría contener elementos. ¿Eliminar de todas formas?");
    setShowDeleteModal(true);
  };
  const confirmDeleteAnyway = () => { setShowDeleteModal(false); setDeleteTarget(null); };

  const handleDeleteFile = (file) => {
    setFileToDelete(file);
    setDeleteMessage("¿Seguro que desea eliminar el archivo?");
    setShowDeleteFileModal(true);
  };
  const confirmDeleteFile = async () => {
  try {
    if (!fileToDelete?.id) return;
    // primer intento sin forzar (si tiene versiones, tu backend puede devolver 409)
    await deleteArchivo(fileToDelete.id);
    setShowDeleteFileModal(false);
    setFileToDelete(null);
    await refreshTree();
  } catch (e) {
    if (e?.response?.status === 409) {
      const ok = confirm("Este archivo tiene versiones. ¿Eliminar todo (archivo + versiones)?");
      if (ok) {
        await deleteArchivo(fileToDelete.id, true);
        setShowDeleteFileModal(false);
        setFileToDelete(null);
        await refreshTree();
        return;
      }
    }
    console.error("Error eliminando archivo", e);
    alert("No se pudo eliminar el archivo.");
  }
};

  const handleFileUpload = async (fileBlob) => {
    if (!selectedFolder) {
      alert("Primero elige una carpeta (menú ⋯) para subir el archivo.");
      return;
    }
    const form = new FormData();
    form.append("archivo", fileBlob);
    if (selectedFolder.id) form.append("subcarpetaId", selectedFolder.id);

    const r = await uploadArchivoMedico(trabajadorId, form);
    if (!r?.ok) console.error("upload error", r);

    setIsModalOpen(false);
    setSelectedFolder(null);
    await refreshTree();
  };

    function findFileById(targetId) {
    const t = String(targetId);
    const scan = (node) => {
      for (const f of node.files || []) if (String(f.id) === t) return f;
      for (const s of node.subfolders || []) {
        const r = scan(s);
        if (r) return r;
      }
      return null;
    };
    for (const root of filesData) {
      const r = scan(root);
      if (r) return r;
    }
    return null;
  }

  async function handleDownload(archivoId) {
    try {
      const { data, headers } = await downloadArchivo(archivoId);
      const dispo = headers["content-disposition"] || "";
      const m = dispo.match(/filename="?([^"]+)"?/i);
      let filename = m?.[1] || findFileById(archivoId)?.name || "archivo";

      const blob = new Blob([data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      const f = findFileById(archivoId);
      if (f?.url) {
        const a = document.createElement("a");
        a.href = toAbsoluteUrl(f.url);
        a.download = f.name || "archivo";
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
      console.error("No se pudo descargar", e);
      alert("No se pudo descargar el archivo.");
    }
  }

  

  return (
    <>
      {/* Modales */}
      <NameInputModal
        isOpen={showSubNameModal}
        onClose={() => setShowSubNameModal(false)}
        onSubmit={async (subName) => {
          if (!subName || !targetFolderForSub) return;
          const parentSubcarpetaId = targetFolderForSub.id || null;
          await createSubfolderMedico(trabajadorId, { nombre: subName, parentSubcarpetaId });
          setShowSubNameModal(false);
          setTargetFolderForSub(null);
          await refreshTree();
        }}
      />
      <NameInputModal
        isOpen={showRenameModal}
        title="Renombrar"
        placeholder="Nuevo nombre"
        /* Si tu NameInputModal soporta este prop, déjalo. Si no, elimínalo. */
        defaultValue={
          renameTarget
            ? (renameTarget.isSubfolder ? renameTarget.name : renameTarget.year)
            : ''
        }
        onClose={() => { setShowRenameModal(false); setRenameTarget(null); }}
        onSubmit={async (newName) => {
          const nombre = String(newName || '').trim();
          if (!nombre || !renameTarget) return;

          if (renameTarget.isSubfolder) {
            await renameSubfolder(renameTarget.id, nombre);
          } else {
            // si luego habilitas renombrar carpetas no-raíz, aquí llamas a su helper
            // await renameFolder(renameTarget.carpeta_id, nombre);
          }

          setShowRenameModal(false);
          setRenameTarget(null);
          await refreshTree();
        }}
      />
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
        onConfirm={async () => {
        if (!deleteTarget) return;
        if (deleteTarget.isSubfolder) {
          try {
            await deleteSubfolder(deleteTarget.id); // si te manda 409, muestras un modal “forzar”
            await refreshTree();
          } catch (e) {
            if (e?.response?.status === 409) {
              // vuelve a abrir el modal preguntando si forzar
              await deleteSubfolder(deleteTarget.id, true);
              await refreshTree();
            }
          }
        }
        setShowDeleteModal(false);
        setDeleteTarget(null);
      }}
        message={deleteMessage || "¿Eliminar de todas formas?"}
      />
      <DeleteConfirmModal
        isOpen={showDeleteFileModal}
        onClose={() => { setShowDeleteFileModal(false); setFileToDelete(null); }}
        onConfirm={confirmDeleteFile}
        message={deleteMessage || "¿Seguro que desea eliminar el archivo?"}
      />
      <UploadFileModal
        isOpen={isModalOpen}
        onClose={closeModal}
        isVersionUpload={false}
        handleFileUpload={(f) => handleFileUpload(f)}
      />

      {/* Vista */}
      <div className="files-section">
        {filesData.length === 0 ? (
          <div className="empty-folder-msg" style={{ margin: "2rem", fontSize: "1.1rem" }}>
            No hay carpetas disponibles para este apartado.
          </div>
        ) : (
          <>
            <div className="table-header compact">
              <span>Carpeta</span>
              <span>Archivo</span>
              <span>Fecha de Subida</span>
              <span></span>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="folders" type="DEFAULT">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {filesData
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
                                searchQuery={""}
                                openModal={openModal}
                                handleCreateSubfolder={handleCreateSubfolder}
                                handleRename={handleRename}
                                handleDelete={handleDelete}
                                handleDeleteFile={handleDeleteFile}
                                onDownload={handleDownload}
                                rootName={rootName}
                                defaultOpenFolderId={defaultOpenFolderId}
                                defaultOpenSubId={defaultOpenSubId}
                                highlightFileId={highlightFileId}
                                openSubIds={openSubIds}
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
}

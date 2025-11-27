// MyDocuments.jsx
import { useEffect, useState, useMemo } from "react";
import api from "@/services/api";
import { toFileURL } from "@/utils/urls";
import { FaSearch, FaFilePdf, FaFolderOpen, FaFolder, FaEye, FaDownload } from "react-icons/fa";
import "@/styles/filessection.css";
import MobileFolder from "../Components/MobileFolder";


/* =========================
   Helpers de auth
========================= */
const parseJSON = (s) => { try { return JSON.parse(s || "{}"); } catch { return {}; } };
const readFromBoth = (k) => localStorage.getItem(k) ?? sessionStorage.getItem(k) ?? null;

const safeAtob = (s) => { try { return atob(s); } catch { return ""; } };
const decodeJWT = (t) => {
  try {
    const [, payload] = t.split(".");
    return parseJSON(safeAtob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch { return {}; }
};

const getAuthUser = () => {
  const raw = readFromBoth("authUser") || readFromBoth("user") || "{}";
  const u = parseJSON(raw);
  const token = readFromBoth("token") || readFromBoth("authToken") || "";
  const p = token ? decodeJWT(token) : {};
  return {
    id: u?.id ?? p?.id ?? p?.usuario_id ?? null,
    cliente_id: u?.cliente_id ?? p?.cliente_id ?? null,
  };
};

/* =========================
   Componente principal
========================= */
const MyDocuments = () => {
  const { id: usuarioId, cliente_id } = getAuthUser();
  const [apartados, setApartados] = useState([]);
  const [apartadoId, setApartadoId] = useState(null);
  const [filesTree, setFilesTree] = useState([]);
  const [openFolders, setOpenFolders] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const isMobile = window.innerWidth <= 768;

  /* =========================
       1. Cargar apartados
  ========================= */
  useEffect(() => {
    const loadApartados = async () => {
      try {
        const { data } = await api.get(`/apartados/cliente-usuario`);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.rows)
          ? data.rows
          : Array.isArray(data?.apartados)
          ? data.apartados
          : [];
        const mapped = list.map((x) => ({ id: x.id, nombre: x.nombre ?? "—" }));
        setApartados(mapped);
        if (mapped.length) setApartadoId(mapped[0].id);
      } catch (e) {
        console.error("[ClienteUsuario] Error cargando apartados:", e);
      }
    };
    loadApartados();
  }, [cliente_id]);

  /* =========================
       2. Cargar archivos
  ========================= */
  useEffect(() => {
    const loadAssigned = async () => {
      if (!apartadoId) { setFilesTree([]); return; }

      try {
        setLoading(true);
        const { data } = await api.get(`/asignaciones/cliente-usuario`, {
          params: { apartado_cliente_id: apartadoId, usuario_id: usuarioId },
        });

        const rows = Array.isArray(data) ? data : [];

        const mapFile = (f) => ({
          id: f.id,
          name: f.nombre,
          code: f.codigo || "No incluye",
          approvalDate: f.fecha_aprobacion ? f.fecha_aprobacion.slice(0, 10) : "No incluye",
          uploadDate: f.fecha_subida ? f.fecha_subida.slice(0, 10) : "No incluye",
          version: f.version ?? 1,
          url: toFileURL(f.url_archivo),
        });

        const root = [];
        const index = new Map();

        const ensureNode = (parts) => {
          const key = parts.join("/");
          if (index.has(key)) return index.get(key);
          const name = parts[parts.length - 1] || "(Sin carpeta)";
          const node = { id: key || "root", name, files: [], subfolders: [] };
          index.set(key, node);
          if (parts.length === 1) {
            root.push(node);
          } else {
            const parent = ensureNode(parts.slice(0, -1));
            if (!parent.subfolders.find((x) => x.id === node.id)) parent.subfolders.push(node);
          }
          return node;
        };

        for (const r of rows) {
          const full = (r.full_path || "").trim();
          const parts = full ? full.split("/").filter(Boolean) : ["(Sin carpeta)"];
          const parent = ensureNode(parts);
          parent.files.push(mapFile(r));
        }

        const byName = (a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" });
        const sortTree = (nodes) => {
          nodes.sort(byName);
          for (const n of nodes) {
            n.files.sort(byName);
            sortTree(n.subfolders);
          }
        };
        sortTree(root);
        setFilesTree(root);
      } catch (e) {
        console.error("[ClienteUsuario] Error cargando asignados:", e);
        setFilesTree([]);
      } finally {
        setLoading(false);
      }
    };
    loadAssigned();
  }, [apartadoId, usuarioId]);

  /* =========================
       3. Filtrado
  ========================= */
  const filteredTree = useMemo(() => {
    if (!search.trim()) return filesTree;
    const q = search.toLowerCase();

    const filterNode = (node) => {
      const files = node.files.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.code.toLowerCase().includes(q)
      );
      const subfolders = node.subfolders
        .map(filterNode)
        .filter((sf) => sf.files.length || sf.subfolders.length);
      if (!files.length && !subfolders.length) return null;
      return { ...node, files, subfolders };
    };

    return filesTree
      .map(filterNode)
      .filter(Boolean);
  }, [search, filesTree]);

  const toggleFolder = (key) => setOpenFolders((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="files-section">

      {/* =========================
           HEADER
      ========================= */}
      <h2 style={{ marginBottom: 10 }}>Documentos</h2>

      {/* 🔥 Selector debajo del título */}
      <div className="search-category-container-mobile">
        <select
          value={apartadoId ?? ""}
          onChange={(e) => setApartadoId(Number(e.target.value))}
          className="mobile-category-select"
        >
          {apartados.length === 0 && <option>Sin apartados</option>}
          {apartados.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
      </div>

      {/* 🔍 Buscador */}
      <div className="search-container-mobile">
        <input
          type="text"
          placeholder="Buscar archivo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FaSearch className="search-icon" />
      </div>

      {/* =========================
           VISTA PC ORIGINAL
      ========================= */}
      {!isMobile && (
        <>
          <div className="table-header">
            <span>Tipo</span>
            <span>Nombre</span>
            <span>Código</span>
            <span>F. Aprobación</span>
            <span>F. Subida</span>
            <span>Versión</span>
            <span></span>
          </div>

          {!loading && filteredTree.map((node) => (
            <Folder
              key={node.id}
              node={node}
              openFolders={openFolders}
              toggleFolder={toggleFolder}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
            />
          ))}
        </>
      )}

      {/* =========================
       VISTA MÓVIL (NUEVA)
========================= */}
      {isMobile && (
        <div className="mobile-documents-list">
          {filteredTree.map((folder) => (
            <MobileFolder
              key={folder.id}
              node={folder}
              setSelectedFile={setSelectedFile}
            />
          ))}
        </div>
      )}

      {/* =========================
           MODAL MÓVIL
      ========================= */}
      {isMobile && selectedFile && (
  <div className="mobile-modal">
    <div className="mobile-modal-content">

      <h3 style={{ marginBottom: 15 }}>Detalles del archivo</h3>

      <p><b>Nombre:</b> {selectedFile.name}</p>
      <p><b>Código:</b> {selectedFile.code}</p>
      <p><b>Fecha aprobación:</b> {selectedFile.approvalDate}</p>
      <p><b>Versión:</b> {selectedFile.version}</p>

      <hr style={{ margin: "15px 0" }} />

      <button
        className="mobile-modal-btn"
        onClick={() => window.open(selectedFile.url, "_blank")}
      >
        Ver archivo
      </button>

      <button
        className="mobile-modal-btn"
        onClick={() => {
          const a = document.createElement("a");
          a.href = selectedFile.url;
          a.download = selectedFile.name;
          a.click();
        }}
      >
        Descargar
      </button>

      <button
        className="mobile-modal-btn close"
        onClick={() => setSelectedFile(null)}
      >
        Cerrar
      </button>
    </div>
  </div>
)}

    </div>
  );
};

/* =========================
   Folder para PC
========================= */
const Folder = ({ node, openFolders, toggleFolder, menuOpen, setMenuOpen }) => {
  const isOpen = openFolders[node.id];

  return (
    <div style={{ marginLeft: 16 }}>
      <div className="subfolder-header" onClick={() => toggleFolder(node.id)}>
        {isOpen ? <FaFolderOpen /> : <FaFolder />} {node.name}
      </div>

      {isOpen && (
        <div className="subfolder-content">
          {node.files.map((f) => (
            <div key={f.id} className="file-item" style={{ position: "relative" }}>
              <span className="file-icon"><FaFilePdf /></span>
              <span className="file-name">{f.name}</span>
              <span>{f.code}</span>
              <span>{f.approvalDate}</span>
              <span>{f.uploadDate}</span>
              <span>{f.version}</span>
            </div>
          ))}

          {(node.subfolders || []).map((sf) => (
            <Folder
              key={sf.id}
              node={sf}
              openFolders={openFolders}
              toggleFolder={toggleFolder}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDocuments;

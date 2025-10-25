// src/Modulos/Cliente Administrador/Pages/DocumentosCliente.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import '../../../styles/filesSection.css';
import { FaSearch, FaFilePdf, FaEllipsisV, FaFolderOpen, FaFolder } from 'react-icons/fa';
import { useParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/* =========================
   Helpers de storage / token
   ========================= */
const parseJSON = (s) => { try { return JSON.parse(s || '{}'); } catch { return {}; } };
const readFromBothStorages = (key) => localStorage.getItem(key) ?? sessionStorage.getItem(key) ?? null;

const safeAtob = (s) => { try { return atob(s); } catch { return ''; } };
const decodeJWT = (token) => {
  try {
    const [_, payload] = token.split('.');
    if (!payload) return {};
    return parseJSON(safeAtob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch { return {}; }
};

const getUidFromURL = () => {
  const sp = new URLSearchParams(window.location.search);
  const uid = sp.get('uid') ?? sp.get('usuario_id'); // admite ?uid=11 ó ?usuario_id=11
  return uid ? Number(uid) : null;
};

const getAuthUser = () => {
  const rawStr =
    readFromBothStorages('authUser') ||
    readFromBothStorages('user') ||
    readFromBothStorages('currentUser') ||
    '{}';

  const u = parseJSON(rawStr);
  const token = readFromBothStorages('token') || readFromBothStorages('authToken') || '';
  const payload = token ? decodeJWT(token) : {};

  return {
    id:          u?.id ?? u?.usuario_id ?? u?.user_id ?? u?.userId ?? u?.usuario?.id ?? payload?.id ?? payload?.usuario_id ?? null,
    cliente_id:  u?.cliente_id ?? u?.clienteId ?? u?.cliente?.id ?? payload?.cliente_id ?? null,
    email:       u?.email ?? u?.correo ?? u?.mail ?? u?.usuario?.email ?? payload?.email ?? null,
    dni:         u?.dni ?? u?.documento ?? u?.numero_documento ?? payload?.dni ?? null,
    nombre:      u?.nombre ?? u?.name ?? u?.usuario?.nombre ?? payload?.nombre ?? '',
    rol:         u?.rol ?? u?.role ?? payload?.rol ?? '',
    raw: u,
  };
};

/* =========================
   Filas de archivo y nodo
   ========================= */
const FileRow = ({ file, onMenuToggle, isOpen, rowKey }) => (
  <div className="file-item" key={rowKey} style={{ position: 'relative' }}>
    <span className="file-icon"><FaFilePdf /></span>
    <span className="file-name">{file.name}</span>
    <span>{file.code}</span>
    <span>{file.approvalDate || 'No incluye'}</span>
    <span>{file.uploadDate || 'No incluye'}</span>
    <span>{file.version}</span>
    <span className="file-options" style={{ position: 'relative' }}>
      <FaEllipsisV className="menu-icon" onClick={onMenuToggle} />
      {isOpen && (
        <div className="file-menu">
          <div onClick={() => window.open(file.url, '_blank')}>Ver documento</div>
          <div onClick={() => { const a = document.createElement('a'); a.href = file.url; a.download = file.name; a.click(); }}>
            Descargar
          </div>
        </div>
      )}
    </span>
  </div>
);

const FolderNode = ({ node, openFolders, setOpenFolders, search, menuOpen, setMenuOpen, depth = 0 }) => {
  const key = `node-${node.id}`;
  const isOpen = !!openFolders[key];

  const toggle = () => setOpenFolders(prev => ({ ...prev, [key]: !prev[key] }));
  const filterFiles = (files = []) =>
    files.filter(f => (f.name || '').toLowerCase().includes((search || '').toLowerCase()));

  return (
    <div style={{ marginLeft: depth ? 16 : 0 }}>
      <div className="subfolder-header" onClick={toggle}>
        {isOpen ? <FaFolderOpen /> : <FaFolder />} {node.name}
      </div>

      {isOpen && (
        <div className="subfolder-content">
          {filterFiles(node.files).map((file, i) => (
            <FileRow
              key={`${key}-f-${i}`}
              file={file}
              rowKey={`${key}-f-${i}`}
              isOpen={menuOpen === `${key}-f-${i}`}
              onMenuToggle={() => setMenuOpen(menuOpen === `${key}-f-${i}` ? null : `${key}-f-${i}`)}
            />
          ))}

          {(node.subfolders || []).map((sf) => (
            <FolderNode
              key={`node-${sf.id}`}
              node={sf}
              openFolders={openFolders}
              setOpenFolders={setOpenFolders}
              search={search}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* =========================
   Componente principal
   ========================= */
const DocumentosCliente = () => {
  const { clientId: clientIdFromRoute } = useParams();

  // Usuario (QS > storage)
  const uidFromQS = getUidFromURL();
  const initialUser = getAuthUser();
  const [usuarioId, setUsuarioId] = useState(uidFromQS ?? initialUser.id ?? null);
  const [userMeta] = useState(initialUser);

  // Cliente
  const [clienteId, setClienteId] = useState(initialUser?.cliente_id ?? null);
  const [clienteNombre, setClienteNombre] = useState('');

  // Apartados
  const [apartados, setApartados] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');

  // Árbol real de archivos (sin “Año”)
  const [filesTree, setFilesTree] = useState([]);

  // UI state
  const [openFolders, setOpenFolders] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);
  const [search, setSearch] = useState('');
  const [loadingApartados, setLoadingApartados] = useState(false);

  /* =========================
     Resolver usuarioId
     ========================= */
  useEffect(() => {
    const resolveUsuarioId = async () => {
      if (usuarioId) return;

      try {
        if (userMeta.email) {
          try {
            const { data } = await axios.get(`${API}/api/usuarios/by-email`, { params: { email: userMeta.email } });
            const idOk = data?.id ?? data?.usuario_id ?? null;
            if (idOk) { setUsuarioId(Number(idOk)); return; }
          } catch {}
        }
        if (userMeta.dni) {
          try {
            const { data } = await axios.get(`${API}/api/usuarios/by-dni`, { params: { dni: userMeta.dni } });
            const idOk = data?.id ?? data?.usuario_id ?? null;
            if (idOk) { setUsuarioId(Number(idOk)); return; }
          } catch {}
        }
        const fallbackId = userMeta.raw?.id ?? userMeta.raw?.usuario_id ?? userMeta.raw?.user_id ?? null;
        if (fallbackId) {
          try {
            const { data } = await axios.get(`${API}/api/usuarios/${fallbackId}`);
            const idOk = data?.id ?? data?.usuario_id ?? null;
            if (idOk) { setUsuarioId(Number(idOk)); return; }
          } catch {}
        }
        console.warn('[DocCliente] No pude resolver usuarioId automáticamente. Usa ?uid=11 en la URL para probar.');
      } catch (e) {
        console.error('[DocCliente] Error resolviendo usuarioId:', e);
      }
    };
    resolveUsuarioId();
  }, [usuarioId, userMeta]);

  /* =========================
     Resolver cliente (id y nombre)
     ========================= */
  useEffect(() => {
    const resolveCliente = async () => {
      try {
        if (clienteId) {
          const { data } = await axios.get(`${API}/api/clientes`);
          const lista = Array.isArray(data)
            ? data
            : (Array.isArray(data?.clientes) ? data.clientes
            : (Array.isArray(data?.rows) ? data.rows : []));
          const cli = lista.find(c => Number(c.id) === Number(clienteId));
          if (cli?.nombre || cli?.nombre_comercial) {
            setClienteNombre(cli.nombre || cli.nombre_comercial);
          }
          return;
        }

        if (usuarioId) {
          try {
            const { data: userApi } = await axios.get(`${API}/api/usuarios/${usuarioId}`);
            const cliIdFromUser = userApi?.cliente_id || userApi?.clienteId || userApi?.cliente?.id;
            if (cliIdFromUser) {
              setClienteId(Number(cliIdFromUser));
              return;
            }
          } catch {}
        }

        const { data } = await axios.get(`${API}/api/clientes`);
        const lista = Array.isArray(data)
          ? data
          : (Array.isArray(data?.clientes) ? data.clientes
          : (Array.isArray(data?.rows) ? data.rows : []));

        if (lista.length === 1) {
          setClienteId(lista[0].id);
          setClienteNombre(lista[0].nombre || lista[0].nombre_comercial || '');
          return;
        }

        const candidates = ['ruc', 'numero_documento', 'num_documento', 'documento', 'ruc_cliente'];
        let cli = null;
        for (const key of candidates) {
          cli = lista.find(c => String(c?.[key] ?? '').trim() === String(clientIdFromRoute ?? '').trim());
          if (cli) break;
        }
        if (!cli) cli = lista.find(c => Number(c.id) === Number(clientIdFromRoute));

        if (cli?.id) {
          setClienteId(cli.id);
          setClienteNombre(cli.nombre || cli.nombre_comercial || '');
        }
      } catch (e) {
        console.error('[DocCliente] Error resolviendo cliente:', e);
        setClienteNombre('');
      }
    };
    resolveCliente();
  }, [clientIdFromRoute, clienteId, usuarioId]);

  /* =========================
     Cargar apartados del cliente
     ========================= */
  useEffect(() => {
    const loadApartados = async () => {
      const tryLoad = async (idCandidato) => {
        const { data } = await axios.get(`${API}/api/apartados/cliente/${idCandidato}`);
        const listRaw = Array.isArray(data)
          ? data
          : (Array.isArray(data?.rows) ? data.rows
          : (Array.isArray(data?.apartados) ? data.apartados : []));
        return listRaw.map(x => ({ id: x.id, nombre: x.nombre ?? x.nombre_apartado ?? '—' }));
      };

      try {
        setLoadingApartados(true);
        let list = [];
        if (clienteId) list = await tryLoad(clienteId);

        if ((!list || list.length === 0) && clientIdFromRoute) {
          try {
            const list2 = await tryLoad(clientIdFromRoute);
            if (list2.length > 0 && !clienteId) setClienteId(Number(clientIdFromRoute));
            list = list2;
          } catch {}
        }

        const lb = list.find(a => (a.nombre || '').toLowerCase() === 'línea base' || (a.nombre || '').toLowerCase() === 'linea base');

        setApartados(list);
        const def = lb ?? list[0] ?? null;
        setSelectedCategoryId(def ? Number(def.id) : null);
        setSelectedCategoryName(def ? (def.nombre || '') : '');
      } catch (e) {
        console.error('[DocCliente] No se pudieron cargar apartados:', e);
        setApartados([]);
        setSelectedCategoryId(null);
        setSelectedCategoryName('');
      } finally {
        setLoadingApartados(false);
      }
    };

    if (clienteId || clientIdFromRoute) loadApartados();
  }, [clienteId, clientIdFromRoute]);

  /* =========================
     Cargar estructura ASIGNADA (árbol real por ruta)
     ========================= */
  useEffect(() => {
    const loadAssigned = async () => {
      if (!usuarioId || !clienteNombre || !selectedCategoryId) {
        setFilesTree([]);
        return;
      }
      try {
        // 1) filas planas
        const { data } = await axios.get(`${API}/api/asignaciones/cliente-usuario`, {
          params: { apartado_cliente_id: selectedCategoryId, usuario_id: usuarioId }
        });
        const rows = Array.isArray(data) ? data : [];

        // 2) map file
        const mapFile = (f) => ({
          id: f.id,
          name: f.nombre,
          code: f.codigo || 'No incluye',
          approvalDate: f.fecha_aprobacion ? String(f.fecha_aprobacion).slice(0,10) : 'No incluye',
          uploadDate: f.fecha_subida ? String(f.fecha_subida).slice(0,10) : 'No incluye',
          version: f.version ?? 1,
          url: `${API}${f.url_archivo || ''}`,
        });

        // 3) construir árbol por "full_path"
        const root = [];
        const index = new Map();

        const ensureNode = (parts) => {
          const key = parts.join('/');
          if (index.has(key)) return index.get(key);

          const name = parts[parts.length - 1] || '(Sin carpeta)';
          const node = { id: key || 'root', name, orden: 0, files: [], subfolders: [] };
          index.set(key, node);

          if (parts.length === 1) {
            if (!root.includes(node)) root.push(node);
          } else {
            const parent = ensureNode(parts.slice(0, -1));
            if (!parent.subfolders.find(x => x.id === node.id)) parent.subfolders.push(node);
          }
          return node;
        };

        for (const r of rows) {
          const full = (r.full_path || '').trim();                // "Carpeta/Sub1/Sub2"
          const parts = full ? full.split('/').filter(Boolean) : ['(Sin carpeta)'];
          const parent = ensureNode(parts);
          parent.files.push(mapFile(r));
        }

        // 4) ordenar por nombre
        const byName = (a, b) => String(a.name || '').localeCompare(String(b.name || ''));
        const sortTree = (nodes) => {
          nodes.sort(byName);
          for (const n of nodes) {
            (n.files || []).sort(byName);
            sortTree(n.subfolders || []);
          }
        };
        sortTree(root);

        setFilesTree(root);
      } catch (e) {
        console.error('[DocCliente] Error cargando estructura asignada:', e);
        setFilesTree([]);
      }
    };
    loadAssigned();
  }, [usuarioId, clienteNombre, selectedCategoryId]);

  /* =========================
     Render
     ========================= */
  return (
    <div className="files-section">
      <div className="header-with-search">
        <h2>Documentos</h2>

        <div className="search-category-container">
          <select
            className="category-dropdown"
            value={selectedCategoryId ?? ''}
            onChange={(e) => {
              const id = e.target.value ? Number(e.target.value) : null;
              setSelectedCategoryId(id);
              const found = apartados.find(a => Number(a.id) === id);
              setSelectedCategoryName(found?.nombre || '');
            }}
            disabled={loadingApartados || apartados.length === 0}
            style={{ minWidth: 220 }}
          >
            {loadingApartados && <option>Cargando apartados…</option>}
            {!loadingApartados && apartados.length === 0 && <option>Sin apartados</option>}
            {!loadingApartados && apartados.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>

          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar archivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FaSearch className="search-icon" />
          </div>
        </div>
      </div>

      <div className="table-header">
        <span>Tipo</span>
        <span>Nombre</span>
        <span>Código</span>
        <span>F. Aprobación</span>
        <span>F. Subida</span>
        <span>Versión</span>
        <span></span>
      </div>

      {filesTree.length > 0 && filesTree.map((node) => (
        <FolderNode
          key={`node-${node.id}`}
          node={node}
          openFolders={openFolders}
          setOpenFolders={setOpenFolders}
          search={search}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          depth={0}
        />
      ))}

      {filesTree.length === 0 && (
        <div style={{ padding: '16px', color: '#666' }}>
          {selectedCategoryId ? 'No hay archivos asignados en este apartado.' : 'Selecciona un apartado.'}
        </div>
      )}
    </div>
  );
};

export default DocumentosCliente;

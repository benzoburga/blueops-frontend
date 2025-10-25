// src/controllers/estructura.controller.js
const { pool } = require('../config/db');

// slug consistente (minúsculas, sin acentos, espacios=>"-")
const slugify = (s = '') =>
  String(s)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// === helpers: archivos y subcarpetas ===
const getArchivosDeCarpeta = async (carpetaId) => {
  const [rows] = await pool.query(
    `SELECT
       id,
       nombre,
       COALESCE(codigo, 'no disponible') AS codigo,
       COALESCE(version, 1)             AS version,
       fecha_aprobacion,
       fecha_subida,
       url_archivo
     FROM archivos
     WHERE carpeta_id = ?
       AND (subcarpeta_id IS NULL OR subcarpeta_id = 0)
     ORDER BY fecha_subida DESC, id DESC`,
    [carpetaId]
  );
  return rows;
};

const getArchivosDeSubcarpeta = async (subcarpetaId) => {
  const [rows] = await pool.query(
    `SELECT
       id,
       nombre,
       COALESCE(codigo, 'no disponible') AS codigo,
       COALESCE(version, 1)             AS version,
       fecha_aprobacion,
       fecha_subida,
       url_archivo
     FROM archivos
     WHERE subcarpeta_id = ?
     ORDER BY fecha_subida DESC, id DESC`,
    [subcarpetaId]
  );
  return rows;
};

const buildSubTree = async (carpetaId, parentSubId = null) => {
  const params = parentSubId == null ? [carpetaId] : [carpetaId, parentSubId];
  const [subs] = await pool.query(
    `
    SELECT id, nombre AS name, orden, subcarpeta_padre_id
    FROM subcarpetas
    WHERE carpeta_id = ?
      AND ${parentSubId == null ? 'subcarpeta_padre_id IS NULL' : 'subcarpeta_padre_id = ?'}
    ORDER BY orden, nombre, id
    `,
    params
  );

  for (const s of subs) {
    s.files = await getArchivosDeSubcarpeta(s.id);
    s.subfolders = await buildSubTree(carpetaId, s.id);
  }
  return subs;
};

// === filtro opcional por asignaciones ===
const filterTreeByAssigned = (node, assignedIds) => {
  const files = (node.files || []).filter(f => assignedIds.has(f.id));
  const subfolders = (node.subfolders || [])
    .map(sf => filterTreeByAssigned(sf, assignedIds))
    .filter(sf => (sf.files?.length || sf.subfolders?.length));
  return { ...node, files, subfolders };
};

// === Controller: usa SLUGS en la URL ===
exports.getEstructuraBySlugs = async (req, res) => {
  try {
    const clienteSlug  = slugify(String(req.params.clienteSlug || '').trim());
    const apartadoSlug = slugify(String(req.params.apartadoSlug || '').trim());
    const usuarioId    = req.query.usuario_id ? Number(req.query.usuario_id) : null;

    if (!clienteSlug || !apartadoSlug) {
      return res.status(400).json({ error: 'clienteSlug y apartadoSlug requeridos' });
    }

    // 1) Resolver cliente por slug
    const [clientes] = await pool.query(`SELECT id, nombre_comercial, ruc FROM clientes`);
    const cliente = clientes.find(c => slugify(c.nombre_comercial || '') === clienteSlug
      || String(c.id) === clienteSlug
      || String(c.ruc) === clienteSlug); // (opcional) tolerar ID/RUC
    if (!cliente) return res.status(404).json({ error: 'cliente_no_encontrado' });

    // 2) Resolver tipo_apartado por slug (tolerante)
const [apartados] = await pool.query(`SELECT id, nombre FROM tipos_apartado`);

const norm = (s='') =>
  slugify(s)                // mismo slugify tuyo
    .replace(/-/g, '');     // quitar guiones: "emo-s" -> "emos"

// variantes que aceptamos desde la URL
const wanted0 = norm(apartadoSlug);              // p.e. "emo" | "emos"
const wantedSet = new Set([
  wanted0,
  wanted0.replace(/s$/, ''),                     // sin plural: "emos" -> "emo"
  wanted0.endsWith('s') ? wanted0 : wanted0+'s' // con plural: "emo" -> "emos"
]);

const tipo = apartados.find(t => {
  const tk = norm(t.nombre); // "EMO´s" -> "emos"
  return wantedSet.has(tk);
});

if (!tipo) return res.status(404).json({ error: 'apartado_no_encontrado' });



    // 3) Obtener apartados_cliente.id
    const [[ac]] = await pool.query(
      `SELECT id FROM apartados_cliente WHERE cliente_id=? AND tipo_apartado_id=? LIMIT 1`,
      [cliente.id, tipo.id]
    );
    if (!ac) return res.json({ carpetas: [], subcarpetas: [] });

    // 4) Cargar carpetas base
    const [carpetas] = await pool.query(
      `SELECT id, nombre AS name, orden
       FROM carpetas
       WHERE apartado_cliente_id=?
       ORDER BY orden, nombre, id`,
      [ac.id]
    );

    // 5) Completar árbol (archivos + subcarpetas)
    for (const c of carpetas) {
      c.files = await getArchivosDeCarpeta(c.id);
      c.subfolders = await buildSubTree(c.id, null);
    }

    // 6) Filtrado por asignaciones (opcional)
    if (usuarioId) {
      const [asig] = await pool.query(
        `SELECT archivo_id FROM asignaciones_archivos WHERE usuario_id=?`,
        [usuarioId]
      );
      const set = new Set(asig.map(a => a.archivo_id));
      const filtrado = carpetas
        .map(c => filterTreeByAssigned(c, set))
        .filter(c => (c.files?.length || c.subfolders?.length));
      return res.json({
        cliente_id: cliente.id,
        cliente_nombre: cliente.nombre_comercial,
        tipo_apartado_id: tipo.id,
        tipo_apartado_nombre: tipo.nombre,
        carpetas: filtrado
      });
    }

    // 7) Respuesta completa
    return res.json({
      cliente_id: cliente.id,
      cliente_nombre: cliente.nombre_comercial,
      tipo_apartado_id: tipo.id,
      tipo_apartado_nombre: tipo.nombre,
      carpetas
    });

  } catch (e) {
    console.error('[getEstructuraBySlugs] ERROR', e);
    return res.status(500).json({ error: 'server_error' });
  }
};

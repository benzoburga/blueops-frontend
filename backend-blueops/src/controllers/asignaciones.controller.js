// src/controllers/asignaciones.controller.js
const { pool } = require('../config/db');

// Helper local: logMovimiento (sin services)
async function logMovimiento({
  tipo, req, archivo_id, numero_version = null,
  apartado_cliente_id = null, carpeta_id = null, subcarpeta_id = null,
  trabajador_id = null, cliente_id = null,
}) {
  try {
    const actor_usuario_id = req?.user?.id || null;
    // Distingue rol visible SOLO entre ADMINISTRADOR y MEDICO
    const rawRol = (req?.user?.rol || req?.user?.role || '').toString().toLowerCase();
    const actor_rol = rawRol.includes('med') ? 'MEDICO' : 'ADMINISTRADOR';

    await pool.query(
      `INSERT INTO movimientos
       (tipo, actor_usuario_id, actor_rol, cliente_id, archivo_id, trabajador_id,
        apartado_cliente_id, carpeta_id, subcarpeta_id, numero_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tipo, actor_usuario_id, actor_rol, cliente_id, archivo_id, trabajador_id,
       apartado_cliente_id, carpeta_id, subcarpeta_id, numero_version]
    );
  } catch (e) {
    console.warn('logMovimiento WARN:', e?.message);
  }
}


/* =========================
   Helpers
   ========================= */
async function resolveUsuarioId(req) {
  const u = req.user || {};
  const tryQ = [];

  if (u.id)               tryQ.push(['SELECT id FROM usuarios WHERE id=? LIMIT 1', [u.id]]);
  if (u.email || u.correo)tryQ.push(['SELECT id FROM usuarios WHERE email=? LIMIT 1', [u.email || u.correo]]);
  if (u.trabajador_id)    tryQ.push(['SELECT id FROM usuarios WHERE trabajador_id=? LIMIT 1', [u.trabajador_id]]);
  if (u.dni)              tryQ.push(['SELECT id FROM usuarios WHERE dni=? LIMIT 1', [u.dni]]);

  for (const [q, v] of tryQ) {
    const [r] = await pool.query(q, v);
    if (r.length) return r[0].id;
  }
  return null;
}

/* =========================
   1) Asignar archivo ↔ usuarios
   ========================= */
const asignarArchivoAUsuarios = async (req, res) => {
  const { archivo_id, usuario_ids = [], trabajador_ids = [] } = req.body;

  if (!archivo_id) return res.status(400).json({ msg: 'archivo_id requerido' });
  if (!Array.isArray(usuario_ids) || !Array.isArray(trabajador_ids))
    return res.status(400).json({ msg: 'Arrays inválidos' });

  try {
    let finalUsuarioIds = [...usuario_ids];

    if (trabajador_ids.length) {
      const [urows] = await pool.query(
        `SELECT id FROM usuarios WHERE trabajador_id IN (?)`,
        [trabajador_ids]
      );
      finalUsuarioIds.push(...urows.map(r => r.id));
    }

    finalUsuarioIds = [...new Set(finalUsuarioIds.filter(Boolean))];
    if (!finalUsuarioIds.length) {
      return res.status(400).json({ msg: 'No hay usuarios válidos para asignar' });
    }

    const values = finalUsuarioIds.map(uid => [archivo_id, uid]);
    await pool.query(
      `INSERT IGNORE INTO asignaciones_archivos (archivo_id, usuario_id) VALUES ?`,
      [values]
    );

    // Loguear 1 movimiento por usuario asignado (si tiene trabajador asociado)
if (finalUsuarioIds.length) {
  const [uinfo] = await pool.query(`
    SELECT u.id AS usuario_id, t.id AS trabajador_id
    FROM usuarios u
    LEFT JOIN trabajadores t ON t.id = u.trabajador_id
    WHERE u.id IN (?)
  `, [finalUsuarioIds]);

  // cliente_id: lo tomamos del archivo → apartado_cliente → cliente
  let cliente_id = null;
  let apartado_cliente_id = null;
  let carpeta_id = null;
  let subcarpeta_id = null;
  try {
    const [[a]] = await pool.query(`
      SELECT a.apartado_cliente_id, a.carpeta_id, a.subcarpeta_id, ac.cliente_id
      FROM archivos a
      LEFT JOIN apartados_cliente ac ON ac.id = a.apartado_cliente_id
      WHERE a.id = ?
      LIMIT 1
    `, [archivo_id]);
    if (a) {
      apartado_cliente_id = a.apartado_cliente_id || null;
      carpeta_id = a.carpeta_id || null;
      subcarpeta_id = a.subcarpeta_id || null;
      cliente_id = a.cliente_id || null;
    }
  } catch {}

  for (const row of uinfo) {
    await logMovimiento({
      tipo: 'ASSIGN',
      req,
      archivo_id,
      trabajador_id: row.trabajador_id || null,
      cliente_id,
      apartado_cliente_id,
      carpeta_id,
      subcarpeta_id
    });
  }
}


    res.json({ ok: true, message: 'Asignaciones guardadas correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al asignar archivos' });
  }
};

/* =========================
   2) (Opcional) árbol simple por usuario
   ========================= */
const getArbolAsignadoParaUsuario = async (req, res) => {
  const { usuario_id } = req.params;
  try {
    const [archivos] = await pool.query(`
      SELECT a.id AS archivo_id, a.nombre, a.codigo, a.fecha_subida,
             a.carpeta_id, a.subcarpeta_id,
             v.version, v.fecha_aprobacion, COALESCE(v.url_archivo, a.url_archivo) AS url_archivo
      FROM asignaciones_archivos aa
      JOIN archivos a ON a.id = aa.archivo_id
      LEFT JOIN versiones_archivo v ON v.archivo_id = a.id AND v.vigente = 1
      WHERE aa.usuario_id = ?
    `, [usuario_id]);

    res.json({ ok: true, data: archivos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al obtener árbol' });
  }
};

/* =========================
   3) Listado plano para Cliente(Admin/Usuario)
      ► Devuelve full_path = "Carpeta/Sub1/Sub2"
   ========================= */
const getArchivosAsignadosClienteUsuario = async (req, res) => {
  try {
    const usuarioIdParam = req.query.usuario_id ? Number(req.query.usuario_id) : null;
    const usuarioId = usuarioIdParam || await resolveUsuarioId(req);
    if (!usuarioId) return res.status(401).json({ msg: 'No se pudo resolver usuarios.id' });

    const apartadoClienteId = req.query.apartado_cliente_id
      ? Number(req.query.apartado_cliente_id)
      : null;

    // MySQL 8+ (CTE recursivo para armar path de subcarpetas)
    const sql = `
      WITH RECURSIVE r AS (
        SELECT
          s.id,
          s.nombre,
          s.subcarpeta_padre_id,
          s.carpeta_id,
          CAST(s.nombre AS CHAR(500)) AS path
        FROM subcarpetas s
        WHERE s.subcarpeta_padre_id IS NULL
        UNION ALL
        SELECT
          ch.id,
          ch.nombre,
          ch.subcarpeta_padre_id,
          ch.carpeta_id,
          CONCAT(r.path, '/', ch.nombre) AS path
        FROM subcarpetas ch
        JOIN r ON ch.subcarpeta_padre_id = r.id
      )
      SELECT
        a.id,
        a.nombre,
        COALESCE(a.codigo, 'no disponible') AS codigo,
        COALESCE(v.version, 1)             AS version,
        CASE
          WHEN v.fecha_aprobacion IS NULL OR v.fecha_aprobacion < '1900-01-01' THEN NULL
          ELSE v.fecha_aprobacion
        END AS fecha_aprobacion,
        a.fecha_subida,
        COALESCE(v.url_archivo, a.url_archivo) AS url_archivo,
        a.apartado_cliente_id,

        c.id      AS carpeta_id,
        c.nombre  AS carpeta_nombre,
        r.id      AS subcarpeta_id,
        r.path    AS subcarpeta_path,
        CONCAT_WS('/', c.nombre, r.path) AS full_path
      FROM asignaciones_archivos aa
      JOIN archivos a               ON a.id = aa.archivo_id
      LEFT JOIN versiones_archivo v ON v.archivo_id = a.id AND v.vigente = 1
      LEFT JOIN r                   ON r.id = a.subcarpeta_id
      LEFT JOIN carpetas c          ON c.id = COALESCE(a.carpeta_id, r.carpeta_id)
      WHERE aa.usuario_id = ?
        AND ( ? IS NULL OR a.apartado_cliente_id = ? )
      ORDER BY full_path, a.nombre
    `;
    const params = [usuarioId, apartadoClienteId, apartadoClienteId];

    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (e) {
    console.error('Error getArchivosAsignadosClienteUsuario:', e);
    res.status(500).json({ msg: 'Error obteniendo archivos asignados' });
  }
};

module.exports = {
  asignarArchivoAUsuarios,
  getArbolAsignadoParaUsuario,
  getArchivosAsignadosClienteUsuario,
};

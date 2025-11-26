//trabajadores.controller.js
const { pool } = require('../config/db');

/* ======================== CONSULTAS BASE ======================== */

const baseQueryTodos = `
  SELECT
    t.id,
    t.numero_identificacion,
    t.nombres,
    t.apellidos,
    CONCAT(t.nombres,' ',t.apellidos) AS nombreCompleto,
    DATE_FORMAT(t.fecha_inicio, '%Y-%m-%d') AS fecha_inicio,

    -- campos del modal
    t.sexo,
    DATE_FORMAT(t.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento,
    t.numero,
    t.correo,

    pt.id AS puesto_id,
    pt.nombre AS puesto,
    pt.tipo_riesgo AS tipo,
    CASE
      WHEN pt.tipo_riesgo LIKE 'Alto%' THEN 'Alto'
      WHEN pt.tipo_riesgo LIKE 'Bajo%' THEN 'Bajo'
      ELSE ''
    END AS riesgo,

    c.id AS cliente_id,
    COALESCE(c.nombre_comercial, '') AS cliente
  FROM trabajadores t
  LEFT JOIN puestos_trabajo pt ON pt.id = t.puesto_id
  LEFT JOIN clientes c        ON c.id = t.cliente_id
  WHERE (? = '' OR CONCAT(t.nombres,' ',t.apellidos) LIKE CONCAT('%', ?, '%')
               OR t.numero_identificacion LIKE CONCAT('%', ?, '%')
               OR pt.nombre LIKE CONCAT('%', ?, '%')
               OR COALESCE(c.nombre_comercial, '') LIKE CONCAT('%', ?, '%'))
    AND (? = '' OR
         CASE
           WHEN pt.tipo_riesgo LIKE 'Alto%' THEN 'Alto'
           WHEN pt.tipo_riesgo LIKE 'Bajo%' THEN 'Bajo'
           ELSE ''
         END = ?)
  ORDER BY t.apellidos, t.nombres
`;

const baseQuery = `
  SELECT
    t.id,
    t.numero_identificacion,
    t.nombres,
    t.apellidos,
    t.direccion,
    CONCAT(t.nombres,' ',t.apellidos) AS nombreCompleto,
    DATE_FORMAT(t.fecha_inicio, '%Y-%m-%d') AS fecha_inicio,

    t.sexo,
    DATE_FORMAT(t.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento,
    t.numero,
    t.correo,

    pt.id AS puesto_id,
    pt.nombre AS puesto,
    pt.tipo_riesgo AS tipo,
    CASE
      WHEN pt.tipo_riesgo LIKE 'Alto%' THEN 'Alto'
      WHEN pt.tipo_riesgo LIKE 'Bajo%' THEN 'Bajo'
      ELSE ''
    END AS riesgo,
    u.id AS usuario_id
  FROM trabajadores t
  LEFT JOIN puestos_trabajo pt ON pt.id = t.puesto_id
  LEFT JOIN usuarios u ON u.trabajador_id = t.id
  WHERE t.cliente_id = ?
    AND (? = '' OR CONCAT(t.nombres,' ',t.apellidos) LIKE CONCAT('%', ?, '%')
                 OR t.numero_identificacion LIKE CONCAT('%', ?, '%'))
    AND (? = '' OR
         CASE
           WHEN pt.tipo_riesgo LIKE 'Alto%' THEN 'Alto'
           WHEN pt.tipo_riesgo LIKE 'Bajo%' THEN 'Bajo'
           ELSE ''
         END = ?)
  ORDER BY t.apellidos, t.nombres
`;

/* ======================== HELPERS ======================== */

// normalizador JS (respaldo por si la colación no fuera insensible)
const norm = (s='') => s
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

async function ensurePuestoIdByNombre(nombre, clienteId, tipoRiesgoHint = null) {
  const nom = String(nombre || '').trim();
  if (!nom) return null;

  // 1) ¿existe para el cliente? (case/acentos-insensible)
  const [c1] = await pool.query(
    `SELECT id FROM puestos_trabajo
      WHERE cliente_id = ?
        AND nombre COLLATE utf8_unicode_ci = ?
      LIMIT 1`,
    [clienteId, nom]
  );
  if (c1.length) return c1[0].id;

  // 2) ¿existe global?
  const [c2] = await pool.query(
    `SELECT id FROM puestos_trabajo
      WHERE cliente_id IS NULL
        AND nombre COLLATE utf8_unicode_ci = ?
      LIMIT 1`,
    [nom]
  );
  if (c2.length) return c2[0].id;

  // 3) Crear (usa hint si viene; si no, heurística por nombre)
  let tipo_riesgo = null;
  const hint = String(tipoRiesgoHint || '').toLowerCase();

  if (hint.includes('alto')) tipo_riesgo = 'Alto Riesgo';
  else if (hint.includes('bajo')) tipo_riesgo = 'Bajo Riesgo';
  else if (hint.includes('no incluye')) tipo_riesgo = null;
  else if (/alto/i.test(nom)) tipo_riesgo = 'Alto Riesgo';
  else if (/bajo/i.test(nom)) tipo_riesgo = 'Bajo Riesgo';
  else tipo_riesgo = 'Bajo Riesgo'; // default

  const [ins] = await pool.query(
    'INSERT INTO puestos_trabajo (cliente_id, nombre, tipo_riesgo) VALUES (?,?,?)',
    [clienteId, nom, tipo_riesgo]
  );
  return ins.insertId;
}

/* ======================== CONTROLADORES ======================== */

const getTrabajadoresTodosMedico = async (req, res) => {
  try {
    const { q = '', riesgo = '' } = req.query;
    const [rows] = await pool.query(
      baseQueryTodos,
      [q, q, q, q, q, riesgo, riesgo]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error listando trabajadores (médico/todos):', err);
    res.status(500).json({ msg: 'Error listando trabajadores' });
  }
};

const createTrabajador = async (req, res) => {
  try {
    const cliente_id = Number(req.params.cliente_id);
    const {
      tipoIdentificacionId,
      identificacion,
      nombre,
      apellido,
      sexo,
      direccion,
      fechaNacimiento,
      fechaInicio,
      puesto,
      numero,
      correo,
      tipoRiesgoPuesto, // 👈 opcional (hint)
    } = req.body || {};

    if (!cliente_id || !tipoIdentificacionId || !identificacion || !nombre || !apellido) {
      return res.status(400).json({ msg: 'Faltan campos obligatorios' });
    }

    const puesto_id = await ensurePuestoIdByNombre(
      puesto || 'Asistente Técnico',
      cliente_id,
      tipoRiesgoPuesto || null
    );

    const [ins] = await pool.query(
      `INSERT INTO trabajadores
       (cliente_id, tipo_identificacion_id, numero_identificacion,
        nombres, apellidos, sexo, direccion, fecha_nacimiento, fecha_inicio,
        puesto_id, numero, correo)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        cliente_id,
        tipoIdentificacionId,
        identificacion?.trim(),
        nombre?.trim(),
        apellido?.trim(),
        sexo || null,
        direccion || null,
        fechaNacimiento || null,
        fechaInicio || null,
        puesto_id || null,
        numero || null,
        correo || null,
      ]
    );

    const nuevoId = ins.insertId;
    const [rows] = await pool.query(
      baseQuery.replace('WHERE t.cliente_id = ?','WHERE t.id = ?'),
      [nuevoId, '', '', '', '', '']
    );
    res.status(201).json(rows[0] || { id: nuevoId });
  } catch (err) {
    console.error('Error creando trabajador:', err);
    res.status(500).json({ msg: 'Error creando trabajador' });
  }
};

// BULK
const createTrabajadoresBulk = async (req, res) => {
  const cliente_id = Number(req.params.cliente_id);
  const rowsIn = Array.isArray(req.body?.rows) ? req.body.rows : [];

  if (!cliente_id) return res.status(400).json({ msg: 'cliente_id inválido' });
  if (!rowsIn.length) return res.status(400).json({ msg: 'No hay filas para insertar' });

  const normStr = (s) => (s == null ? '' : String(s).trim());
  const validRows = rowsIn
    .map((r) => ({
      tipoIdentificacionId: r.tipoIdentificacionId ?? r.tipo_identificacion_id ?? null,
      identificacion: normStr(r.identificacion || r.numero_identificacion),
      nombre: normStr(r.nombre || r.nombres),
      apellido: normStr(r.apellido || r.apellidos),
      sexo: r.sexo || null,
      direccion: normStr(r.direccion || ''),
      fechaNacimiento: r.fechaNacimiento || r.fecha_nacimiento || null,
      fechaInicio: r.fechaInicio || r.fecha_inicio || null,
      puesto: normStr(r.puesto || ''),
      numero: normStr(r.numero || ''),
      correo: normStr(r.correo || ''),
      tipoRiesgoPuesto: r.tipoRiesgoPuesto || null, // 👈 hint opcional
    }))
    .filter((r) => r.tipoIdentificacionId && r.identificacion && r.nombre && r.apellido);

  if (!validRows.length) {
    return res.status(400).json({ msg: 'Ninguna fila cumple con los campos obligatorios' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const insertedIds = [];

    for (const r of validRows) {
      const puesto_id = await ensurePuestoIdByNombre(
        r.puesto || 'Asistente Técnico',
        cliente_id,
        r.tipoRiesgoPuesto || null
      );

      const [ins] = await conn.query(
        `INSERT INTO trabajadores
         (cliente_id, tipo_identificacion_id, numero_identificacion,
          nombres, apellidos, sexo, direccion, fecha_nacimiento, fecha_inicio,
          puesto_id, numero, correo)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          cliente_id,
          r.tipoIdentificacionId,
          r.identificacion,
          r.nombre,
          r.apellido,
          r.sexo || null,
          r.direccion || null,
          r.fechaNacimiento || null,
          r.fechaInicio || null,
          puesto_id || null,
          r.numero || null,
          r.correo || null,
        ]
      );

      insertedIds.push(ins.insertId);
    }

    await conn.commit();

    // reutiliza un SELECT por IDs (igual al que ya tengas)
    const placeholders = insertedIds.map(() => '?').join(',');
    const [created] = await pool.query(
      `
      SELECT
        t.id,
        t.numero_identificacion,
        t.nombres,
        t.apellidos,
        t.direccion,
        CONCAT(t.nombres,' ',t.apellidos) AS nombreCompleto,
        DATE_FORMAT(t.fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
        t.sexo,
        DATE_FORMAT(t.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento,
        t.numero,
        t.correo,
        pt.id AS puesto_id,
        pt.nombre AS puesto,
        pt.tipo_riesgo AS tipo,
        CASE
          WHEN pt.tipo_riesgo LIKE 'Alto%' THEN 'Alto'
          WHEN pt.tipo_riesgo LIKE 'Bajo%' THEN 'Bajo'
          ELSE ''
        END AS riesgo
      FROM trabajadores t
      LEFT JOIN puestos_trabajo pt ON pt.id = t.puesto_id
      WHERE t.id IN (${placeholders})
      ORDER BY t.apellidos, t.nombres
      `,
      insertedIds
    );

    return res.status(201).json({ count: created.length, items: created });
  } catch (err) {
    await conn.rollback();
    console.error('Error creando trabajadores (bulk):', err);
    return res.status(500).json({ msg: 'Error creando trabajadores (bulk)' });
  } finally {
    conn.release();
  }
};

const getTrabajadoresPorCliente = async (req, res) => {
  const clienteId = req.params.cliente_id;
  const { q = '', riesgo = '' } = req.query;
  try {
    const [rows] = await pool.query(baseQuery, [clienteId, q, q, q, riesgo, riesgo]);
    res.json(rows);
  } catch (err) {
    console.error('Error listando trabajadores:', err);
    res.status(500).json({ msg: 'Error listando trabajadores' });
  }
};

const getMisTrabajadores = async (req, res) => {
  // Acepta del token o de la query (útil en producción local sin auth)
  const clienteId = req.user?.cliente_id || req.query?.cliente_id;

  if (!clienteId) {
    return res.status(400).json({ msg: 'cliente_id no presente' });
  }

  // Reusa el mismo handler que lista por cliente
  req.params.cliente_id = clienteId;
  return getTrabajadoresPorCliente(req, res);
};

const getTrabajadorById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      baseQuery.replace('WHERE t.cliente_id = ?','WHERE t.id = ?'),
      [id, '', '', '', '', '']
    );
    res.json(rows[0] || {});
  } catch (e) {
    res.status(500).json({ msg: 'Error obteniendo trabajador' });
  }
};

const getPuestosByCliente = async (req, res) => {
  const cliente_id = Number(req.params.cliente_id);
  const incluirGlobales = String(req.query.incluirGlobales || '1') === '1';

  if (!cliente_id) return res.status(400).json({ msg: 'cliente_id inválido' });

  try {
    let sql = `
      SELECT id, nombre, tipo_riesgo
      FROM puestos_trabajo
      WHERE cliente_id = ?
    `;
    const params = [cliente_id];

    if (incluirGlobales) {
      sql += ` OR cliente_id IS NULL`;
    }
    sql += ` ORDER BY nombre`;

    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (e) {
    console.error('Error listando puestos:', e);
    return res.status(500).json({ msg: 'Error listando puestos' });
  }
};

const getCatalogosTrabajador = async (req, res) => {
  const cliente_id = Number(req.params.cliente_id);
  const incluirGlobales = String(req.query.incluirGlobales || '1') === '1';

  if (!cliente_id) return res.status(400).json({ msg: 'cliente_id inválido' });

  try {
    // Puestos del cliente (+ globales opcional)
    let sqlPuestos = `
      SELECT id, nombre, tipo_riesgo
      FROM puestos_trabajo
      WHERE cliente_id = ?
    `;
    if (incluirGlobales) sqlPuestos += ` OR cliente_id IS NULL`;
    sqlPuestos += ` ORDER BY nombre`;
    const [puestos] = await pool.query(sqlPuestos, [cliente_id]);

    // Tipos de identificación
    const [tiposIdentificacion] = await pool.query(
      `SELECT id, nombre FROM tipos_identificacion ORDER BY id`
    );

    // Sexos desde ENUM de trabajadores.sexo
    const [enumRows] = await pool.query(
      `SELECT COLUMN_TYPE
         FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'trabajadores'
          AND COLUMN_NAME  = 'sexo'`
    );
    let sexos = [];
    if (enumRows[0]?.COLUMN_TYPE?.startsWith('enum(')) {
      sexos = enumRows[0].COLUMN_TYPE
        .slice(5, -1)
        .split(',')
        .map(s => s.trim().replace(/^'/,'').replace(/'$/,''));
    }

    res.json({ puestos, tiposIdentificacion, sexos });
  } catch (e) {
    console.error('Error obteniendo catálogos:', e);
    res.status(500).json({ msg: 'Error obteniendo catálogos' });
  }
};

const getPerfilClienteUsuario = async (req, res) => {
  try {
    console.log('[perfil] controlador HIT, req.user =', req.user);

    const userId =
      req.user?.id ??
      req.user?.uid ??
      req.user?.user_id ??
      req.user?.usuario_id ??
      null;

    if (!userId) return res.status(401).json({ msg: 'Token inválido' });
    
    const [uRows] = await pool.query(
      'SELECT trabajador_id FROM usuarios WHERE id = ? LIMIT 1',
      [userId]
    );
    console.log('[perfil] uRows =', uRows);

    if (!uRows.length) return res.status(404).json({ msg: 'Usuario no encontrado' });

    const trabajadorId = uRows[0].trabajador_id;
    console.log('[perfil] trabajadorId =', trabajadorId);

    const [rows] = await pool.query(
      `SELECT
         t.id,
         t.numero_identificacion AS identificacion,
         t.nombres               AS nombre,
         t.apellidos             AS apellido,
         t.sexo,
         t.direccion,
         DATE_FORMAT(t.fecha_nacimiento, '%Y-%m-%d') AS fechaNacimiento,
         DATE_FORMAT(t.fecha_inicio, '%Y-%m-%d')     AS fechaInicio,
         t.numero,
         t.correo,
         pt.nombre               AS puesto,
         COALESCE(pt.tipo_riesgo, 'Bajo Riesgo')     AS tipo
       FROM trabajadores t
       LEFT JOIN puestos_trabajo pt ON pt.id = t.puesto_id
       WHERE t.id = ?
       LIMIT 1`,
      [trabajadorId]
    );
    console.log('[perfil] rows =', rows);

    if (!rows.length) return res.status(404).json({ msg: 'Perfil no encontrado' });

    return res.json({
      ok: true,
      trabajador_id: trabajadorId,
      ...rows[0],
    });
  } catch (err) {
    console.error('Error getPerfilClienteUsuario:', err);
    return res.status(500).json({ msg: 'Error obteniendo perfil' });
  }
};

const updateTrabajador = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ msg: "ID inválido" });

    const {
      nombre,
      apellido,
      direccion,
      sexo,
      fechaNacimiento,
      fechaInicio,
      puesto,            // nombre del puesto (el back resuelve el id)
      numero,
      correo,
    } = req.body || {};

    // 1) obtener cliente_id del trabajador
    const [[t]] = await pool.query(
      "SELECT cliente_id FROM trabajadores WHERE id = ? LIMIT 1",
      [id]
    );
    if (!t) return res.status(404).json({ msg: "Trabajador no encontrado" });

    // 2) resolver/crear puesto_id a partir del nombre
    const puesto_id = await ensurePuestoIdByNombre(
      puesto || "Asistente Técnico",
      t.cliente_id
    );

    // 3) actualizar
    await pool.query(
      `UPDATE trabajadores
       SET nombres = ?, apellidos = ?, direccion = ?, sexo = ?,
           fecha_nacimiento = ?, fecha_inicio = ?, puesto_id = ?,
           numero = ?, correo = ?
       WHERE id = ?`,
      [
        nombre?.trim() ?? null,
        apellido?.trim() ?? null,
        direccion ?? null,
        sexo ?? null,
        fechaNacimiento ?? null,
        fechaInicio ?? null,
        puesto_id ?? null,
        numero ?? null,
        correo ?? null,
        id,
      ]
    );

    // 4) devolver fila actualizada (mismo shape que usas en front)
    const [rows] = await pool.query(
      baseQuery.replace("WHERE t.cliente_id = ?", "WHERE t.id = ?"),
      [id, "", "", "", "", ""]
    );
    return res.json(rows[0] || { id, msg: "Actualizado" });
  } catch (err) {
    console.error("Error actualizando trabajador:", err);
    return res.status(500).json({ msg: "Error actualizando trabajador" });
  }
};


module.exports = {
  getTrabajadoresPorCliente,
  getMisTrabajadores,
  getTrabajadorById,
  createTrabajador,
  getPuestosByCliente,
  getCatalogosTrabajador,
  getPerfilClienteUsuario,
  getTrabajadoresTodosMedico,
  createTrabajadoresBulk,
  updateTrabajador,
};

// backend-blueops/src/controllers/archivos.controller.js
const { pool } = require('../config/db');
const path = require('path');
const fs = require('fs');
const { decode } = require('html-entities');
const { UPLOADS_DIR } = require('../config/path');
const toUtf8 = s => Buffer.from(s || '', 'latin1').toString('utf8');

const { ensureRootCarpetaTrabajador } = require('./carpetas.controller');

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
let actor_rol = 'ADMINISTRADOR';
if (rawRol.includes('med') || rawRol.includes('doctor') || rawRol.includes('salud')) {
  actor_rol = 'MEDICO';
}

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


// ===================== DESCARGAR VERSIÓN =====================
const descargarVersion = async (req, res) => {
  try {
    const { version_id } = req.params;

    const [[row]] = await pool.query(
      'SELECT nombre, url_archivo FROM versiones_archivo WHERE id = ?',
      [version_id]
    );
    if (!row) return res.status(404).send('Versión no encontrada');

    const filename = String(row.url_archivo || '').split('/').pop();
    const filePath = path.join(UPLOADS_DIR, filename);

    if (!fs.existsSync(filePath)) return res.status(404).send('Archivo no encontrado');

    return res.download(filePath, row.nombre || filename);
  } catch (err) {
    console.error('❌ Error al descargar versión:', err);
    return res.status(500).send('Error al descargar la versión');
  }
};

// ===================== ARCHIVOS POR CARPETA =====================
const getArchivosPorCarpeta = async (req, res) => {
  const { carpeta_id } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM archivos WHERE carpeta_id = ? AND subcarpeta_id IS NULL',
      [carpeta_id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener archivos por carpeta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ===================== SUBIR ARCHIVO =====================
const subirArchivo = async (req, res) => {
  let { codigo, version, fecha_aprobacion, apartado_cliente_id, carpeta_id, subcarpeta_id } = req.body;

  codigo = codigo || null;
  version = version || null;
  fecha_aprobacion = fecha_aprobacion || null;
  if (subcarpeta_id === '') subcarpeta_id = null;

  const archivo = req.file;
  if (!archivo) return res.status(400).json({ message: 'No se subió ningún archivo' });

  const nombre = toUtf8(archivo.originalname);
  const fecha_subida = new Date().toISOString().slice(0, 10);
  const url_archivo = `/uploads/${archivo.filename}`;

  const [subcarpetas] = await pool.query(
    'SELECT id FROM subcarpetas WHERE carpeta_id = ?',
    [carpeta_id]
  );

  const carpetaTieneSubcarpetas = subcarpetas.length > 0;
  if (carpetaTieneSubcarpetas && !subcarpeta_id) {
    return res.status(400).json({
      message: 'Esta carpeta tiene subcarpetas. Debes seleccionar una subcarpeta para subir el archivo.'
    });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO archivos (nombre, codigo, version, fecha_aprobacion, fecha_subida, url_archivo, apartado_cliente_id, carpeta_id, subcarpeta_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, codigo, version, fecha_aprobacion, fecha_subida, url_archivo, apartado_cliente_id, carpeta_id, subcarpeta_id]
    );
    // obtener cliente_id desde apartados_cliente si está presente
let cliente_id = null;
if (apartado_cliente_id) {
  const [[ac]] = await pool.query('SELECT cliente_id FROM apartados_cliente WHERE id = ?', [apartado_cliente_id]);
  if (ac) cliente_id = ac.cliente_id;
}

await logMovimiento({
  tipo: 'PUBLISH',
  req,
  archivo_id: result.insertId,
  apartado_cliente_id,
  carpeta_id,
  subcarpeta_id: subcarpeta_id || null,
  cliente_id
});


    res.status(201).json({ message: 'Archivo subido', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en la subida' });
  }
};

// ===================== SUBIR NUEVA VERSIÓN =====================
const subirNuevaVersion = async (req, res) => {
  const archivo_id = req.params.archivo_id;
  const { codigo, version, fecha_aprobacion } = req.body;
  const archivo = req.file;

  if (!archivo) return res.status(400).json({ message: 'Archivo requerido' });

  const nombre = toUtf8(archivo.originalname);
  const url_archivo = `/uploads/${archivo.filename}`;
  const fecha_subida = new Date().toISOString().slice(0, 10);

  try {
    const [archivoActualRows] = await pool.query('SELECT * FROM archivos WHERE id = ?', [archivo_id]);
    if (archivoActualRows.length === 0) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }
    const archivoActual = archivoActualRows[0];

    const [versionesExistentes] = await pool.query('SELECT COUNT(*) as total FROM versiones_archivo WHERE archivo_id = ?', [archivo_id]);

    if (versionesExistentes[0].total === 0) {
      await pool.query(
        `INSERT INTO versiones_archivo 
        (archivo_id, nombre, codigo, version, fecha_aprobacion, fecha_subida, url_archivo, vigente)
        VALUES (?, ?, ?, ?, ?, ?, ?, false)`,
        [
          archivo_id,
          archivoActual.nombre,
          archivoActual.codigo || 'no disponible',
          archivoActual.version || 1,
          archivoActual.fecha_aprobacion || null,
          archivoActual.fecha_subida || null,
          archivoActual.url_archivo || '',
        ]
      );
    }

    await pool.query('UPDATE versiones_archivo SET vigente = false WHERE archivo_id = ?', [archivo_id]);

    await pool.query(
      `INSERT INTO versiones_archivo 
      (archivo_id, nombre, codigo, version, fecha_aprobacion, fecha_subida, url_archivo, vigente)
      VALUES (?, ?, ?, ?, ?, ?, ?, true)`,
      [archivo_id, nombre, codigo || 'no disponible', version, fecha_aprobacion || null, fecha_subida, url_archivo]
    );

    await pool.query(
      `UPDATE archivos SET 
        nombre = ?, 
        codigo = ?, 
        version = ?, 
        fecha_aprobacion = ?, 
        fecha_subida = ?, 
        url_archivo = ? 
      WHERE id = ?`,
      [nombre, codigo || 'no disponible', version, fecha_aprobacion || null, fecha_subida, url_archivo, archivo_id]
    );

    let cliente_id2 = null;
if (archivoActual.apartado_cliente_id) {
  const [[ac2]] = await pool.query('SELECT cliente_id FROM apartados_cliente WHERE id = ?', [archivoActual.apartado_cliente_id]);
  if (ac2) cliente_id2 = ac2.cliente_id;
}

await logMovimiento({
  tipo: 'VERSION_ADD',
  req,
  archivo_id,
  numero_version: version || null,
  apartado_cliente_id: archivoActual.apartado_cliente_id || null,
  carpeta_id: archivoActual.carpeta_id || null,
  subcarpeta_id: archivoActual.subcarpeta_id || null,
  cliente_id: cliente_id2
});


    res.status(200).json({ message: 'Versión subida correctamente' });
  } catch (error) {
    console.error('❌ Error al subir nueva versión:', error);
    res.status(500).json({ message: 'Error al subir la versión' });
  }
};

// ===================== VERSION VIGENTE =====================
const establecerVersionVigente = async (req, res) => {
  const { version_id } = req.params;

  try {
    const [rows] = await pool.query('SELECT * FROM versiones_archivo WHERE id = ?', [version_id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Versión no encontrada' });

    const version = rows[0];

    await pool.query('UPDATE versiones_archivo SET vigente = false WHERE archivo_id = ?', [version.archivo_id]);
    await pool.query('UPDATE versiones_archivo SET vigente = true WHERE id = ?', [version_id]);

    await pool.query(
      `UPDATE archivos SET 
        nombre = ?, 
        codigo = ?, 
        version = ?, 
        fecha_aprobacion = ?, 
        fecha_subida = ?, 
        url_archivo = ? 
      WHERE id = ?`,
      [version.nombre, version.codigo, version.version, version.fecha_aprobacion, version.fecha_subida, version.url_archivo, version.archivo_id]
    );

    res.status(200).json({ message: 'Versión marcada como vigente' });
  } catch (error) {
    console.error('❌ Error al establecer como vigente:', error);
    res.status(500).json({ message: 'Error interno' });
  }
};

// ===================== LISTAR VERSIONES =====================
const getVersionesArchivo = async (req, res) => {
  const archivo_id = req.params.archivo_id;

  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, version, fecha_aprobacion, fecha_subida, url_archivo, vigente
       FROM versiones_archivo
       WHERE archivo_id = ?
       ORDER BY fecha_subida DESC`,
      [archivo_id]
    );

    const versiones = rows.map(v => {
      const fmt = (d) => (d ? new Date(d).toISOString().split('T')[0] : null);
      return {
        id: v.id,
        nombre: v.nombre || 'No aplica',
        version: v.version || 'No aplica',
        fecha_aprobacion: fmt(v.fecha_aprobacion) || 'No aplica',
        fecha_subida: fmt(v.fecha_subida) || 'No aplica',
        url_archivo: v.url_archivo || '#',
        vigente: !!v.vigente
      };
    });

    res.json(versiones);
  } catch (err) {
    console.error('❌ Error obteniendo versiones:', err);
    res.status(500).json({ message: 'Error obteniendo versiones' });
  }
};

// ===================== ELIMINAR ARCHIVO =====================
const eliminarArchivo = async (req, res) => {
  const { archivo_id } = req.params;
  const force = String(req.query.force).toLowerCase() === 'true';

  const conn = await pool.getConnection();
  try {
    const [[archivo]] = await conn.query('SELECT * FROM archivos WHERE id = ?', [archivo_id]);
    if (!archivo) {
      conn.release();
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    const [[{ total }]] = await conn.query(
      'SELECT COUNT(*) AS total FROM versiones_archivo WHERE archivo_id = ?',
      [archivo_id]
    );

    if (total > 0 && !force) {
      conn.release();
      return res.status(409).json({
        message: 'Borrar el archivo se eliminará junto con sus versiones.'
      });
    }

    const [versiones] = await conn.query(
      'SELECT url_archivo FROM versiones_archivo WHERE archivo_id = ?',
      [archivo_id]
    );

    await conn.beginTransaction();
    await conn.query('DELETE FROM versiones_archivo WHERE archivo_id = ?', [archivo_id]);
    await conn.query('DELETE FROM archivos WHERE id = ?', [archivo_id]);
    await conn.commit();
    conn.release();

    const borrarSiExiste = (relPath) => {
      if (!relPath) return;
      const filename = relPath.replace(/^\/+/, '');
      const full = path.join(__dirname, '..', filename);
      fs.unlink(full, () => {});
    };

    borrarSiExiste(archivo.url_archivo);
    versiones.forEach(v => borrarSiExiste(v.url_archivo));

    return res.json({ message: 'Archivo eliminado' });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    conn.release();
    console.error('❌ Error eliminando archivo:', err);
    return res.status(500).json({ message: 'Error al eliminar archivo' });
  }
};

// ===================== DESCARGAR ARCHIVO =====================
const descargarArchivo = async (req, res) => {
  try {
    const { archivo_id } = req.params;

    const [[row]] = await pool.query(
      'SELECT nombre, url_archivo FROM archivos WHERE id = ?',
      [archivo_id]
    );
    if (!row) return res.status(404).send('Archivo no encontrado en BD');

    const filename = row.url_archivo.split('/').pop();
    const filePath = path.join(UPLOADS_DIR, filename);

    console.log('[DESCARGAR]', { UPLOADS_DIR, url: row.url_archivo, filePath, exists: fs.existsSync(filePath) });

    if (!fs.existsSync(filePath)) return res.status(404).send('Archivo no encontrado');

    return res.download(filePath, row.nombre);
  } catch (err) {
    console.error('❌ Error al descargar:', err);
    return res.status(500).send('Error al descargar el archivo');
  }
};

// ===================== ELIMINAR VERSIÓN =====================
const eliminarVersion = async (req, res) => {
  const { version_id } = req.params;

  try {
    const [[v]] = await pool.query('SELECT * FROM versiones_archivo WHERE id = ?', [version_id]);
    if (!v) return res.status(404).json({ message: 'Versión no encontrada' });

    if (v.vigente) {
      return res.status(409).json({
        message: 'No puedes eliminar la versión vigente. Marca otra como vigente primero.'
      });
    }

    await pool.query('DELETE FROM versiones_archivo WHERE id = ?', [version_id]);

    if (v.url_archivo) {
      const filename = v.url_archivo.split('/').pop();
      const filePath = path.join(UPLOADS_DIR, filename);
      fs.unlink(filePath, () => {});
    }

    return res.json({ message: 'Versión eliminada' });
  } catch (err) {
    console.error('❌ Error eliminando versión:', err);
    return res.status(500).json({ message: 'Error eliminando versión' });
  }
};



// ===================== ASIGNADOS DEL CLIENTE-USUARIO =====================



const getBuscadorGlobal = async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        a.id,
        NULL AS archivo_id,
        a.nombre,
        COALESCE(NULLIF(TRIM(a.codigo), ''), 'no disponible') AS codigo,
        /* <- toma 1 si es NULL o '' */
        COALESCE(NULLIF(TRIM(a.version), ''), 1) AS version,
        /* normaliza fechas "0000-00-00" */
        NULLIF(a.fecha_aprobacion, '0000-00-00') AS fecha_aprobacion,
        NULLIF(a.fecha_subida,      '0000-00-00') AS fecha_subida,
        a.url_archivo,
        'archivo' AS tipo
      FROM archivos a

      UNION ALL

      SELECT
        v.id,
        v.archivo_id,
        v.nombre,
        COALESCE(NULLIF(TRIM(v.codigo), ''), 'no disponible') AS codigo,
        COALESCE(NULLIF(TRIM(v.version), ''), 1) AS version,
        NULLIF(v.fecha_aprobacion, '0000-00-00') AS fecha_aprobacion,
        NULLIF(v.fecha_subida,      '0000-00-00') AS fecha_subida,
        v.url_archivo,
        'version' AS tipo
      FROM versiones_archivo v

      ORDER BY fecha_subida DESC, id DESC
    `);

    const mapped = rows.map(r => ({
      id: r.id,
      archivo_id: r.archivo_id ?? null,
      nombre: r.nombre || 'Sin nombre',
      codigo: r.codigo || 'no disponible',
      // si por algo viniera null/'' otra vez, cae a '1'
      version: String((r.version ?? 1) || 1).padStart(2, '0'),
      fecha_aprobacion: r.fecha_aprobacion || null,
      fecha_subida: r.fecha_subida || null,
      url_archivo: r.url_archivo || '#',
      empresa: 'Blue Ops',
      tipo: r.tipo,
    }));

    res.json(mapped);
  } catch (err) {
    console.error('❌ getBuscadorGlobal:', err);
    res.status(500).json({ message: 'Error listando archivos para el buscador' });
  }
};

// helper: asigna archivo al usuario del trabajador
async function asignarArchivoATrabajador(pool, archivoId, trabajador) {
  // intenta con usuarios.usuario_id ya vinculado al trabajador
  let usuarioId = trabajador.usuario_id;
  if (!usuarioId) {
    const [[u]] = await pool.query(`SELECT id FROM usuarios WHERE trabajador_id = ? OR dni = ? LIMIT 1`, [trabajador.id, trabajador.dni]);
    if (!u) return; // si no hay usuario creado, puedes no asignar o crear el usuario
    usuarioId = u.id;
  }
  await pool.query(
    `INSERT IGNORE INTO asignaciones_archivos (archivo_id, usuario_id, fecha_asignacion)
     VALUES (?, ?, NOW())`,
    [archivoId, usuarioId]
  );
}

// === Subida desde MÓDULO MÉDICO ===
// form-data: file -> "archivo"; body: { subcarpetaId?, codigo?, version?, fecha_aprobacion? }
const subirArchivoMedico = async (req, res) => {
  try {
    const { trabajadorId } = req.params;
    const { subcarpetaId = null, codigo = null, version = 1, fecha_aprobacion = null } = req.body;

    if (!req.file) return res.status(400).json({ ok:false, msg:'Archivo requerido' });

    const { rootId, apartadoClienteId, trabajador } = await ensureRootCarpetaTrabajador(pool, trabajadorId);

    // Validar destino
    let carpetaId = null, subId = null;
    if (subcarpetaId) {
      const [[ok]] = await pool.query(
        `SELECT id FROM subcarpetas WHERE id=? AND carpeta_id=? LIMIT 1`,
        [subcarpetaId, rootId]
      );
      if (!ok) return res.status(400).json({ ok:false, msg:'subcarpetaId inválido' });
      subId = Number(subcarpetaId);
    } else {
      // subir directo a la raíz
      carpetaId = rootId;
      // Si la raíz tiene subcarpetas y quieres forzar elegir una, descomenta:
      // const [subs] = await pool.query('SELECT id FROM subcarpetas WHERE carpeta_id = ?', [rootId]);
      // if (subs.length) return res.status(400).json({ ok:false, msg:'Esta carpeta tiene subcarpetas, selecciona una' });
    }

    const nombre = toUtf8(req.file.originalname);
    const fecha_subida = new Date().toISOString().slice(0, 10);
    const url_archivo = `/uploads/${req.file.filename}`;

    const [ins] = await pool.query(
      `INSERT INTO archivos (nombre, codigo, version, fecha_aprobacion, fecha_subida, url_archivo, apartado_cliente_id, carpeta_id, subcarpeta_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, codigo, version, fecha_aprobacion || null, fecha_subida, url_archivo, apartadoClienteId, carpetaId, subId]
    );

    const archivoId = ins.insertId;

    // Asignación automática al trabajador
    await asignarArchivoATrabajador(pool, archivoId, trabajador);

    // cliente_id viene del trabajador (ensureRootCarpetaTrabajador te lo da en "trabajador")
await logMovimiento({
  tipo: 'MEDICO_ASSIGN',
  req,
  archivo_id: archivoId,
  trabajador_id: trabajador.id,
  cliente_id: trabajador.cliente_id,
  apartado_cliente_id: apartadoClienteId,
  carpeta_id: carpetaId || null,     // 👈 usar las variables correctas
  subcarpeta_id: subId || null 
});


    return res.status(201).json({ ok:true, archivoId, url: url_archivo });
  } catch (error) {
    console.error('❌ subirArchivoMedico:', error);
    res.status(500).json({ ok:false, msg:'Error al subir archivo' });
  }
};


module.exports = {
  subirArchivo,
  getArchivosPorCarpeta,
  subirNuevaVersion,
  establecerVersionVigente,
  getVersionesArchivo,
  eliminarArchivo,
  descargarArchivo,
  eliminarVersion,
  descargarVersion,
  getBuscadorGlobal,
    // 👇 nuevo
  subirArchivoMedico
  };

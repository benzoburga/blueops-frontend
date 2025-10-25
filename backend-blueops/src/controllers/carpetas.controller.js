//carpetas.controller.js
const { pool } = require('../config/db');

// 🟢 Crear nueva carpeta
const crearCarpeta = async (req, res) => {
  const { nombre, apartado_cliente_id, orden = 0 } = req.body;

  if (!nombre || !apartado_cliente_id) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO carpetas (nombre, apartado_cliente_id, orden) VALUES (?, ?, ?)",
      [nombre, apartado_cliente_id, orden]
    );

    res.status(201).json({
      id: result.insertId,
      nombre,
      apartado_cliente_id,
      orden
    });
  } catch (error) {
    console.error("❌ Error al crear carpeta:", error);
    res.status(500).json({ error: "Error al crear carpeta" });
  }
};


// 🟡 Actualizar orden
const actualizarOrdenCarpeta = async (req, res) => {
  const { id } = req.params;
  const { orden } = req.body;

  try {
    await pool.query('UPDATE carpetas SET orden = ? WHERE id = ?', [orden, id]);
    res.status(200).json({ message: 'Orden actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar orden de carpeta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
const actualizarNombreCarpeta = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  try {
    await pool.query('UPDATE carpetas SET nombre = ? WHERE id = ?', [nombre, id]);
    res.status(200).json({ message: 'Nombre de carpeta actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar nombre de carpeta:', error);
    res.status(500).json({ error: 'Error al actualizar nombre de carpeta' });
  }
};


// 🟢 Obtener carpetas ordenadas
const obtenerCarpetas = async (req, res) => {
  const { apartado_cliente_id } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM carpetas WHERE apartado_cliente_id = ? ORDER BY orden ASC',
      [apartado_cliente_id]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('❌ Error al obtener carpetas:', error);
    res.status(500).json({ error: 'Error interno al obtener carpetas' });
  }
};


const eliminarCarpeta = async (req, res) => {
  const { id } = req.params;
  const { force } = req.query;

  try {
    if (force === 'true') {
      // 🔥 1. Obtener TODAS las subcarpetas y sub-subcarpetas
      const [subcarpetas] = await pool.query('SELECT id FROM subcarpetas WHERE carpeta_id = ?', [id]);
      const subcarpetaIds = subcarpetas.map(s => s.id);

      let subSubIds = [];
      if (subcarpetaIds.length > 0) {
        const [subSubs] = await pool.query(
          'SELECT id FROM subcarpetas WHERE subcarpeta_padre_id IN (?)', [subcarpetaIds]
        );
        subSubIds = subSubs.map(s => s.id);
      }

      // 🔥 2. Eliminar archivos de sub-subcarpetas
      if (subSubIds.length > 0) {
        await pool.query('DELETE FROM archivos WHERE subcarpeta_id IN (?)', [subSubIds]);
      }

      // 🔥 3. Eliminar archivos de subcarpetas
      if (subcarpetaIds.length > 0) {
        await pool.query('DELETE FROM archivos WHERE subcarpeta_id IN (?)', [subcarpetaIds]);
      }

      // 🔥 4. Eliminar sub-subcarpetas
      if (subSubIds.length > 0) {
        await pool.query('DELETE FROM subcarpetas WHERE id IN (?)', [subSubIds]);
      }

      // 🔥 5. Eliminar subcarpetas
      if (subcarpetaIds.length > 0) {
        await pool.query('DELETE FROM subcarpetas WHERE id IN (?)', [subcarpetaIds]);
      }

      // 🔥 6. Eliminar archivos directos
      await pool.query('DELETE FROM archivos WHERE carpeta_id = ? AND subcarpeta_id IS NULL', [id]);

      // 🔥 7. Finalmente, eliminar la carpeta
      await pool.query('DELETE FROM carpetas WHERE id = ?', [id]);

      return res.status(200).json({ message: 'Carpeta eliminada forzadamente con éxito' });
    }

    // 🧠 Si no hay force=true, validar normalmente (como antes)
    const [archivosDirectos] = await pool.query(
      'SELECT id FROM archivos WHERE carpeta_id = ? AND subcarpeta_id IS NULL',
      [id]
    );
    if (archivosDirectos.length > 0) {
      return res.status(409).json({ message: 'La carpeta contiene archivos directos' });
    }

    const [subcarpetas] = await pool.query(
      'SELECT id FROM subcarpetas WHERE carpeta_id = ?', [id]
    );
    const subcarpetaIds = subcarpetas.map(s => s.id);

    if (subcarpetaIds.length > 0) {
      const [archivosEnSubcarpetas] = await pool.query(
        'SELECT id FROM archivos WHERE subcarpeta_id IN (?)', [subcarpetaIds]
      );
      if (archivosEnSubcarpetas.length > 0) {
        return res.status(409).json({ message: 'La carpeta contiene archivos en subcarpetas' });
      }

      const [subSubcarpetas] = await pool.query(
        'SELECT id FROM subcarpetas WHERE subcarpeta_padre_id IN (?)', [subcarpetaIds]
      );
      const subSubIds = subSubcarpetas.map(s => s.id);
      if (subSubIds.length > 0) {
        const [archivosEnSubSubs] = await pool.query(
          'SELECT id FROM archivos WHERE subcarpeta_id IN (?)', [subSubIds]
        );
        if (archivosEnSubSubs.length > 0) {
          return res.status(409).json({ message: 'Hay archivos en sub-subcarpetas' });
        }
      }

      // ❗ eliminar subcarpetas si están vacías
      if (subSubIds.length > 0) {
        await pool.query('DELETE FROM subcarpetas WHERE id IN (?)', [subSubIds]);
      }
      if (subcarpetaIds.length > 0) {
        await pool.query('DELETE FROM subcarpetas WHERE id IN (?)', [subcarpetaIds]);
      }
    }

    // 🧼 Si todo está limpio, borra carpeta
    await pool.query('DELETE FROM carpetas WHERE id = ?', [id]);
    res.status(200).json({ message: 'Carpeta eliminada correctamente' });

  } catch (error) {
    console.error('❌ Error al eliminar carpeta:', error);
    res.status(500).json({ error: 'Error interno al eliminar carpeta' });
  }
};


async function ensureRootCarpetaTrabajador(pool, trabajadorId) {
  // 1) trabajador + DNI (preferir usuarios.dni; fallback a trabajadores.numero_identificacion)
  const [[t]] = await pool.query(`
    SELECT 
      t.id,
      t.nombres,
      t.apellidos,
      t.cliente_id,
      COALESCE(u.dni, t.numero_identificacion) AS dni
    FROM trabajadores t
    LEFT JOIN usuarios u ON u.trabajador_id = t.id
    WHERE t.id = ?
    LIMIT 1
  `, [trabajadorId]);

  if (!t) throw new Error('Trabajador no encontrado');

  // 2) apartado EMO’s del cliente (tipo_apartado_id = 15)
  const [[ac]] = await pool.query(`
    SELECT ac.id
    FROM apartados_cliente ac
    WHERE ac.cliente_id = ? AND ac.tipo_apartado_id = 15
    LIMIT 1
  `, [t.cliente_id]);
  if (!ac) throw new Error('Apartado EMO’s no configurado para el cliente');

  // 3) nombre de la carpeta raíz: "Apellidos Nombres - DNI" (si hay DNI)
  const ap = (t.apellidos || '').trim();
  const no = (t.nombres || '').trim();
  const dni = (t.dni || '').toString().trim();
  const rootName = `${ap} ${no}${dni ? ' - ' + dni : ''}`.replace(/\s+/g, ' ').trim();

  // 4) buscar/crear raíz
  const [[exist]] = await pool.query(`
    SELECT id FROM carpetas
    WHERE apartado_cliente_id = ? AND nombre = ?
    LIMIT 1
  `, [ac.id, rootName]);

  let rootId = exist?.id;
  if (!rootId) {
    const [ins] = await pool.query(
      `INSERT INTO carpetas (nombre, apartado_cliente_id, orden) VALUES (?, ?, 0)`,
      [rootName, ac.id]
    );
    rootId = ins.insertId;
  }

  return { rootId, apartadoClienteId: ac.id, trabajador: t, rootName };
}

// === Endpoint: Médico obtiene/crea su raíz y la retorna ===
const medicoGetOrCreateRoot = async (req, res) => {
  try {
    const { trabajadorId } = req.params;
    const data = await ensureRootCarpetaTrabajador(pool, trabajadorId);
    return res.json({ ok: true, ...data });
  } catch (e) {
    console.error('❌ medicoGetOrCreateRoot:', e);
    return res.status(500).json({ ok:false, msg: e.message || 'Error obteniendo raíz' });
  }
};



// 👇 Esto debe ir al final
module.exports = {
  crearCarpeta,
  actualizarOrdenCarpeta,
  actualizarNombreCarpeta, 
  obtenerCarpetas,
  eliminarCarpeta,
    // 👇 nuevo
  medicoGetOrCreateRoot,
  ensureRootCarpetaTrabajador
};

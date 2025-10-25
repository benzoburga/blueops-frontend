//subcarpetas.controller.js
const { pool } = require('../config/db');

const { ensureRootCarpetaTrabajador } = require('./carpetas.controller');

const crearSubcarpetaMedico = async (req, res) => {
  try {
    const { trabajadorId } = req.params;
    const { nombre, parentSubcarpetaId = null } = req.body;

    if (!nombre) return res.status(400).json({ ok:false, msg:'nombre requerido' });

    const { rootId } = await ensureRootCarpetaTrabajador(pool, trabajadorId);

    // validar que el parent (si viene) pertenezca al mismo root
    if (parentSubcarpetaId) {
      const [[ok]] = await pool.query(
        `SELECT id FROM subcarpetas WHERE id=? AND carpeta_id=? LIMIT 1`,
        [parentSubcarpetaId, rootId]
      );
      if (!ok) return res.status(400).json({ ok:false, msg:'Parent inválido' });
    }

    const [ins] = await pool.query(
      `INSERT INTO subcarpetas (nombre, carpeta_id, orden, subcarpeta_padre_id)
       VALUES (?, ?, 0, ?)`,
      [nombre.trim(), rootId, parentSubcarpetaId || null]
    );

    res.status(201).json({ ok:true, subcarpetaId: ins.insertId });
  } catch (error) {
    console.error("❌ crearSubcarpetaMedico:", error);
    res.status(500).json({ ok:false, msg: 'Error al crear subcarpeta' });
  }
};
// Obtener subcarpetas por ID de carpeta
const obtenerSubcarpetas = async (req, res) => {
  const { carpetaId } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM subcarpetas WHERE carpeta_id = ? ORDER BY orden ASC',
      [carpetaId]
    );
    res.json(rows);
  } catch (error) {
    console.error('❌ Error al obtener subcarpetas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const actualizarNombreSubcarpeta = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  console.log('🔧 Renombrando subcarpeta: ', id, '→', nombre);

  if (!nombre) {
    return res.status(400).json({ error: 'Nombre requerido' });
  }

  try {
    const [result] = await pool.query('UPDATE subcarpetas SET nombre = ? WHERE id = ?', [nombre, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Subcarpeta no encontrada' });
    }
    res.status(200).json({ message: 'Nombre de subcarpeta actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar nombre de subcarpeta:', error);
    res.status(500).json({ error: 'Error al actualizar nombre de subcarpeta' });
  }
};



// Crear nueva subcarpeta
const crearSubcarpeta = async (req, res) => {
  const { nombre, carpeta_id, orden, subcarpeta_padre_id } = req.body;

  try {
    const [result] = await pool.query(
      'INSERT INTO subcarpetas (nombre, carpeta_id, orden, subcarpeta_padre_id) VALUES (?, ?, ?, ?)',
      [nombre, carpeta_id, orden, subcarpeta_padre_id ?? null] // ✅ Asegura que si es undefined, vaya como null
    );

    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error("❌ Error al crear subcarpeta:", error);
    res.status(500).json({ error: 'Error al crear subcarpeta' });
  }
};


// Actualizar orden de subcarpeta
const actualizarOrdenSubcarpeta = async (req, res) => {
  const { id } = req.params;
  const { orden } = req.body;

  try {
    await pool.query('UPDATE subcarpetas SET orden = ? WHERE id = ?', [orden, id]);
    res.status(200).json({ message: 'Orden de subcarpeta actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar orden de subcarpeta:', error);
    res.status(500).json({ error: 'Error al actualizar orden' });
  }
};

const getSubcarpetasRecursivas = async (req, res) => {
  const { carpetaId } = req.params;

  try {
    const buildTree = async (parentId = null, carpetaId) => {
      const [rows] = await pool.query(
        `SELECT * FROM subcarpetas WHERE carpeta_id = ? AND subcarpeta_padre_id ${parentId === null ? 'IS NULL' : '= ?'} ORDER BY orden`,
        parentId === null ? [carpetaId] : [carpetaId, parentId]
      );

      for (const row of rows) {
        // 🟢 Trae los archivos reales de esta subcarpeta
        const [files] = await pool.query(
          `SELECT * FROM archivos WHERE subcarpeta_id = ?`,
          [row.id]
        );

        row.files = files;
        row.subfolders = await buildTree(row.id, carpetaId);
      }

      return rows;
    };

    const tree = await buildTree(null, carpetaId);
    res.json(tree);
  } catch (err) {
    console.error("❌ Error obteniendo subcarpetas recursivas:", err);
    res.status(500).json({ error: "Error obteniendo subcarpetas" });
  }
};

const obtenerTodasLasSubcarpetas = async (subcarpetaId) => {
  let ids = [subcarpetaId];
  const [subSubs] = await pool.query(
    'SELECT id FROM subcarpetas WHERE subcarpeta_padre_id = ?',
    [subcarpetaId]
  );

  for (let sub of subSubs) {
    const descendientes = await obtenerTodasLasSubcarpetas(sub.id);
    ids = ids.concat(descendientes);
  }

  return ids;
};


const eliminarSubcarpeta = async (req, res) => {
  const { id } = req.params;
  const { force } = req.query;

  try {
    // 🔁 1. Obtener TODAS las subcarpetas descendientes
    const todasLasSubcarpetas = await obtenerTodasLasSubcarpetas(id);

    // ✅ 2. Verificar si hay archivos en cualquiera de esas subcarpetas
    const [archivos] = await pool.query(
      'SELECT id FROM archivos WHERE subcarpeta_id IN (?)',
      [todasLasSubcarpetas]
    );

    if (archivos.length > 0 && force !== 'true') {
      return res.status(409).json({ message: 'Hay archivos en esta o sus subcarpetas' });
    }

    // 🗑️ 3. Eliminar archivos si es forzado
    if (force === 'true') {
      await pool.query('DELETE FROM archivos WHERE subcarpeta_id IN (?)', [todasLasSubcarpetas]);
    }

    // 🧹 4. Eliminar subcarpetas en orden inverso (desde las más profundas)
    const ordenDesc = todasLasSubcarpetas.reverse();
    await pool.query('DELETE FROM subcarpetas WHERE id IN (?)', [ordenDesc]);

    res.status(200).json({ message: 'Subcarpeta eliminada correctamente' });

  } catch (error) {
    console.error("❌ Error al eliminar subcarpeta:", error);
    res.status(500).json({ error: 'Error interno al eliminar subcarpeta' });
  }
};




module.exports = {
  obtenerSubcarpetas,
  crearSubcarpeta,
  actualizarOrdenSubcarpeta,
  getSubcarpetasRecursivas,
  actualizarNombreSubcarpeta,
  obtenerTodasLasSubcarpetas,
  eliminarSubcarpeta,
   // 👇 nuevo
  crearSubcarpetaMedico
};

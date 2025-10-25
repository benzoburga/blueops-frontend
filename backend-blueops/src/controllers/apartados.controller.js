const { pool } = require('../config/db');

// Crear nuevo apartado para un cliente
const crearApartado = async (req, res) => {
  const { nombre, cliente_id } = req.body;

  try {
    // 1. Buscar si ya existe el tipo de apartado con ese nombre
    const [tipoRows] = await pool.query('SELECT id FROM tipos_apartado WHERE nombre = ?', [nombre]);

    let tipo_id;
    if (tipoRows.length > 0) {
      tipo_id = tipoRows[0].id;
    } else {
      // 2. Insertar nuevo tipo de apartado
      const [tipoResult] = await pool.query('INSERT INTO tipos_apartado (nombre) VALUES (?)', [nombre]);
      tipo_id = tipoResult.insertId;
    }

    // 3. Verificar si ya existe la relación cliente-apartado
    const [relRows] = await pool.query(
      'SELECT id FROM apartados_cliente WHERE cliente_id = ? AND tipo_apartado_id = ?',
      [cliente_id, tipo_id]
    );

    if (relRows.length > 0) {
      return res.status(409).json({ message: 'Este apartado ya está asignado a este cliente.' });
    }

    // 4. Insertar relación en apartados_cliente
    await pool.query('INSERT INTO apartados_cliente (cliente_id, tipo_apartado_id) VALUES (?, ?)', [cliente_id, tipo_id]);

    res.status(201).json({ message: 'Apartado creado correctamente.' });
  } catch (error) {
    console.error('❌ Error al crear apartado:', error);
    res.status(500).json({ error: 'Error al crear apartado' });
  }
};
const eliminarApartadoCliente = async (req, res) => {
  const { cliente_id, tipo_apartado_id } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM apartados_cliente WHERE cliente_id = ? AND tipo_apartado_id = ?',
      [cliente_id, tipo_apartado_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Relación no encontrada' });
    }

    res.status(200).json({ message: 'Apartado eliminado correctamente.' });
  } catch (error) {
    console.error('❌ Error al eliminar apartado del cliente:', error);
    res.status(500).json({ error: 'Error al eliminar apartado' });
  }
};

const getApartadosPorCliente = async (req, res) => {
  const clienteId = Number(req.params.cliente_id || req.user?.cliente_id);
  console.log('[APARTADOS] getApartadosPorCliente clienteId =', clienteId);

  if (!clienteId) return res.status(400).json({ msg: 'cliente_id requerido' });

  try {
    const [rows] = await pool.query(`
      SELECT 
        ac.id       AS id,
        ta.id       AS tipo_id,
        ta.nombre   AS nombre
      FROM apartados_cliente ac
      JOIN tipos_apartado ta ON ac.tipo_apartado_id = ta.id
      WHERE ac.cliente_id = ?
      ORDER BY ta.nombre
    `, [clienteId]);

    console.log('[APARTADOS] rows len =', rows.length);
    return res.json(rows);
  } catch (e) {
    console.error('❌ Error al obtener apartados:', e);
    return res.status(500).json({ message: 'Error al obtener los apartados del cliente' });
  }
};

const getMisApartados = async (req, res) => {
  try {
     console.log('[APARTADOS] ENTER getMisApartados');
    const clienteId = Number(req.user?.cliente_id || req.query.cliente_id || 0);
    console.log('[APARTADOS] /cliente-usuario -> clienteId =', clienteId, 'req.user =', req.user);

    if (!clienteId) {
      return res.status(401).json({ msg: 'Token sin cliente_id' });
    }

    const [rows] = await pool.query(`
      SELECT 
        ac.id     AS id,         -- id de la relación apartados_cliente
        ta.id     AS tipo_id,    -- id del tipo (para filtro)
        ta.nombre AS nombre
      FROM apartados_cliente ac
      JOIN tipos_apartado ta ON ac.tipo_apartado_id = ta.id
      WHERE ac.cliente_id = ?
      ORDER BY ta.nombre
    `, [clienteId]);

    console.log('[APARTADOS] /cliente-usuario rows len =', rows.length);
    return res.json(rows);
  } catch (error) {
    console.error('❌ getMisApartados error:', error);
    return res.status(500).json({ message: 'Error al obtener los apartados del cliente (cliente-usuario)' });
  }
};

module.exports = {
  crearApartado,
  eliminarApartadoCliente,
  getApartadosPorCliente,
  getMisApartados, // <-- exporta
};

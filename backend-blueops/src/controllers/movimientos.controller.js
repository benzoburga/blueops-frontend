const { pool } = require('../config/db');

const ROLE_LABEL = (r) => (r === 'MEDICO' ? 'Médico BlueOps' : 'Administrador BlueOps');

const listMovimientos = async (req, res) => {
  try {
    const search = (req.query.search || '').trim().toLowerCase();
    const tipo = req.query.tipo || null;         // 'PUBLISH' | 'ASSIGN' | 'VERSION_ADD' | 'MEDICO_ASSIGN'
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

    const [rows] = await pool.query(`
      SELECT
        m.id,
        m.tipo,
        m.actor_rol,
        m.numero_version,
        m.created_at,

        a.id                  AS a_id,
        a.nombre              AS a_nombre,
        a.apartado_cliente_id AS a_apartado_cliente_id,
        a.carpeta_id          AS a_carpeta_id,
        a.subcarpeta_id       AS a_subcarpeta_id,

        ta.nombre             AS apartado_nombre,     -- nombre del apartado
        c.nombre              AS carpeta_nombre,
        s.nombre              AS subcarpeta_nombre,

        /* <-- aquí el fix: usa el que exista */
        COALESCE( cli.nombre_comercial, '') AS cliente_nombre,

        t.id                  AS t_id,
        CONCAT_WS(' ', t.nombres, t.apellidos) AS trabajador_nombre
      FROM movimientos m
      LEFT JOIN archivos a            ON a.id = m.archivo_id
      LEFT JOIN apartados_cliente ac  ON ac.id = a.apartado_cliente_id
      LEFT JOIN tipos_apartado ta     ON ta.id = ac.tipo_apartado_id
      LEFT JOIN clientes cli          ON cli.id = COALESCE(m.cliente_id, ac.cliente_id)
      LEFT JOIN carpetas c            ON c.id = a.carpeta_id
      LEFT JOIN subcarpetas s         ON s.id = a.subcarpeta_id
      LEFT JOIN trabajadores t        ON t.id = m.trabajador_id
      WHERE (? IS NULL OR m.tipo = ?)
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT ? OFFSET ?
    `, [tipo, tipo, limit, offset]);

    const mapped = rows.map(r => {
      let folderName = r.apartado_nombre || r.carpeta_nombre || '';
      if (!r.apartado_nombre && r.carpeta_nombre && r.subcarpeta_nombre) {
        folderName = `${r.carpeta_nombre}/${r.subcarpeta_nombre}`;
      }

      const base = {
        id: r.id,
        timestamp: r.created_at,
        fileName: r.a_nombre || '',
        folderName,
        clientName: r.cliente_nombre || '',
        assigneeName: r.trabajador_nombre || '',
        version: r.numero_version || null,
        actor: ROLE_LABEL(r.actor_rol),
      };

      switch (r.tipo) {
        case 'PUBLISH':       return { ...base, type: 'PUBLISH' };
        case 'ASSIGN':        return { ...base, type: 'ASSIGN' };
        case 'VERSION_ADD':   return { ...base, type: 'VERSION_ADD' };
        case 'MEDICO_ASSIGN': return { ...base, type: 'MEDICO_ASSIGN' };
        default:              return { ...base, type: r.tipo };
      }
    });

    const filtered = search
      ? mapped.filter(m => JSON.stringify(m).toLowerCase().includes(search))
      : mapped;

    res.json(filtered);
  } catch (e) {
    console.error('listMovimientos:', e);
    res.status(500).json({ msg: 'Error listando movimientos' });
  }
};

module.exports = { listMovimientos };

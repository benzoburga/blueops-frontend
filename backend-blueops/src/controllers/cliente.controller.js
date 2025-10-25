// controllers/cliente.controller.js
const { pool } = require("../config/db");

// Listado para la tabla de clientes (usa los campos que muestras en TeacherList)
const obtenerClientes = async (_req, res) => {
  try {
    const [rows] = await pool.query(`
        SELECT
          c.id, c.ruc, c.nombre_comercial,
          COALESCE((
            SELECT rl.nombre
            FROM representantes_legales rl
            WHERE rl.cliente_id = c.id
            ORDER BY 
              CASE WHEN rl.vigente = 1 THEN 0 ELSE 1 END,
              rl.fecha_desde DESC, rl.id DESC
            LIMIT 1
          ), '') AS representante_nombre
        FROM clientes c
        WHERE c.activo = 1
        ORDER BY c.nombre_comercial;
      `);

          res.json(rows);
        } catch (error) {
          console.error("Error al obtener clientes:", error.message);
          res.status(500).json({ message: "Error al obtener los clientes" });
        }
      };


// Detalle por RUC (devuelve 1 solo registro como objeto)
const obtenerClientePorRUC = async (req, res) => {
  const { ruc } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT
        c.*,
        tc.nombre AS tipo_contribuyente_nombre_join,
        ec.nombre AS estado_contribuyente_nombre_join,
        cc.nombre AS condicion_contribuyente_nombre_join,
        sc.nombre AS sistema_contabilidad_nombre_join
      FROM clientes c
      LEFT JOIN tipos_contribuyente tc ON tc.id = c.tipo_contribuyente_id
      LEFT JOIN estados_contribuyente ec ON ec.id = c.estado_contribuyente_id
      LEFT JOIN condiciones_contribuyente cc ON cc.id = c.condicion_contribuyente_id
      LEFT JOIN sistemas_contabilidad sc ON sc.id = c.sistema_contabilidad_id
      WHERE c.ruc = ? LIMIT 1
    `, [ruc]);
    if (!rows.length) return res.status(404).json({ message: "Cliente no encontrado" });

    const cliente = rows[0];

    const [acts] = await pool.query(
      `SELECT id, ciiu_codigo, descripcion, es_principal, orden
       FROM cliente_actividades
       WHERE cliente_id = ?
       ORDER BY es_principal DESC, orden ASC, id ASC`,
      [cliente.id]
    );

    res.json({ ...cliente, actividades: acts });
  } catch (error) {
    console.error("Error al obtener cliente por RUC:", error.message);
    res.status(500).json({ message: "Error al obtener el cliente" });
  }
};

const crearCliente = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    // ⬇⬇⬇ incluye actividades con default []
    const { cliente, representantes = [], indicadores = [], actividades = [] } = req.body;

    if (
      !cliente?.ruc ||
      !cliente?.nombre_comercial ||
      !cliente?.tipo_contribuyente_id ||
      !cliente?.estado_contribuyente_id ||
      !cliente?.condicion_contribuyente_id
    ) {
      return res.status(400).json({ message: "Faltan campos obligatorios del cliente." });
    }

    await conn.beginTransaction();

    // 0) Nombres de catálogos (igual que ya lo tienes)
    const [[tipo]]   = await conn.query(`SELECT nombre FROM tipos_contribuyente WHERE id=?`, [cliente.tipo_contribuyente_id]);
    const [[estado]] = await conn.query(`SELECT nombre FROM estados_contribuyente WHERE id=?`, [cliente.estado_contribuyente_id]);
    const [[cond]]   = await conn.query(`SELECT nombre FROM condiciones_contribuyente WHERE id=?`, [cliente.condicion_contribuyente_id]);
    let sistNombre = null;
    if (cliente.sistema_contabilidad_id) {
      const [[sist]] = await conn.query(`SELECT nombre FROM sistemas_contabilidad WHERE id=?`, [cliente.sistema_contabilidad_id]);
      sistNombre = sist?.nombre ?? null;
    }

    // 👉 arma el texto legacy desde la actividad principal si vino el array
    let actividadPrincipalTexto = cliente.actividad_economica || null;
    if (Array.isArray(actividades) && actividades.length) {
      const principal = actividades.find(a => a?.es_principal) || actividades[0];
      const cod  = (principal?.ciiu_codigo || "").trim();
      const desc = (principal?.descripcion || "").trim();
      const etiqueta = [cod ? `Principal - ${cod}` : "Principal", desc]
        .filter(Boolean)
        .join(" - ");
      if (etiqueta) actividadPrincipalTexto = etiqueta;
    }


    // 1) Insert cliente (IDs + columnas legacy texto)
    const [insC] = await conn.query(
      `INSERT INTO clientes (
         ruc, nombre_comercial, domicilio_fiscal,
         fecha_inscripcion, fecha_inicio_actividades,
         actividad_economica,
         tipo_contribuyente, estado_contribuyente, condicion_contribuyente, sistema_contabilidad,
         tipo_contribuyente_id, estado_contribuyente_id, condicion_contribuyente_id, sistema_contabilidad_id,
         created_at, updated_at
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, NOW(), NOW())`,
      [
        cliente.ruc,
        cliente.nombre_comercial || null,
        cliente.domicilio_fiscal || null,
        cliente.fecha_inscripcion || null,
        cliente.fecha_inicio_actividades || null,
        actividadPrincipalTexto,                 // ⬅️ aquí
        tipo?.nombre ?? null,
        estado?.nombre ?? null,
        cond?.nombre ?? null,
        sistNombre,
        cliente.tipo_contribuyente_id,
        cliente.estado_contribuyente_id,
        cliente.condicion_contribuyente_id,
        cliente.sistema_contabilidad_id || null
      ]
    );
    const clienteId = insC.insertId;
    if (Array.isArray(actividades) && actividades.length) {
      // Garantiza 1 sola principal
      let foundPrincipal = false;
      const values = actividades.map((a, idx) => {
        const principal = a?.es_principal && !foundPrincipal;
        if (principal) foundPrincipal = true;
        return [
          clienteId,
          a?.ciiu_codigo || null,
          a?.descripcion || null,
          principal ? 1 : 0,
          Number(a?.orden ?? idx)
        ];
      });
      // Si nadie marcó principal, vuelve principal a la primera
      if (!foundPrincipal && values.length) {
        values[0][3] = 1;
      }

      await conn.query(
        `INSERT INTO cliente_actividades
         (cliente_id, ciiu_codigo, descripcion, es_principal, orden)
         VALUES ?`,
        [values]
      );
    }

    // 2) Representantes
    if (Array.isArray(representantes) && representantes.length) {
      const values = representantes.map(r => [
        clienteId,
        r.tipo_documento_id || null,
        r.numero_documento || null,
        r.nombre || null,
        r.cargo || null,
        r.fecha_desde || null,
        r.vigente ?? null
      ]);
      await conn.query(
        `INSERT INTO representantes_legales
         (cliente_id, tipo_documento_id, numero_documento, nombre, cargo, fecha_desde, vigente)
         VALUES ?`,
        [values]
      );
    }

    // 3) Indicadores
    if (Array.isArray(indicadores) && indicadores.length) {
      const values = indicadores.map(i => [
        clienteId,
        i.periodo, // 'YYYY-MM'
        Number(i.num_trabajadores) || 0,
        Number(i.num_pensionistas) || 0,
        Number(i.num_prestadores) || 0
      ]);
      await conn.query(
        `INSERT INTO indicadores_cliente
         (cliente_id, periodo, num_trabajadores, num_pensionistas, num_prestadores)
         VALUES ?`,
        [values]
      );
    }

    // 4) Apartados por defecto  ⬅️⬅️⬅️  (NUEVO)
    // Tomamos TODOS los tipos de apartado definidos y los creamos para el nuevo cliente.
    const [tiposApartados] = await conn.query(`SELECT id FROM tipos_apartado ORDER BY id ASC`);
    if (tiposApartados.length > 0) {
      const values = tiposApartados.map(t => [clienteId, t.id]);
      await conn.query(
        `INSERT INTO apartados_cliente (cliente_id, tipo_apartado_id) VALUES ?`,
        [values]
      );
    }

    await conn.commit();
    res.status(201).json({ message: "Cliente creado", cliente_id: clienteId });

  } catch (err) {
    await conn.rollback();
    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Duplicado (periodo o representante)." });
    }
    console.error("Error crearCliente:", err);
    res.status(500).json({ message: "Error al crear cliente" });
  } finally {
    conn.release();
  }
};


// NUEVO: archivar (soft-delete)
const archivarCliente = async (req, res) => {
  const { id } = req.params;
  const { user_id = null } = req.body || {};
  try {
    const [upd] = await pool.query(
      `UPDATE clientes
       SET activo=0, deleted_at=NOW(), deleted_by=?, updated_at=NOW()
       WHERE id=? AND activo=1`,
      [user_id, id]
    );
    if (!upd.affectedRows) return res.status(404).json({ message:'Cliente no encontrado o ya inactivo' });
    res.json({ message:'Cliente archivado (soft-delete)' });
  } catch (e) { console.error(e); res.status(500).json({ message:'Error al archivar' }); }
};

// NUEVO: restaurar
const restaurarCliente = async (req, res) => {
  const { id } = req.params;
  const { user_id = null } = req.body || {};
  try {
    const [upd] = await pool.query(
      `UPDATE clientes
       SET activo=1, deleted_at=NULL, deleted_by=NULL, updated_at=NOW()
       WHERE id=? AND activo=0`,
      [id]
    );
    if (!upd.affectedRows) return res.status(404).json({ message:'Cliente no encontrado o ya activo' });
    res.json({ message:'Cliente restaurado' });
  } catch (e) { console.error(e); res.status(500).json({ message:'Error al restaurar' }); }
};

module.exports = { obtenerClientes, obtenerClientePorRUC, crearCliente, archivarCliente, restaurarCliente };


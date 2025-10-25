// src/controllers/buscador.controller.js
const { pool } = require('../config/db');

const like = s => `%${s}%`;

const slugify = (s = '') =>
  String(s)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

exports.searchAdminEverything = async (req, res) => {
  try {
    const raw = String(req.query.query || req.query.q || '').trim();
    const page = Math.max(1, +req.query.page || 1);
    const pageSize = Math.min(Math.max(1, +req.query.pageSize || 200), 500);
    const offset = (page - 1) * pageSize;

    const WHERE_TXT = raw
      ? `
        AND (
          COALESCE(c.nombre_comercial,'') LIKE ?
          OR COALESCE(ta.nombre,'')       LIKE ?
          OR COALESCE(ca.nombre,'')       LIKE ?
          OR COALESCE(sc.nombre,'')       LIKE ?
          OR COALESCE(a.nombre,'')        LIKE ?
          OR COALESCE(a.codigo,'')        LIKE ?
        )
      `
      : '';
    const P = raw ? [like(raw), like(raw), like(raw), like(raw), like(raw), like(raw)] : [];

    // Unimos: CARPETAS, SUBCARPETAS y ARCHIVOS
    const sql = `
      SELECT * FROM (
        /* ===== CARPETAS ===== */
        SELECT
          ca.id                                   AS item_id,
          'carpeta'                               AS item_type,
          ca.nombre                               AS nombre,
          c.id                                    AS cliente_id,
          COALESCE(c.nombre_comercial,'')         AS cliente_nombre,
          ta.id                                   AS apartado_id,
          ta.nombre                               AS apartado_nombre,
          ca.id                                   AS carpeta_id,
          NULL                                    AS subcarpeta_id,
          NULL                                    AS archivo_id,
          NULL                                    AS version,
          NULL                                    AS url_archivo,
          CONCAT('Clientes/', COALESCE(c.nombre_comercial,''), '/', COALESCE(ta.nombre,''), '/', COALESCE(ca.nombre,'')) AS path_display,
          ca.nombre                               AS carpeta_nombre,
          NULL                                    AS subcarpeta_nombre
        FROM carpetas ca
        JOIN apartados_cliente ac ON ac.id = ca.apartado_cliente_id
        JOIN tipos_apartado ta    ON ta.id = ac.tipo_apartado_id
        LEFT JOIN clientes c      ON c.id = ac.cliente_id
        WHERE 1=1 ${WHERE_TXT}

        UNION ALL

        /* ===== SUBCARPETAS ===== */
        SELECT
          sc.id                                   AS item_id,
          'carpeta'                               AS item_type,
          sc.nombre                               AS nombre,
          c.id                                    AS cliente_id,
          COALESCE(c.nombre_comercial,'')         AS cliente_nombre,
          ta.id                                   AS apartado_id,
          ta.nombre                               AS apartado_nombre,
          ca.id                                   AS carpeta_id,
          sc.id                                   AS subcarpeta_id,
          NULL                                    AS archivo_id,
          NULL                                    AS version,
          NULL                                    AS url_archivo,
          CONCAT('Clientes/', COALESCE(c.nombre_comercial,''), '/', COALESCE(ta.nombre,''), '/', COALESCE(ca.nombre,''), '/', COALESCE(sc.nombre,'')) AS path_display,
          ca.nombre                               AS carpeta_nombre,
          sc.nombre                               AS subcarpeta_nombre
        FROM subcarpetas sc
        JOIN carpetas ca          ON ca.id = sc.carpeta_id
        JOIN apartados_cliente ac ON ac.id = ca.apartado_cliente_id
        JOIN tipos_apartado ta    ON ta.id = ac.tipo_apartado_id
        LEFT JOIN clientes c      ON c.id = ac.cliente_id
        WHERE 1=1 ${WHERE_TXT}

        UNION ALL

        /* ===== ARCHIVOS (versión vigente o última) ===== */
        SELECT
          a.id                                   AS item_id,
          'archivo'                              AS item_type,
          a.nombre                               AS nombre,
          c.id                                   AS cliente_id,
          COALESCE(c.nombre_comercial,'')        AS cliente_nombre,
          ta.id                                  AS apartado_id,
          ta.nombre                              AS apartado_nombre,
          COALESCE(a.carpeta_id, sc.carpeta_id)  AS carpeta_id,
          a.subcarpeta_id                        AS subcarpeta_id,
          a.id                                   AS archivo_id,
          (
            SELECT v.version
            FROM versiones_archivo v
            WHERE v.archivo_id = a.id
             ORDER BY v.vigente DESC, v.version DESC
            LIMIT 1
          )                                      AS version,
          (
            SELECT v.url_archivo
            FROM versiones_archivo v
            WHERE v.archivo_id = a.id
             ORDER BY v.vigente DESC, v.version DESC
            LIMIT 1
          )                                      AS url_archivo,
          CONCAT(
            'Clientes/', COALESCE(c.nombre_comercial,''), '/',
            COALESCE(ta.nombre,''), '/',
            COALESCE(ca.nombre,''),
            CASE WHEN sc.id IS NULL THEN '' ELSE CONCAT('/', sc.nombre) END,
            '/', COALESCE(a.nombre,'')
          )                                      AS path_display,
          ca.nombre                               AS carpeta_nombre,
          sc.nombre                               AS subcarpeta_nombre
        FROM archivos a
        JOIN apartados_cliente ac ON ac.id = a.apartado_cliente_id
        JOIN tipos_apartado ta    ON ta.id = ac.tipo_apartado_id
        LEFT JOIN clientes c      ON c.id = ac.cliente_id
        LEFT JOIN subcarpetas sc  ON sc.id = a.subcarpeta_id
        LEFT JOIN carpetas ca     ON ca.id = COALESCE(a.carpeta_id, sc.carpeta_id)
        WHERE 1=1 ${WHERE_TXT}
      ) X
      ORDER BY X.path_display
      LIMIT ? OFFSET ?;
    `;

    const params = [...P, ...P, ...P, pageSize, offset];
    const [rows] = await pool.query(sql, params);

    const items = rows.map(r => {
      const clienteSlug  = slugify(r.cliente_nombre || '');
      const apartadoSlug = slugify(r.apartado_nombre || '');

      // construir ?path=... de la carpeta/subcarpeta para abrir el árbol
      const pathParts = [];
      if (r.carpeta_nombre) pathParts.push(r.carpeta_nombre);
      if (r.subcarpeta_nombre) pathParts.push(r.subcarpeta_nombre);

      let target_url = apartadoSlug
        ? `/admin/archivos-cliente/${clienteSlug}/${apartadoSlug}`
        : `/admin/archivos-cliente/${clienteSlug}`;

      if (pathParts.length) {
        target_url += `?path=${encodeURIComponent(pathParts.join('/'))}`;
      }
      if (r.item_type === 'archivo' && r.archivo_id) {
        target_url += `${pathParts.length ? '&' : '?'}highlight=${r.archivo_id}`;
      }

      // tipo: 'carpeta' tanto para carpeta como para subcarpeta
      const tipo = r.item_type === 'carpeta' ? 'carpeta' : 'archivo';

      return {
        id: r.item_id,
        tipo,
        nombre: r.nombre,
        cliente_nombre: r.cliente_nombre,
        apartado_nombre: r.apartado_nombre,
        version: tipo === 'archivo' ? r.version : null,
        url_archivo: r.url_archivo || null,
        ruta: r.path_display,
        target_url,
        cliente_id: r.cliente_id,
        apartado_id: r.apartado_id,
        carpeta_id: r.carpeta_id,
        subcarpeta_id: r.subcarpeta_id,
        archivo_id: r.archivo_id
      };
    });

    return res.json(items);
  } catch (err) {
    console.error('[searchAdminEverything] ERROR:', {
      message: err?.message,
      sqlMessage: err?.sqlMessage,
      sqlState: err?.sqlState,
      code: err?.code,
      stack: err?.stack,
    });
    return res.status(500).json({
      error: 'Error buscando archivos (Admin)',
      detail: err?.sqlMessage || err?.message || String(err),
    });
  }
};


exports.searchEmosEverything = async (req, res) => {
  try {
    const raw = String(req.query.query || '').trim();
    const page = Math.max(1, +req.query.page || 1);
    const pageSize = Math.min(Math.max(1, +req.query.pageSize || 20), 200);
    const offset = (page - 1) * pageSize;

    const WHERE_TXT = `
      AND (
        COALESCE(c.nombre_comercial,'') LIKE ?
        OR COALESCE(ca.nombre,'')      LIKE ?
        OR COALESCE(sc.nombre,'')      LIKE ?
        OR COALESCE(a.nombre,'')       LIKE ?
        OR COALESCE(a.codigo,'')       LIKE ?
      )
    `;
    const P_TXT = [like(raw), like(raw), like(raw), like(raw), like(raw)];
    const TA_EMOS_ID = 15;

    const sql = `
      SELECT * FROM (
        SELECT
          ca.id               AS item_id,
          'carpeta'           AS item_type,
          ca.nombre           AS nombre,
          c.id                AS cliente_id,
          c.nombre_comercial  AS cliente_nombre,
          ca.id               AS carpeta_id,
          NULL                AS subcarpeta_id,
          NULL                AS archivo_id,
          CONCAT('Clientes/', COALESCE(c.nombre_comercial,''), '/', COALESCE(ca.nombre,'')) AS path_display
        FROM carpetas ca
        JOIN apartados_cliente ac ON ac.id = ca.apartado_cliente_id
        JOIN tipos_apartado ta    ON ta.id = ac.tipo_apartado_id AND ta.id = ?
        LEFT JOIN clientes c      ON c.id = ac.cliente_id
        LEFT JOIN subcarpetas sc  ON sc.carpeta_id = ca.id AND 1=0
        LEFT JOIN archivos a      ON a.carpeta_id  = ca.id AND 1=0
        WHERE 1=1 ${WHERE_TXT}

        UNION ALL

        SELECT
          sc.id               AS item_id,
          'carpeta'           AS item_type,
          sc.nombre           AS nombre,
          c.id                AS cliente_id,
          c.nombre_comercial  AS cliente_nombre,
          ca.id               AS carpeta_id,
          sc.id               AS subcarpeta_id,
          NULL                AS archivo_id,
          CONCAT('Clientes/', COALESCE(c.nombre_comercial,''), '/', COALESCE(ca.nombre,''), '/', COALESCE(sc.nombre,'')) AS path_display
        FROM subcarpetas sc
        JOIN carpetas ca         ON ca.id = sc.carpeta_id
        JOIN apartados_cliente ac ON ac.id = ca.apartado_cliente_id
        JOIN tipos_apartado ta    ON ta.id = ac.tipo_apartado_id AND ta.id = ?
        LEFT JOIN clientes c      ON c.id = ac.cliente_id
        LEFT JOIN archivos a      ON a.subcarpeta_id = sc.id AND 1=0
        WHERE 1=1 ${WHERE_TXT}

        UNION ALL

        SELECT
          a.id               AS item_id,
          'archivo'          AS item_type,
          a.nombre           AS nombre,
          c.id               AS cliente_id,
          c.nombre_comercial AS cliente_nombre,
          ca.id              AS carpeta_id,
          sc.id              AS subcarpeta_id,
          a.id               AS archivo_id,
          CONCAT(
            'Clientes/', COALESCE(c.nombre_comercial,''), '/',
            COALESCE(ca.nombre,''),
            CASE WHEN sc.id IS NULL THEN '' ELSE CONCAT('/', sc.nombre) END,
            '/', COALESCE(a.nombre,'')
          ) AS path_display
        FROM archivos a
        JOIN apartados_cliente ac ON ac.id = a.apartado_cliente_id
        JOIN tipos_apartado ta    ON ta.id = ac.tipo_apartado_id AND ta.id = ?
        LEFT JOIN clientes c      ON c.id = ac.cliente_id
        LEFT JOIN subcarpetas sc  ON sc.id = a.subcarpeta_id
        LEFT JOIN carpetas ca     ON ca.id = COALESCE(a.carpeta_id, sc.carpeta_id)
        WHERE 1=1 ${WHERE_TXT}
      ) AS X
      ORDER BY X.path_display
      LIMIT ? OFFSET ?;
    `;

    const params = [
      TA_EMOS_ID, ...P_TXT,
      TA_EMOS_ID, ...P_TXT,
      TA_EMOS_ID, ...P_TXT,
      pageSize, offset
    ];

    const [rows] = await pool.query(sql, params);

    // Conteo total (alineado y con COALESCE en el tercer join)
    const countSql = `
      SELECT SUM(n) AS total FROM (
        SELECT COUNT(*) AS n
        FROM carpetas ca
        JOIN apartados_cliente ac ON ac.id = ca.apartado_cliente_id
        JOIN tipos_apartado ta    ON ta.id = ac.tipo_apartado_id AND ta.id = ?
        LEFT JOIN clientes c      ON c.id = ac.cliente_id
        LEFT JOIN subcarpetas sc  ON sc.carpeta_id = ca.id AND 1=0
        LEFT JOIN archivos a      ON a.carpeta_id  = ca.id AND 1=0
        WHERE 1=1 ${WHERE_TXT}

        UNION ALL
        SELECT COUNT(*) AS n
        FROM subcarpetas sc
        JOIN carpetas ca         ON ca.id = sc.carpeta_id
        JOIN apartados_cliente ac ON ac.id = ca.apartado_cliente_id
        JOIN tipos_apartado ta    ON ta.id = ac.tipo_apartado_id AND ta.id = ?
        LEFT JOIN clientes c      ON c.id = ac.cliente_id
        LEFT JOIN archivos a      ON a.subcarpeta_id = sc.id AND 1=0
        WHERE 1=1 ${WHERE_TXT}

        UNION ALL
        SELECT COUNT(*) AS n
        FROM archivos a
        JOIN apartados_cliente ac ON ac.id = a.apartado_cliente_id
        JOIN tipos_apartado ta    ON ta.id = ac.tipo_apartado_id AND ta.id = ?
        LEFT JOIN clientes c      ON c.id = ac.cliente_id
        LEFT JOIN subcarpetas sc  ON sc.id = a.subcarpeta_id
        LEFT JOIN carpetas ca     ON ca.id = COALESCE(a.carpeta_id, sc.carpeta_id)
        WHERE 1=1 ${WHERE_TXT}
      ) T;
    `;
    const [[{ total = 0 }]] = await pool.query(countSql, [
      TA_EMOS_ID, ...P_TXT,
      TA_EMOS_ID, ...P_TXT,
      TA_EMOS_ID, ...P_TXT
    ]);

    const items = rows.map(r => {
      let target = `/medico/clientes/${r.cliente_id}/emos`;
      const qs = [];
      if (r.carpeta_id) qs.push(`open=${r.carpeta_id}`);
      if (r.subcarpeta_id) qs.push(`sub=${r.subcarpeta_id}`);
      if (r.item_type === 'archivo' && r.archivo_id) qs.push(`highlight=${r.archivo_id}`);
      if (qs.length) target += `?${qs.join('&')}`;
      return {
        id: r.item_id,
        tipo: r.item_type,
        nombre: r.nombre,
        cliente_id: r.cliente_id,
        cliente: r.cliente_nombre,
        carpeta_id: r.carpeta_id,
        subcarpeta_id: r.subcarpeta_id,
        archivo_id: r.archivo_id,
        path_display: r.path_display,
        target
      };
    });

    return res.json({ items, total, page, pageSize });
  } catch (err) {
    // LOG DETALLADO (verás esto en la consola del backend)
    console.error('[searchEmosEverything] ERROR:', {
      message: err?.message,
      sqlMessage: err?.sqlMessage,
      sqlState: err?.sqlState,
      code: err?.code,
      stack: err?.stack,
    });
    return res.status(500).json({
      error: 'Error buscando EMO’s',
      detail: err?.sqlMessage || err?.message || String(err),
    });
  }
};

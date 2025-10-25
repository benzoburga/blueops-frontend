// src/controllers/admin.buscador.controller.js
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

    const sql = `
      SELECT * FROM (
        /* ===== CARPETAS ===== */
        SELECT
          ca.id                                   AS item_id,
          'carpeta'                               AS item_type,
          ca.nombre                               AS nombre,
          c.id                                    AS cliente_id,
          COALESCE(c.nombre_comercial,'Sin cliente') AS cliente_nombre,
          ta.id                                   AS apartado_id,
          COALESCE(ta.nombre,'')                  AS apartado_nombre,
          ca.id                                   AS carpeta_id,
          NULL                                    AS subcarpeta_id,
          NULL                                    AS archivo_id,
          NULL                                    AS version,
          NULL                                    AS url_archivo,
          CONCAT(
            'Clientes/',
            COALESCE(c.nombre_comercial,'Sin cliente'),'/', 
            COALESCE(ta.nombre,''),'/',
            COALESCE(ca.nombre,'')
          )                                        AS ruta,
          ca.nombre                                AS carpeta_nombre,
          NULL                                     AS subcarpeta_nombre
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
          COALESCE(c.nombre_comercial,'Sin cliente') AS cliente_nombre,
          ta.id                                   AS apartado_id,
          COALESCE(ta.nombre,'')                  AS apartado_nombre,
          ca.id                                   AS carpeta_id,
          sc.id                                   AS subcarpeta_id,
          NULL                                    AS archivo_id,
          NULL                                    AS version,
          NULL                                    AS url_archivo,
          CONCAT(
            'Clientes/',
            COALESCE(c.nombre_comercial,'Sin cliente'),'/', 
            COALESCE(ta.nombre,''),'/',
            COALESCE(ca.nombre,''),'/',
            COALESCE(sc.nombre,'')
          )                                        AS ruta,
          ca.nombre                                AS carpeta_nombre,
          sc.nombre                                AS subcarpeta_nombre
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
          COALESCE(c.nombre_comercial,'Sin cliente') AS cliente_nombre,
          ta.id                                  AS apartado_id,
          COALESCE(ta.nombre,'')                 AS apartado_nombre,
          COALESCE(a.carpeta_id, sc.carpeta_id)  AS carpeta_id,
          a.subcarpeta_id                        AS subcarpeta_id,
          a.id                                   AS archivo_id,

          /*  👇 Fallback: versión de versiones_archivo -> a.version -> 1  */
          COALESCE(
            (SELECT v.version
            FROM versiones_archivo v
            WHERE v.archivo_id = a.id
            ORDER BY v.vigente DESC, v.version DESC
            LIMIT 1),
            NULLIF(TRIM(a.version), ''),
            1
          )                                      AS version,

          /*  👇 Fallback: url de versiones_archivo -> a.url_archivo  */
          COALESCE(
            (SELECT v.url_archivo
            FROM versiones_archivo v
            WHERE v.archivo_id = a.id
            ORDER BY v.vigente DESC, v.version DESC
            LIMIT 1),
            NULLIF(a.url_archivo, '')
          )                                      AS url_archivo,
          
          CONCAT(
            'Clientes/',
            COALESCE(c.nombre_comercial,'Sin cliente'),'/', 
            COALESCE(ta.nombre,''),'/',
            COALESCE(ca.nombre,''),
            CASE WHEN sc.id IS NULL THEN '' ELSE CONCAT('/', sc.nombre) END,
            '/', COALESCE(a.nombre,'')
          )                                      AS ruta,
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
      ORDER BY X.ruta
      LIMIT ? OFFSET ?;
    `;

    const params = [...P, ...P, ...P, pageSize, offset];
    const [rows] = await pool.query(sql, params);

    // ===== Fallback por si algo llega nulo: reconstrucción de ruta en Node
    const items = rows.map(r => {
      const cliente = r.cliente_nombre || 'Sin cliente';
      const apartado = r.apartado_nombre || '';
      const parts = ['Clientes', cliente];
      if (apartado) parts.push(apartado);
      if (r.carpeta_nombre) parts.push(r.carpeta_nombre);
      if (r.subcarpeta_nombre) parts.push(r.subcarpeta_nombre);
      if (r.item_type === 'archivo' && r.nombre) parts.push(r.nombre);

      const ruta = r.ruta || parts.filter(Boolean).join('/');

      const clienteSlug  = slugify(cliente);
      const apartadoSlug = slugify(apartado);

      let target_url = apartadoSlug
        ? `/admin/archivos-cliente/${clienteSlug}/${apartadoSlug}`
        : `/admin/archivos-cliente/${clienteSlug}`;

      const pathParts = [];
      if (r.carpeta_nombre) pathParts.push(r.carpeta_nombre);
      if (r.subcarpeta_nombre) pathParts.push(r.subcarpeta_nombre);
      if (pathParts.length) {
        target_url += `?path=${encodeURIComponent(pathParts.join('/'))}`;
      }
      if (r.item_type === 'archivo' && r.archivo_id) {
        target_url += `${pathParts.length ? '&' : '?'}highlight=${r.archivo_id}`;
      }

      const tipo = r.item_type === 'carpeta' ? 'carpeta' : 'archivo';

      return {
        id: r.item_id,
        tipo,
        nombre: r.nombre,
        cliente_nombre: cliente,
        apartado_nombre: apartado,
        version: r.item_type === 'archivo'
        ? String((r.version ?? 1) || 1).padStart(2, '0')
        : null,
        url_archivo: r.url_archivo || null,
        ruta,
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

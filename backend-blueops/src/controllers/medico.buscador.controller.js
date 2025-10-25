// src/controllers/medico.buscador.controller.js
const { pool } = require('../config/db');

// Detecta si existe una columna de DNI en 'trabajadores'
async function getDniColumnName() {
  // 👉 añadimos 'numero_identificacion'
  const candidates = [
    'numero_identificacion', 'documento', 'dni',
    'num_documento', 'numero_documento', 'cedula'
  ];
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME AS col
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'trabajadores'
       AND COLUMN_NAME IN (${candidates.map(() => '?').join(',')})`,
    candidates
  );
  return rows?.[0]?.col || null;
}

exports.resolveEmoTarget = async (req, res) => {
  const num = v => (v == null ? null : Number(v));
  try {
    let cliente_id     = num(req.query.cliente_id);
    let carpeta_id     = num(req.query.carpeta_id);
    let subcarpeta_id  = num(req.query.subcarpeta_id);
    const archivo_id   = num(req.query.archivo_id);

    // archivo -> subcarpeta/carpeta
    if (archivo_id) {
      const [[a]] = await pool.query(
        'SELECT id, subcarpeta_id, carpeta_id FROM archivos WHERE id=? LIMIT 1',
        [archivo_id]
      );
      if (!a) return res.json({ ok:false, reason:'archivo_not_found' });
      if (a.subcarpeta_id) subcarpeta_id = a.subcarpeta_id;
      if (a.carpeta_id)    carpeta_id    = a.carpeta_id;
    }

    // subcarpeta -> carpeta
    if (!carpeta_id && subcarpeta_id) {
      const [[sc]] = await pool.query(
        'SELECT id, carpeta_id FROM subcarpetas WHERE id=? LIMIT 1',
        [subcarpeta_id]
      );
      if (!sc) return res.json({ ok:false, reason:'subcarpeta_not_found' });
      carpeta_id = sc.carpeta_id;
    }

    if (!carpeta_id) return res.json({ ok:false, reason:'insufficient_params' });

    // carpeta -> apartado_cliente -> cliente
    const [[carpeta]] = await pool.query(
        'SELECT id, nombre, apartado_cliente_id FROM carpetas WHERE id=? LIMIT 1',
        [carpeta_id]
    );
    if (!carpeta) return res.json({ ok:false, reason:'carpeta_not_found' });

    const [[ac]] = await pool.query(
      'SELECT id, cliente_id FROM apartados_cliente WHERE id=? LIMIT 1',
      [carpeta.apartado_cliente_id]
    );
    if (!ac) return res.json({ ok:false, reason:'apartado_cliente_not_found' });

    cliente_id = cliente_id || ac.cliente_id;

    // ===== candidatos: trabajadores del cliente =====
    const dniCol = await getDniColumnName(); // ← ahora detecta 'numero_identificacion'
    let select = 'SELECT id, cliente_id, nombres, apellidos';
    if (dniCol) select += `, ${dniCol} AS dni`;
    select += ' FROM trabajadores WHERE cliente_id = ?';
    const [candidatos] = await pool.query(select, [cliente_id]);
    if (!candidatos?.length) {
      return res.json({ ok:false, reason:'no_trabajadores_for_cliente', cliente_id });
    }

    // ===== heurísticas =====
    const nombreCarpeta = String(carpeta.nombre || '').trim();

    // 1) por DNI si existe columna y hay dígitos en el nombre de la carpeta
    let elegido = null;
    if (dniCol) {
      const soloDigitos = nombreCarpeta.replace(/\D+/g, '');
      if (soloDigitos && soloDigitos.length >= 5) {
        elegido = candidatos.find(t => String(t.dni || '').trim() === soloDigitos) || null;
      }
    }

    // 2) por nombres/apellidos
    if (!elegido) {
      const lc = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
      const ref = lc(nombreCarpeta);

      const scored = candidatos
        .map(t => {
          const nom = lc(t.nombres);
          const ape = lc(t.apellidos);
          let score = 0;
          if (nom && ref.includes(nom)) score += 2;
          if (ape && ref.includes(ape)) score += 2;
          const combo1 = (ape && nom) ? `${ape} ${nom}` : '';
          const combo2 = (ape && nom) ? `${nom} ${ape}` : '';
          if (combo1 && ref.includes(combo1)) score += 3;
          if (combo2 && ref.includes(combo2)) score += 3;
          return { t, score };
        })
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score);

      if (scored.length === 1 || (scored[0] && scored[1] && scored[0].score > scored[1].score)) {
        elegido = scored[0].t;
      }
    }

    if (!elegido) {
      return res.json({
        ok:false,
        reason:'unable_to_infer_trabajador',
        cliente_id,
        carpeta_id,
        subcarpeta_id: subcarpeta_id || null,
      });
    }

    return res.json({
      ok:true,
      cliente_id,
      trabajador_id: elegido.id,
      carpeta_id,
      subcarpeta_id: subcarpeta_id || null,
      archivo_id: archivo_id || null,
    });

  } catch (e) {
    console.error('[resolveEmoTarget]', e);
    return res.status(500).json({ ok:false, error:'server_error' });
  }
};

//middlewares/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ msg: 'Token no enviado' });
    }
    const token = header.slice(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Si el token no trae cliente_id, lo buscamos por BD
    if (!decoded.cliente_id && decoded.id) {
      const [rows] = await pool.query(
        'SELECT cliente_id FROM usuarios WHERE id = ? LIMIT 1',
        [decoded.id]
      );
      decoded.cliente_id = rows?.[0]?.cliente_id ?? null;
    }

    req.user = decoded;
    return next();
  } catch (err) {
    console.error('auth error:', err.message);
    return res.status(401).json({ msg: 'Token inválido' });
  }
};

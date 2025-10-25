// src/utils/multerConfig.js
const multer = require('multer');
const path = require('path');
const { UPLOADS_DIR } = require('../config/path');

// helper para convertir latin1 → utf8
const toUtf8 = s => Buffer.from(s || '', 'latin1').toString('utf8');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    // convertimos bien el nombre original
    const base = path.basename(toUtf8(file.originalname), ext);

    // si quieres usar fecha para evitar colisiones:
    const safeName = `${base}-${Date.now()}${ext}`;

    cb(null, safeName);
  }
});

module.exports = multer({ storage });

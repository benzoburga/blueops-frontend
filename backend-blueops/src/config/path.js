// src/config/path.js
const path = require('path');
const fs = require('fs');

// Carpeta uploads en la RAÍZ del proyecto (donde corres `node src/index.js`)
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

module.exports = { UPLOADS_DIR };

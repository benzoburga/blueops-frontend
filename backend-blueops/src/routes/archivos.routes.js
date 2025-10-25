// backend-blueops/src/routes/archivos.routes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const {
  subirArchivo,
  getArchivosPorCarpeta,
  subirNuevaVersion,
  establecerVersionVigente,
  getVersionesArchivo,
  eliminarArchivo,
  descargarArchivo,
  eliminarVersion,
  descargarVersion,
  getBuscadorGlobal,
} = require('../controllers/archivos.controller');


const auth = require('../middlewares/auth');            // ✅ Faltaba
const upload = require('../utils/multerConfig');

const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads');

const { subirArchivoMedico } = require('../controllers/archivos.controller');



// ===================== Versiones =====================
router.get('/archivos/versiones/:version_id/descargar', descargarVersion);
router.delete('/archivos/versiones/:version_id', eliminarVersion);
router.put('/archivos/versiones/:version_id/vigente', establecerVersionVigente);

// ===================== Archivos =====================
router.post('/medico/trabajadores/:trabajadorId/archivos', upload.single('archivo'), subirArchivoMedico);
router.post('/archivos', upload.single('archivo'), subirArchivo);
router.get('/archivos/carpeta/:carpeta_id', getArchivosPorCarpeta);
router.get('/archivos/:archivo_id/descargar', descargarArchivo);
router.get('/archivos/:archivo_id/versiones', getVersionesArchivo);
router.post('/archivos/:archivo_id/version', upload.single('archivo'), subirNuevaVersion);
router.delete('/archivos/:archivo_id', eliminarArchivo);

// ===================== Descarga simple por nombre (opcional) =====================
router.get('/archivos/descargar/:nombreArchivo', (req, res) => {
  const nombreArchivo = req.params.nombreArchivo;
  const rutaArchivo = path.join(UPLOADS_DIR, nombreArchivo);

  console.log('Descargar ->', { rutaArchivo, existe: fs.existsSync(rutaArchivo) });

  if (!fs.existsSync(rutaArchivo)) {
    return res.status(404).send('Archivo no encontrado');
  }

  res.download(rutaArchivo, nombreArchivo, (err) => {
    if (err) {
      console.error('❌ Error al descargar:', err);
      if (!res.headersSent) res.status(500).send('Error al descargar el archivo');
    }
  });
});

router.get('/admin/buscador', getBuscadorGlobal);



module.exports = router;

// scripts/fix-urls.js
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), 'src');

const REPLACEMENTS = [
  // 1. Quitar http://localhost:3000,4000,5173 de rutas API o FILES
  { regex: /http:\/\/localhost:(3000|4000|5173)\/api/gi, replace: '/api' },
  { regex: /http:\/\/localhost:(3000|4000|5173)\/files/gi, replace: '/files' },

  // 2. Quitar ${API}/api -> /api
  { regex: /\$\{API\}\/api/gi, replace: '/api' },

  // 3. Eliminar definiciones de const API = import.meta.env...
  { regex: /const\s+API\s*=\s*import\.meta\.env\.VITE_API_BASE_URL\s*\|\|\s*['"]http:\/\/localhost:\d+['"];\s*/g, replace: '' },

  // 4. Quitar axios.defaults.baseURL = ...
  { regex: /axios\.defaults\.baseURL\s*=\s*.*?;\s*/g, replace: '' },

  // 5. Evitar doble /api en llamadas con instancia `api`
  { regex: /api\.(get|post|put|delete)\(['"]\/api\//g, replace: "api.$1('/" },

  { regex: /const\s+API\s*=\s*.*?;\s*/g, replace: '' },
];

function fixFile(filePath) {
  let text = fs.readFileSync(filePath, 'utf8');
  let original = text;

  for (const { regex, replace } of REPLACEMENTS) {
    text = text.replace(regex, replace);
  }

  if (text !== original) {
    fs.writeFileSync(filePath, text, 'utf8');
    console.log('✅ Arreglado:', filePath);
  }
}

function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(fullPath);
    else if (/\.(jsx?|tsx?|mjs)$/.test(entry.name)) fixFile(fullPath);
  }
}

console.log('🔍 Corrigiendo archivos en:', ROOT);
walkDir(ROOT);
console.log('✅ Limpieza terminada.');

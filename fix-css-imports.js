import fs from "fs";
import path from "path";

function walk(dir) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);

    if (fs.lstatSync(full).isDirectory()) walk(full);

    else if (full.endsWith(".jsx") || full.endsWith(".js")) {
      let content = fs.readFileSync(full, "utf8");

      // Convierte cualquier import a minúsculas
      content = content.replace(
        /import\s+['"]([^'"]+\.css)['"]/g,
        (match, cssPath) => match.replace(cssPath, cssPath.toLowerCase())
      );

      // Styles → styles
      content = content.replace(/Styles\//g, "styles/");

      fs.writeFileSync(full, content, "utf8");
    }
  }
}

walk("./src");
console.log("✔ Todos los imports CSS fueron normalizados a minúsculas");

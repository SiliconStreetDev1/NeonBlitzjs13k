import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

const zip = new AdmZip();
const distDir = './dist';
const outputFile = './neon-blitz.zip';

if (fs.existsSync(distDir)) {
  // Minify all JSON files in the dist folder before zipping to save space!
  const minifyJson = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        minifyJson(fullPath);
      } else if (fullPath.endsWith('.json')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        fs.writeFileSync(fullPath, JSON.stringify(JSON.parse(content)));
      }
    }
  };
  minifyJson(distDir);

  zip.addLocalFolder(distDir);
  zip.writeZip(outputFile);
  
  const stats = fs.statSync(outputFile);
  const kb = (stats.size / 1024).toFixed(2);
  console.log(`\n📦 Build complete! Zip size: ${stats.size} bytes (${kb} KB)`);
  if (stats.size > 13312) console.log(`⚠️ WARNING: Over the 13KB limit by ${(stats.size - 13312)} bytes!`);
  else console.log(`✅ SUCCESS: Under the 13KB limit!`);
} else {
  console.error("❌ dist folder not found. Run vite build first.");
}
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { Packer } from 'roadroller';

const zip = new AdmZip();
const distDir = './dist';
const outputFile = './neon-blitz.zip';

if (fs.existsSync(distDir)) {
  // Process all files: minify JSON and roadroll JS to save massive space!
  const processFiles = async (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        await processFiles(fullPath);
      } else if (fullPath.endsWith('.json')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        fs.writeFileSync(fullPath, JSON.stringify(JSON.parse(content)));
      } else if (fullPath.endsWith('.html')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        // Roadroller uses 'with()' which fails in Strict Mode. Strip type="module" from Vite's HTML output!
        content = content.replace(/\s*type=(["']?)module\1/gi, ' defer').replace(/\s*crossorigin(=["']?[^"']*["']?)?/gi, '');
        fs.writeFileSync(fullPath, content);
      } else if (fullPath.endsWith('.js')) {
        console.log(`🗜️ Roadrolling ${file}... (This may take a few seconds)`);
        const content = fs.readFileSync(fullPath, 'utf8');
        const packer = new Packer([{
            data: content,
            type: 'js',
            action: 'eval'
        }], { allowFreeVars: true }); // Helps align output for better ZIP compression
        await packer.optimize();
        const { firstLine, secondLine } = packer.makeDecoder();
        fs.writeFileSync(fullPath, firstLine + secondLine);
      }
    }
  };
  await processFiles(distDir);

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
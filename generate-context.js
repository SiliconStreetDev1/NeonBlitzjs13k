import fs from 'fs';
import path from 'path';

const outputFile = 'full_context.txt';
let outputContent = '';

function appendFileContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    outputContent += `\n\n--- ${filePath.replace(/\\/g, '/')} ---\n\n`;
    outputContent += content;
  } catch (err) {
    console.warn(`Could not read ${filePath}: ${err.message}`);
  }
}

function traverseDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Ignore node_modules, build outputs, and hidden folders
      if (file !== 'node_modules' && !file.startsWith('dist') && !file.startsWith('.')) {
        traverseDirectory(fullPath);
      }
    } else if (stat.isFile()) {
      // Capture all relevant source code and config files
      const isRelevantType = file.endsWith('.js') || 
                             file.endsWith('.json') || 
                             file.endsWith('.html') || 
                             file.endsWith('.css');
                             
      if (isRelevantType) {
        // Exclude the generator itself, the output file, and the massive package-lock.json
        if (file !== outputFile && file !== 'generate-context.js' && file !== 'package-lock.json') {
          appendFileContent(fullPath);
        }
      }
    }
  }
}

console.log('Gathering files for context...');
traverseDirectory('.');
fs.writeFileSync(outputFile, outputContent.trim(), 'utf8');
console.log(`✅ Successfully combined context into ${outputFile}`);
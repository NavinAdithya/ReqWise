const fs = require('fs');
const path = require('path');

const outputFileName = 'codebase_bundle.txt';
const sourceDirs = [
  { name: 'backend', path: path.join(__dirname, 'backend', 'src') },
  { name: 'frontend', path: path.join(__dirname, 'frontend', 'src') },
  { name: 'root-config', path: __dirname, filesOnly: ['package.json'] }
];

const extensions = ['.ts', '.tsx', '.js', '.json', '.css'];
const ignoredFiles = ['package-lock.json', 'tsconfig.json', 'tsconfig.node.json', 'tsconfig.app.json', 'vite.config.ts', 'jest.config.js'];

let outputContent = '';
let fileCount = 0;

function walk(dir, rootDirName) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== 'build' && file !== '.git') {
        walk(filePath, rootDirName);
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext) && !ignoredFiles.includes(file)) {
        const relativePath = path.relative(__dirname, filePath);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        outputContent += `\n=========================================\n`;
        outputContent += `FILE: ${relativePath}\n`;
        outputContent += `=========================================\n\n`;
        outputContent += fileContent;
        outputContent += `\n`;
        
        fileCount++;
      }
    }
  });
}

// Bundle standard source dirs
sourceDirs.forEach(source => {
  if (source.filesOnly) {
    source.filesOnly.forEach(file => {
      const filePath = path.join(source.path, file);
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        outputContent += `\n=========================================\n`;
        outputContent += `FILE: ${file}\n`;
        outputContent += `=========================================\n\n`;
        outputContent += fileContent;
        outputContent += `\n`;
        fileCount++;
      }
    });
  } else if (fs.existsSync(source.path)) {
    walk(source.path, source.name);
  }
});

fs.writeFileSync(path.join(__dirname, outputFileName), outputContent, 'utf8');
console.log(`Successfully bundled ${fileCount} source files into '${outputFileName}'!`);

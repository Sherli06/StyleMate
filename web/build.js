const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'src');
const outputDir = path.join(__dirname, 'build');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

for (const file of ['index.html', 'app.js', 'styles.css']) {
  const sourcePath = path.join(sourceDir, file);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Required web source is missing: ${sourcePath}`);
  }
  fs.copyFileSync(sourcePath, path.join(outputDir, file));
}

console.log('Web assets copied from web/src to web/build.');

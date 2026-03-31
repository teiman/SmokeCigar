const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const FILES = [
  'index.html',
  'css/style.css',
  'js/mdl-parser.js',
  'js/renderer.js',
  'js/app.js',
];

// Clean and recreate dist/
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true });
}

for (const file of FILES) {
  const src = path.join(ROOT, file);
  const dest = path.join(DIST, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`  ${file}`);
}

console.log(`\nDone. ${FILES.length} files copied to dist/`);

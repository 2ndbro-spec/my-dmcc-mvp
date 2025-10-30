// cleanup.js
import fs from 'fs';
import path from 'path';

const targets = [
  'crawler',
  'node_modules',
  'daily.pdf',
  'test.png',
  'test.pdf',
  'package-lock.json',
  '.env.local'
];

const extensions = ['.map', '.d.ts'];

function deleteIfExists(filePath) {
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { recursive: true, force: true });
    console.log(`🗑️ Deleted: ${filePath}`);
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) walk(filePath);
    else if (extensions.some(ext => file.endsWith(ext))) deleteIfExists(filePath);
  });
}

// 実行
targets.forEach(t => deleteIfExists(path.join(process.cwd(), t)));
walk(process.cwd());

console.log('\n✅ Cleanup completed. DMCC structure is now clean.');

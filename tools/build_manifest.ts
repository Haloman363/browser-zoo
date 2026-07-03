import * as fs from 'fs';
import * as path from 'path';
import { ArchiveManager } from './lib/archive';

const GAME_FILES_DIR = 'Gamefiles';
const OUT = path.join('data', 'manifest.json');

// classify by real file extension; files with no '.' in the basename are graphics frames
function classify(p: string): string {
  const base = p.split('/').pop() || p;
  const dot = base.lastIndexOf('.');
  if (dot <= 0) return '(graphics-frame)'; // ZT1 sprite frames are extensionless (e.g. .../SE/SE)
  return base.slice(dot + 1).toLowerCase();
}

function main() {
  const am = new ArchiveManager(GAME_FILES_DIR);
  const files = am.listFiles().sort();
  const byType: Record<string, number> = {};
  const byTopDir: Record<string, number> = {};
  for (const f of files) {
    const t = classify(f);
    byType[t] = (byType[t] || 0) + 1;
    const top = f.split('/')[0];
    byTopDir[top] = (byTopDir[top] || 0) + 1;
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ total: files.length, byType, byTopDir, files }, null, 2));
  console.log(`Manifest: ${files.length} files. Types:`, byType);
}

main();

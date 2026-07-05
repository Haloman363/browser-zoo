import * as fs from 'fs';
import * as path from 'path';
import { ArchiveManager } from './lib/archive';
import { parseIni, IniFile } from './lib/iniParser';

const GAME_FILES_DIR = 'Gamefiles';
const OUT_DIR = path.join('data', 'config');

function main() {
  const am = new ArchiveManager(GAME_FILES_DIR);
  const CONFIG_EXTS = ['.ai', '.uca', '.ani', '.cfg'];
  const configPaths = am.listFiles(f => CONFIG_EXTS.some(e => f.endsWith(e)));
  console.log(`Found ${configPaths.length} config files.`);

  const index: Record<string, IniFile> = {};
  let written = 0;

  for (const cfgPath of configPaths) {
    const data = am.getFile(cfgPath);
    if (!data) continue;
    let parsed: IniFile;
    try {
      parsed = parseIni(data.toString('utf8'));
    } catch (err) {
      console.warn(`  skip (parse error): ${cfgPath}`, err);
      continue;
    }
    index[cfgPath] = parsed;

    const outFile = path.join(OUT_DIR, `${cfgPath}.json`);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify(parsed, null, 2));
    written++;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 2));
  console.log(`Wrote ${written} config JSON files + index.json to ${OUT_DIR}`);
}

main();

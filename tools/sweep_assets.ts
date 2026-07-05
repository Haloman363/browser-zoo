import * as fs from 'fs';
import * as path from 'path';
import { ArchiveManager } from './lib/archive';
import { PaletteResolver } from './lib/palette';
import { Extractor } from './lib/extractor';

const OUT_ROOT = path.join('data', 'assets');
const REPORT = path.join('data', 'sweep-report.json');

// Verdicts from docs/re/archive-survey.md:
const CONFIG_EXTS = new Set(['ai', 'uca', 'ani', 'cfg', 'lyt']);   // already in data/config/
const COPY_EXTS = new Set(['wav', 'bmp', 'tga', 'txt', 'scn', 'zoo', 'ini', 'h', 'zip', 'ucs',
    'lle']);                                                        // .lle: undecoded terrain tiles → verbatim
const PAL_COPY_PREFIXES = ['ztatb/', 'ztats/', 'ztst/'];            // pals paired with undecoded .lle → keep

function extOf(p: string): string {
    const base = p.split('/').pop() || p;
    const dot = base.lastIndexOf('.');
    return dot <= 0 ? '' : base.slice(dot + 1).toLowerCase();
}

async function decodeGraphic(am: ArchiveManager, p: string, report: any): Promise<void> {
    const outDir = path.join(OUT_ROOT, p);
    const metaPath = path.join(outDir, 'meta.json');
    if (fs.existsSync(metaPath)) { report.skippedExisting++; return; }   // idempotent re-runs
    const buf = am.getFile(p);
    if (!buf) { report.failures.push({ path: p, error: 'unreadable' }); return; }
    const header = Extractor.readHeader(buf);
    if (!header) { report.unrecognized.push(p); return; }
    let palBuf = am.getFile(header.palName);
    if (!palBuf) {   // fallback: palette basename next to the graphic
        const sibling = path.posix.join(path.posix.dirname(p), header.palName.split(/[\\/]/).pop()!);
        palBuf = am.getFile(sibling);
    }
    if (!palBuf) { report.failures.push({ path: p, error: `palette not found: ${header.palName}` }); return; }
    const frames = Extractor.decode(buf, PaletteResolver.parse(palBuf));
    fs.mkdirSync(outDir, { recursive: true });
    const meta = {
        source: p, speed: header.speed, palette: header.palName,
        hasBackground: header.hasBackground,
        frames: frames.map((f, i) => ({ file: `${String(i).padStart(3, '0')}.png`, x: f.x, y: f.y, width: f.width, height: f.height })),
    };
    for (let i = 0; i < frames.length; i++) {
        await frames[i].image.writeAsync(path.join(outDir, meta.frames[i].file));
    }
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    report.decoded++;
}

function copyVerbatim(am: ArchiveManager, p: string, report: any): void {
    const out = path.join(OUT_ROOT, p);
    if (!fs.existsSync(out)) {
        const buf = am.getFile(p);
        if (!buf) { report.failures.push({ path: p, error: 'unreadable' }); return; }
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, buf);
    }
    report.copied++;
}

async function main() {
    const only = process.argv.find(a => a.startsWith('--only='))?.slice('--only='.length);
    const am = new ArchiveManager('Gamefiles');
    let files = am.listFiles();
    if (only) files = files.filter(f => f.startsWith(only));
    const report: any = {
        total: files.length, decoded: 0, copied: 0, skippedExisting: 0,
        skippedConfig: 0, skippedPal: 0, unrecognized: [], failures: [],
    };
    let i = 0;
    for (const p of files) {
        if (++i % 2000 === 0) console.log(`${i}/${files.length}  decoded=${report.decoded} copied=${report.copied}`);
        const ext = extOf(p);
        if (CONFIG_EXTS.has(ext)) { report.skippedConfig++; continue; }
        if (ext === 'pal') {
            if (PAL_COPY_PREFIXES.some(pre => p.startsWith(pre))) copyVerbatim(am, p, report);
            else report.skippedPal++;
            continue;
        }
        if (ext === '') { await decodeGraphic(am, p, report); continue; }
        if (COPY_EXTS.has(ext)) { copyVerbatim(am, p, report); continue; }
        report.unrecognized.push(p);   // extension not in any set — surface, don't silently drop
    }
    fs.mkdirSync(path.dirname(REPORT), { recursive: true });
    fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
    const accounted = report.decoded + report.copied + report.skippedExisting + report.skippedConfig
        + report.skippedPal + report.unrecognized.length + report.failures.length;
    console.log(`Done. accounted=${accounted}/${report.total} decoded=${report.decoded} copied=${report.copied}`
        + ` skippedPal=${report.skippedPal} failures=${report.failures.length} unrecognized=${report.unrecognized.length}`);
    // ponytail: sequential + Jimp (CPU-bound, expect a long full run); worker_threads only if rerun cadence ever matters
}

main();

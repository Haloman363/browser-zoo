# A3 Asset Sweep — Data Pack Extraction Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Track A's deferred A3: rip every asset category the manifest lists into the engine-agnostic `data/` Data Pack, and widen the config dump to the spec's full A1 scope (`.ani`/`.cfg`).

**Architecture:** One manifest-driven sweep tool classifies every archive file by extension: extensionless files are ZT1 sprite graphics whose *own header names their palette* (`palName` field), so they decode with zero path-guessing; standard formats (`.wav`, `.bmp`, `.tga`, …) copy verbatim; configs are already dumped to `data/config/`. Unknown trees (`ztatb/`, `ztats/`, `.lle`) get a survey first; the sweep includes or excludes them per the survey's verdict.

**Tech Stack:** TypeScript via `npx ts-node`, existing `tools/lib/` (ArchiveManager, PaletteResolver, Extractor, Jimp), `node:test` + `node:assert`. **No new dependencies.**

## Global Constraints

- `data/` and `docs/re/` are gitignored — never commit their contents. Curated docs may be force-added (`git add -f docs/re/<file>.md`), same precedent as `docs/re/config-schema.md`.
- Derived data stays local and undistributed (spec §Legal — derived from owned ZT1 files).
- `web/` is untouched — the Data Pack is a new tree; the engine's `web/public/assets/` curated subset stays as-is.
- Tests run: `node --test -r ts-node/register <file>` (NOT `npx ts-node --test` — ts-node's CLI rejects `--test`).
- Commit prefixes: `feat(tools):`, `docs(re):`, `docs:`.

## File Structure

- Modify: `tools/dump_configs.ts` (one filter line — widen to `.ani`/`.cfg`)
- Create: `docs/re/archive-survey.md` (survey verdicts for `ztatb/`/`ztats/`/`ztst/`, `.lle`/`.tga`/`.lyt`)
- Modify: `tools/lib/extractor.ts` (extract header parsing into `Extractor.readHeader`)
- Create: `tools/lib/extractor.test.ts` (header reader tests)
- Create: `tools/sweep_assets.ts` (the sweep; writes `data/assets/` + `data/sweep-report.json`)
- Modify: `.planning/STATE.md` (flip "A3 widening — next" to complete at the end)

## Reference: current ground truth (from `data/manifest.json`, 328,486 files)

| byType | count | sweep action |
|---|---|---|
| `(graphics-frame)` (extensionless) | 55,312 | decode → PNG frames + meta.json |
| `pal` | 128,121 | skip (consumed by decode) |
| `lle` | 128,176 | per Task 2 verdict |
| `ani`, `cfg`, `ai`, `uca` | 13,632 / 414 / 729 / 1 | skip (in `data/config/` after Task 1) |
| `wav` | 1,268 | copy verbatim (no OGG transcode — WAV plays in browsers; YAGNI) |
| `bmp`,`tga`,`txt`,`scn`,`zoo`,`lyt`,`ini`,`h`,`zip`,`ucs` | 63/112/408/122/14/110/1/1/1/1 | copy verbatim (already standard/openable formats) |

`byTopDir` hotspots: `animals` 54,338, `ztatb` 250,454 (≈ the pal+lle mass — surveyed in Task 2), `objects` 8,226, `fences` 3,134, `ztats` 2,924, `guests` 1,991, `ui` 1,872.

---

### Task 1: Widen config dump to `.ani` + `.cfg`

**Files:**
- Modify: `tools/dump_configs.ts:11`

**Interfaces:**
- Consumes: existing `parseIni` (full-fidelity, `tools/lib/iniParser.ts`) — handles any text, duplicate keys and bare lines preserved, so `.ani`/`.cfg` (both INI text in ZT1) need no parser change.
- Produces: `data/config/**/<path>.<ext>.json` for all four extensions + regenerated `index.json`. Task 4's sweep relies on exactly the set `{ai, uca, ani, cfg}` being dump-covered so it can skip them.

- [ ] **Step 1: Widen the filter**

Replace line 11:

```ts
  const configPaths = am.listFiles(f => f.endsWith('.ai') || f.endsWith('.uca'));
```

with:

```ts
  const CONFIG_EXTS = ['.ai', '.uca', '.ani', '.cfg'];
  const configPaths = am.listFiles(f => CONFIG_EXTS.some(e => f.endsWith(e)));
```

- [ ] **Step 2: Rerun the dump**

Run: `npx ts-node tools/dump_configs.ts`
Expected: completes without error; reported count ≈ 14,776 (729 `.ai` + 1 `.uca` + 13,632 `.ani` + 414 `.cfg`).

- [ ] **Step 3: Verify counts and spot-check both new types**

Run: `find data/config -name '*.json' | wc -l`
Expected: ≈ 14,777 (files + index.json).

Run: `find data/config -name '*.ani.json' | head -3` then view one with `head -40`.
Expected: JSON with real sections (e.g. `[animation]`-style keys), not empty.

Run: `head -40 data/config/economy.cfg.json` (root-level `.cfg` seen in manifest).
Expected: parsed sections with keys.

- [ ] **Step 4: Commit** (tool only — `data/` is gitignored)

```bash
git add tools/dump_configs.ts
git commit -m "feat(tools): widen config dump to .ani/.cfg (full A1 scope)"
```

---

### Task 2: Survey the unknowns — `ztatb/`, `ztats/`, `ztst/`, `.lle`, `.tga`, `.lyt`

**Files:**
- Create: `docs/re/archive-survey.md` (force-add)

**Interfaces:**
- Consumes: `data/manifest.json` (`files` array), `ArchiveManager.getFile(path): Buffer | null`.
- Produces: a **verdict table** consumed by Task 4: for each of `ztatb/`, `ztats/`, `ztst/` and type `.lle` → one of `decode` (sprite format), `copy` (opaque but wanted), `exclude` (not assets — with the reason). Task 4's `EXCLUDE_PREFIXES` / decode-set are filled from this table.

- [ ] **Step 1: Sample paths per unknown tree**

Run:

```bash
node -e "
const m=require('./data/manifest.json');
for (const p of ['ztatb/','ztats/','ztst/'])
  console.log(p, JSON.stringify(m.files.filter(f=>f.startsWith(p)).slice(0,8),null,1));
console.log('lle sample:', m.files.filter(f=>f.endsWith('.lle')).slice(0,5));
console.log('tga sample:', m.files.filter(f=>f.endsWith('.tga')).slice(0,5));
console.log('lyt sample:', m.files.filter(f=>f.endsWith('.lyt')).slice(0,5));
"
```

Expected: real path shapes (do the `.lle` files pair 1:1 with sibling `.pal`? does `ztatb` hold anything besides pal/lle?).

- [ ] **Step 2: Hexdump headers to test the sprite-format hypothesis**

`.lle` count (128,176) ≈ `.pal` count (128,121) — hypothesis: `.lle` is the same sprite frame format, just with an extension. Check whether the header matches (u32 speed, u32 palNameSize < 260, ASCII `*.pal` name):

```bash
npx ts-node -e "
import { ArchiveManager } from './tools/lib/archive';
const m = require('./data/manifest.json');
const am = new ArchiveManager('Gamefiles');
for (const p of m.files.filter((f:string)=>f.endsWith('.lle')).slice(0,3)) {
  const b = am.getFile(p)!;
  const magic = b.toString('utf8',0,4);
  const off = magic==='FATZ' ? 9 : 0;
  const palLen = b.readUInt32LE(off+4);
  console.log(p, 'magic:', JSON.stringify(magic), 'palLen:', palLen,
    'palName:', palLen>0&&palLen<260 ? JSON.stringify(b.subarray(off+8,off+8+palLen).toString('utf8')) : '(implausible)');
}
"
```

Expected: either plausible `.pal` names (→ verdict `decode`) or garbage (→ inspect further: `hexdump -C` style via `console.log(b.subarray(0,64))`, then verdict `copy` or `exclude` with reasoning).

Repeat the same probe for 2–3 extensionless files under `ztats/` and `ztst/` if Step 1 shows they hold graphics-shaped paths.

- [ ] **Step 3: Write the survey doc**

Create `docs/re/archive-survey.md`, following the honesty rules of `config-schema.md` (observed facts only, hypotheses labeled as such):

```markdown
# Archive Survey — unknown trees and types

**Date:** 2026-07-05 · **Source:** data/manifest.json (328,486 files) + header probes.

## Verdicts (consumed by tools/sweep_assets.ts)

| Tree / type | Contents (observed) | Verdict | Reason |
|---|---|---|---|
| `ztatb/` | <fill from Step 1–2> | <decode|copy|exclude> | <fill> |
| `ztats/` | <fill> | <fill> | <fill> |
| `ztst/`  | <fill> | <fill> | <fill> |
| `.lle`   | <fill> | <fill> | <fill> |
| `.tga` / `.lyt` | <fill> | copy | standard/opaque single files, verbatim copy is lossless |

## Probe transcripts

<paste the actual Step 1/2 outputs backing each verdict>
```

(The `<fill>` slots are data-driven by Steps 1–2 run at execution time — same pattern as the schema doc's survey-driven key table.)

- [ ] **Step 4: Commit (force-add — `docs/re/` is gitignored)**

```bash
git add -f docs/re/archive-survey.md
git commit -m "docs(re): survey ztatb/ztats/ztst trees and .lle/.tga/.lyt types"
```

---

### Task 3: `Extractor.readHeader` — expose the graphic header

**Files:**
- Modify: `tools/lib/extractor.ts`
- Create: `tools/lib/extractor.test.ts`

**Interfaces:**
- Consumes: nothing new (pure function over `Buffer`).
- Produces (Task 4 depends on these exact names):

```ts
export interface GraphicHeader {
    speed: number;
    palName: string;       // palette path as stored in the file (any case, may use backslashes)
    frameCount: number;
    hasBackground: boolean;
    dataOffset: number;    // offset of the first frame record
}
// Returns null when the buffer does not look like a ZT1 graphic
// (palNameSize out of (0,260), palName not ending in ".pal" case-insensitively,
//  or frameCount > 20000).
static readHeader(data: Buffer): GraphicHeader | null;
```

`Extractor.decode(data, palette)` keeps its exact current signature/behavior for valid sprites, but delegates header parsing to `readHeader` and returns `[]` on `null` (today it would read garbage).

- [ ] **Step 1: Write the failing tests**

Create `tools/lib/extractor.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { Extractor } from './extractor';

function header(palName: string, { fatz = false, bg = 0, speed = 100, frames = 0 } = {}): Buffer {
    const name = Buffer.from(palName + '\0', 'utf8');
    const body = Buffer.alloc(4 + 4 + name.length + 4);
    body.writeUInt32LE(speed, 0);
    body.writeUInt32LE(name.length, 4);
    name.copy(body, 8);
    body.writeUInt32LE(frames, 8 + name.length);
    if (!fatz) return body;
    const pre = Buffer.alloc(9);           // "FATZ" + 4 unknown + bg byte
    pre.write('FATZ', 0, 'utf8');
    pre.writeUInt8(bg, 8);
    return Buffer.concat([pre, body]);
}

test('reads a plain (non-FATZ) header', () => {
    const h = Extractor.readHeader(header('animals/asbear/asbear.pal'))!;
    assert.equal(h.speed, 100);
    assert.equal(h.palName, 'animals/asbear/asbear.pal');
    assert.equal(h.frameCount, 0);
    assert.equal(h.hasBackground, false);
});

test('reads a FATZ header with background flag', () => {
    const h = Extractor.readHeader(header('ui/x.pal', { fatz: true, bg: 1 }))!;
    assert.equal(h.hasBackground, true);
    assert.equal(h.palName, 'ui/x.pal');
});

test('strips trailing NULs from palName', () => {
    const h = Extractor.readHeader(header('a/b.pal'))!;
    assert.ok(!h.palName.includes('\0'));
});

test('rejects buffers that are not ZT1 graphics', () => {
    assert.equal(Extractor.readHeader(Buffer.from('this is a text file, not a sprite')), null);
    assert.equal(Extractor.readHeader(Buffer.alloc(4)), null);   // too short
});

test('dataOffset points at first frame record', () => {
    const buf = header('a/b.pal');
    const h = Extractor.readHeader(buf)!;
    assert.equal(h.dataOffset, buf.length);   // header-only buffer: offset === end
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test -r ts-node/register tools/lib/extractor.test.ts`
Expected: FAIL — `readHeader` is not a function.

- [ ] **Step 3: Implement `readHeader`, delegate `decode`**

In `tools/lib/extractor.ts`, add inside `Extractor` (above `decode`):

```ts
export interface GraphicHeader {
    speed: number;
    palName: string;
    frameCount: number;
    hasBackground: boolean;
    dataOffset: number;
}
```

```ts
    public static readHeader(data: Buffer): GraphicHeader | null {
        let offset = 0;
        let hasBackground = false;
        if (data.length < 12) return null;
        if (data.toString('utf8', 0, 4) === 'FATZ') {
            offset = 8;
            hasBackground = data.readUInt8(offset) !== 0;
            offset += 1;
        }
        if (offset + 12 > data.length) return null;
        const speed = data.readUInt32LE(offset); offset += 4;
        const palNameSize = data.readUInt32LE(offset); offset += 4;
        if (palNameSize <= 0 || palNameSize >= 260 || offset + palNameSize + 4 > data.length) return null;
        const palName = data.subarray(offset, offset + palNameSize).toString('utf8').replace(/\0/g, '');
        offset += palNameSize;
        if (!/\.pal$/i.test(palName)) return null;
        const frameCount = data.readUInt32LE(offset); offset += 4;
        if (frameCount > 20000) return null;
        return { speed, palName, frameCount, hasBackground, dataOffset: offset };
    }
```

Then replace the header-parsing block at the top of `decode` (the `let offset = 0;` through `const frameCount = ...` lines) with:

```ts
        const header = Extractor.readHeader(data);
        if (!header) return [];
        const { frameCount, hasBackground } = header;
        let offset = header.dataOffset;
```

(The rest of `decode` — `totalFrames`, the frame loop — is unchanged.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test -r ts-node/register tools/lib/extractor.test.ts && node --test -r ts-node/register tools/lib/iniParser.test.ts`
Expected: all PASS (extractor 5, iniParser 9).

- [ ] **Step 5: Regression-check decode against a real archive sprite**

Run:

```bash
npx ts-node -e "
import { ArchiveManager } from './tools/lib/archive';
import { PaletteResolver } from './tools/lib/palette';
import { Extractor } from './tools/lib/extractor';
const am = new ArchiveManager('Gamefiles');
const m = require('./data/manifest.json');
const p = m.files.find((f:string) => f.startsWith('animals/') && !f.split('/').pop()!.includes('.'));
const buf = am.getFile(p)!;
const h = Extractor.readHeader(buf)!;
console.log('graphic:', p, 'pal:', h.palName, 'frames:', h.frameCount);
const pal = PaletteResolver.parse(am.getFile(h.palName)!);
const frames = Extractor.decode(buf, pal);
console.log('decoded frames:', frames.length, 'first:', frames[0]?.width + 'x' + frames[0]?.height);
"
```

Expected: a real palette path resolved **via the header alone** (`am.getFile(h.palName)` works — ArchiveManager lowercases and normalizes `\`), frames decoded with nonzero dimensions.

- [ ] **Step 6: Commit**

```bash
git add tools/lib/extractor.ts tools/lib/extractor.test.ts
git commit -m "feat(tools): expose ZT1 graphic header reader in Extractor"
```

---

### Task 4: Manifest-driven sweep → `data/assets/` + report

**Files:**
- Create: `tools/sweep_assets.ts`
- Modify: `.planning/STATE.md` (final step)

**Interfaces:**
- Consumes: `ArchiveManager` (`listFiles`, `getFile` — normalizes case/slashes internally), `Extractor.readHeader/decode`, `PaletteResolver.parse`, `Frame.image: Jimp` (`writeAsync(path)`), Task 2's verdict table.
- Produces: `data/assets/<archive-path>/NNN.png` + `meta.json` per graphic, verbatim copies for standard formats, `data/sweep-report.json` coverage report. This IS the A3 deliverable.

- [ ] **Step 1: Write the sweep**

Create `tools/sweep_assets.ts`:

```ts
import * as fs from 'fs';
import * as path from 'path';
import { ArchiveManager } from './lib/archive';
import { PaletteResolver } from './lib/palette';
import { Extractor } from './lib/extractor';

const OUT_ROOT = path.join('data', 'assets');
const REPORT = path.join('data', 'sweep-report.json');

// Verdicts from docs/re/archive-survey.md (Task 2). Fill before running:
const EXCLUDE_PREFIXES: string[] = [/* e.g. 'ztatb/' if verdict=exclude */];
const DECODE_EXTS = new Set<string>([/* '' is always decoded; add 'lle' here if verdict=decode */]);

const CONFIG_EXTS = new Set(['ai', 'uca', 'ani', 'cfg']);          // already in data/config/
const COPY_EXTS = new Set(['wav', 'bmp', 'tga', 'txt', 'scn', 'zoo', 'lyt', 'ini', 'h', 'zip', 'ucs']);

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

async function main() {
    const only = process.argv.find(a => a.startsWith('--only='))?.slice('--only='.length);
    const am = new ArchiveManager('Gamefiles');
    let files = am.listFiles();
    if (only) files = files.filter(f => f.startsWith(only));
    const report: any = {
        total: files.length, decoded: 0, copied: 0, skippedExisting: 0,
        skippedConfig: 0, skippedPal: 0, excluded: 0, unrecognized: [], failures: [],
    };
    let i = 0;
    for (const p of files) {
        if (++i % 2000 === 0) console.log(`${i}/${files.length}  decoded=${report.decoded} copied=${report.copied}`);
        if (EXCLUDE_PREFIXES.some(pre => p.startsWith(pre))) { report.excluded++; continue; }
        const ext = extOf(p);
        if (CONFIG_EXTS.has(ext)) { report.skippedConfig++; continue; }
        if (ext === 'pal') { report.skippedPal++; continue; }
        if (ext === '' || DECODE_EXTS.has(ext)) { await decodeGraphic(am, p, report); continue; }
        if (COPY_EXTS.has(ext)) {
            const out = path.join(OUT_ROOT, p);
            if (!fs.existsSync(out)) {
                const buf = am.getFile(p);
                if (!buf) { report.failures.push({ path: p, error: 'unreadable' }); continue; }
                fs.mkdirSync(path.dirname(out), { recursive: true });
                fs.writeFileSync(out, buf);
            }
            report.copied++;
            continue;
        }
        report.unrecognized.push(p);   // extension not in any set — surface, don't silently drop
    }
    fs.mkdirSync(path.dirname(REPORT), { recursive: true });
    fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
    const accounted = report.decoded + report.copied + report.skippedExisting + report.skippedConfig
        + report.skippedPal + report.excluded + report.unrecognized.length + report.failures.length;
    console.log(`Done. accounted=${accounted}/${report.total} decoded=${report.decoded} copied=${report.copied}`
        + ` failures=${report.failures.length} unrecognized=${report.unrecognized.length}`);
    // ponytail: sequential + Jimp (CPU-bound, ~30-90 min full run); worker_threads only if rerun cadence ever matters
}

main();
```

Before running: fill `EXCLUDE_PREFIXES` / `DECODE_EXTS` from the Task 2 verdict table, with a one-line comment citing `docs/re/archive-survey.md` per entry.

- [ ] **Step 2: Spot-run one animal**

Run: `npx ts-node tools/sweep_assets.ts --only=animals/asbear`
Expected: completes in seconds; `accounted == total`; failures empty (or explainable).

- [ ] **Step 3: Verify spot output is real PNGs with sane meta**

Run:

```bash
find data/assets/animals/asbear -name '000.png' | head -3
file $(find data/assets/animals/asbear -name '000.png' | head -1)
head -20 $(find data/assets/animals/asbear -name 'meta.json' | head -1)
```

Expected: `PNG image data` with nonzero dimensions; meta.json lists source/palette/frames with plausible x/y/width/height.

- [ ] **Step 4: Commit the tool** (before the long run, so the run can't hold the commit hostage)

```bash
git add tools/sweep_assets.ts
git commit -m "feat(tools): manifest-driven asset sweep into data/ pack"
```

- [ ] **Step 5: Full run**

Run: `npx ts-node tools/sweep_assets.ts` (background it; CPU-bound, expect ~30–90 min for ~55k graphics).
Expected on completion: `accounted == total (328,486 minus any --only remnants)`, failures ≪ 1% and each explainable, `unrecognized` empty or fully explained by the survey doc.

- [ ] **Step 6: Verify coverage report against the manifest**

Run:

```bash
node -e "
const r=require('./data/sweep-report.json'), m=require('./data/manifest.json');
console.log('report total', r.total, 'manifest total', m.total);
console.log('decoded', r.decoded, 'copied', r.copied, 'failures', r.failures.length, 'unrecognized', r.unrecognized.length);
console.log('sample failures:', r.failures.slice(0,5));
"
```

Expected: totals match; decoded ≈ 55,312 (+ `.lle` mass if verdict was `decode`); every failure category small and explained. If a systematic failure appears (e.g. one palette convention missed), fix the sweep and re-run — `skippedExisting` makes re-runs cheap.

- [ ] **Step 7: Flip STATE.md and commit**

In `.planning/STATE.md`, replace the line:

```markdown
- **A3 widening — next**: extract PNGs/audio for every category the manifest lists (currently only animals are fully ripped).
```

with:

```markdown
- **A3 widening — complete** (2026-07-05): `tools/sweep_assets.ts` rips every manifest category into `data/assets/` (PNG frames + meta.json per graphic, verbatim standard formats); coverage report at `data/sweep-report.json`.
```

```bash
git add .planning/STATE.md
git commit -m "docs: STATE — A3 asset sweep complete"
```

---

## Self-Review

**Spec coverage:**
- A1 full scope (`.ai/.uca/.ani/.cfg`) → Task 1. ✓
- A3 "full sweep: animals, scenery, fences, UI, guests, staff, sounds, maps — nothing left behind" → Task 4 sweeps *every* manifest file into decode/copy/skip/exclude buckets with an accounted-vs-total check; "nothing left behind" is enforced by `unrecognized` surfacing anything unclassified. ✓
- Data Pack lands in `data/` (spec artifact #1), engine untouched. ✓
- Unknown trees don't get silently dropped or blindly ripped — Task 2 survey decides, doc records why. ✓
- OGG transcode from spec's "PNG/OGG" deliberately skipped (WAV is browser-playable; transcode adds an ffmpeg dep for zero information gain) — noted in Reference table. ✓

**Placeholder scan:** Task 2 Step 3's `<fill>` table and Task 4's `EXCLUDE_PREFIXES`/`DECODE_EXTS` are data-driven by the survey run at execution time (same precedent as Track A's schema-doc key table) — guarded by the explicit verdict-table interface, not left vague.

**Type consistency:** `GraphicHeader` fields (`speed/palName/frameCount/hasBackground/dataOffset`) match between Task 3's interface, its implementation, and Task 4's usage (`header.palName`, `header.speed`, `header.hasBackground`, `Extractor.decode` unchanged signature). `Frame.image: Jimp` + `writeAsync` per existing `extractor.ts`. ✓

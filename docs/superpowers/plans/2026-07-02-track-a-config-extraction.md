# Track A: Config-First Extraction — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rip *all* ZT1 config files (`.ai`/`.uca`) into full-fidelity JSON with nothing discarded, document what the keys mean, and produce a complete asset+config manifest — the foundation for faithful reimplementation.

**Architecture:** Reuse the existing `tools/lib/ArchiveManager` to enumerate `.ztd` contents. Add a full-fidelity INI parser that preserves duplicate keys (repeats → arrays) and bare-line sections, since ZT1 configs rely on both. Emit one JSON per config plus a merged index into a new gitignored `data/` tree. Then a schema doc derived from the real dumped data, and a manifest sweep of every asset/config file.

**Tech Stack:** TypeScript, ts-node, `adm-zip` (via existing `ArchiveManager`), `node:test` + `node:assert` (Node stdlib — no new dependency).

## Global Constraints

- `data/` and `re/` are derived from owned game files — MUST be gitignored, never committed. (Copied verbatim from spec "Legal".)
- Reuse `tools/lib/` (archive, palette, extractor) — do not reimplement archive access. (Spec Track A.)
- No field discarded: the parser preserves every section and every key, including duplicates. (Spec A1.)
- No new runtime/dev dependencies — tests use `node:test`, which ships with Node 22.

---

## File Structure

- `tools/lib/iniParser.ts` (new) — full-fidelity INI parser. One responsibility: bytes → structured object preserving duplicates + bare lines.
- `tools/lib/iniParser.test.ts` (new) — `node:test` unit tests for the parser.
- `tools/dump_configs.ts` (new) — CLI: walk all `.ztd`, parse every `.ai`/`.uca`, write per-file JSON + merged index to `data/config/`.
- `tools/build_manifest.ts` (new) — CLI: enumerate every file in the archives, classify by type, write `data/manifest.json`.
- `docs/re/config-schema.md` (new) — human doc of config keys, written from the actual dumped data.
- `.gitignore` (modify) — add `data/` and `re/`.

---

### Task 1: Full-fidelity INI parser

The existing `parseIni` in `master_extract_v2.ts` uses last-write-wins and drops
duplicate keys. Real ZT1 configs repeat keys deliberately (e.g. `staff/keeper.ai`
has multiple `cTrainingIconName`, `replace`, `pal`, `cDirt` lines) and have
sections of bare lines with no `=` (e.g. `[Member]` → `staff`, `zoo`, `aqua`).
This task builds a parser that loses nothing.

**Files:**
- Create: `tools/lib/iniParser.ts`
- Test: `tools/lib/iniParser.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // A section is a map of key -> one-or-many string values, plus any bare lines.
  export interface IniSection {
    keys: Record<string, string[]>;   // every key maps to an array (1+ values)
    bare: string[];                    // lines with no '=' (e.g. Member entries)
  }
  export interface IniFile {
    // section name "" holds top-level keys before any [section] header
    sections: Record<string, IniSection>;
  }
  export function parseIni(content: string): IniFile;
  ```

- [ ] **Step 1: Write the failing tests**

```ts
// tools/lib/iniParser.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseIni } from './iniParser';

test('collects duplicate keys into arrays', () => {
  const r = parseIni('[S]\nk = a\nk = b\n');
  assert.deepEqual(r.sections['S'].keys['k'], ['a', 'b']);
});

test('single key is still an array of one', () => {
  const r = parseIni('[S]\nk = a\n');
  assert.deepEqual(r.sections['S'].keys['k'], ['a']);
});

test('preserves bare lines (no equals) per section', () => {
  const r = parseIni('[Member]\nstaff\nzoo\naqua\n');
  assert.deepEqual(r.sections['Member'].bare, ['staff', 'zoo', 'aqua']);
});

test('trims whitespace around key and value', () => {
  const r = parseIni('[S]\n  cPurchaseCost   =   120  \n');
  assert.deepEqual(r.sections['S'].keys['cPurchaseCost'], ['120']);
});

test('skips comment and blank lines', () => {
  const r = parseIni('; a comment\n\n[S]\nk = v\n');
  assert.deepEqual(Object.keys(r.sections), ['S']);
  assert.deepEqual(r.sections['S'].keys['k'], ['v']);
});

test('keeps top-level keys before any section under ""', () => {
  const r = parseIni('top = 1\n[S]\nk = v\n');
  assert.deepEqual(r.sections[''].keys['top'], ['1']);
});

test('value may itself contain equals signs', () => {
  const r = parseIni('[S]\nIcon = objects/x/SE=SE\n');
  assert.deepEqual(r.sections['S'].keys['Icon'], ['objects/x/SE=SE']);
});

test('handles CRLF line endings', () => {
  const r = parseIni('[S]\r\nk = v\r\n');
  assert.deepEqual(r.sections['S'].keys['k'], ['v']);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx ts-node --test tools/lib/iniParser.test.ts`
Expected: FAIL — `Cannot find module './iniParser'`.

- [ ] **Step 3: Write the parser**

```ts
// tools/lib/iniParser.ts
export interface IniSection {
  keys: Record<string, string[]>;
  bare: string[];
}
export interface IniFile {
  sections: Record<string, IniSection>;
}

export function parseIni(content: string): IniFile {
  const file: IniFile = { sections: {} };
  let current = '';
  const ensure = (name: string): IniSection => {
    if (!file.sections[name]) file.sections[name] = { keys: {}, bare: [] };
    return file.sections[name];
  };
  // top-level section always exists so callers can read pre-header keys
  ensure('');

  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith(';') || line.startsWith('#')) continue;

    if (line.startsWith('[') && line.endsWith(']')) {
      current = line.slice(1, -1).trim();
      ensure(current);
      continue;
    }

    const section = ensure(current);
    const eq = line.indexOf('=');
    if (eq === -1) {
      section.bare.push(line);
    } else {
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim();
      (section.keys[key] ||= []).push(value);
    }
  }
  return file;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx ts-node --test tools/lib/iniParser.test.ts`
Expected: PASS — 8 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add tools/lib/iniParser.ts tools/lib/iniParser.test.ts
git commit -m "feat(tools): full-fidelity INI parser (preserves dup keys + bare lines)"
```

---

### Task 2: Gitignore the derived data trees

Small, standalone, and required before any tool writes to `data/`. Reviewer can
accept/reject independently of the dumpers.

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Verify current state**

Run: `grep -nE '^(data|re)/' .gitignore || echo "not present"`
Expected: `not present`.

- [ ] **Step 2: Append the ignore rules**

Add these two lines to the end of `.gitignore`:

```
# Derived from owned ZT1 game files — never distribute
data/
re/
```

- [ ] **Step 3: Verify**

Run: `grep -nE '^(data|re)/' .gitignore`
Expected: two matching lines printed.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore derived data/ and re/ trees"
```

---

### Task 3: Config dump CLI

Walk every `.ztd`, parse every `.ai`/`.uca` with the Task 1 parser, and write one
JSON per config file (mirroring its archive path) plus a merged `index.json`
mapping config path → parsed object. Nothing discarded.

**Files:**
- Create: `tools/dump_configs.ts`

**Interfaces:**
- Consumes: `ArchiveManager` from `tools/lib/archive` (`listFiles(filter?)`,
  `getFile(path): Buffer | null`); `parseIni` + `IniFile` from `tools/lib/iniParser`.
- Produces: files under `data/config/` — one `<archivePath>.json` per config, and
  `data/config/index.json` = `Record<string, IniFile>` keyed by lowercased archive
  path. Also prints a count summary.

- [ ] **Step 1: Write the dumper**

```ts
// tools/dump_configs.ts
import * as fs from 'fs';
import * as path from 'path';
import { ArchiveManager } from './lib/archive';
import { parseIni, IniFile } from './lib/iniParser';

const GAME_FILES_DIR = 'Gamefiles';
const OUT_DIR = path.join('data', 'config');

function main() {
  const am = new ArchiveManager(GAME_FILES_DIR);
  const configPaths = am.listFiles(f => f.endsWith('.ai') || f.endsWith('.uca'));
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
```

- [ ] **Step 2: Run it**

Run: `npx ts-node tools/dump_configs.ts`
Expected: prints `Found 729 config files.` (approx — count may differ with your
expansions installed) and `Wrote <n> config JSON files + index.json`.

- [ ] **Step 3: Spot-check a known file preserves duplicates**

Run:
```bash
npx ts-node -e "const j=require('./data/config/staff/keeper.ai.json'); console.log(JSON.stringify(j.sections['m/Characteristics/Strings'].keys.cTrainingIconName))"
```
Expected: an array with 2 entries (the two `cTrainingIconName` lines), e.g.
`["research/smktran1/smktran1","research/smktran2/smktran2"]`. This proves
duplicate keys survived — the whole point of Task 1.

- [ ] **Step 4: Spot-check a bare-line section survived**

Run:
```bash
npx ts-node -e "const j=require('./data/config/staff/keeper.ai.json'); console.log(JSON.stringify(j.sections['Member'].bare))"
```
Expected: `["staff","zoo","aqua"]`.

- [ ] **Step 5: Commit** (the tool only — `data/` is gitignored)

```bash
git add tools/dump_configs.ts
git commit -m "feat(tools): dump all .ai/.uca configs to full-fidelity JSON"
```

---

### Task 4: Config schema doc

Now that real data is dumped, document what the keys mean. This is game-rules
recovery — write it from the dumped JSON, not from memory. Grounded in the
verified examples already observed (`cPurchaseCost`, `cBathroomChange`,
`cHungerChange`, `cFootprintX/Y`, `cWorkCheck`, `cChaseCheck`, gender-prefixed
`[m/...]`/`[f/...]` sections, `[Member]` classification lines).

**Files:**
- Create: `docs/re/config-schema.md`

- [ ] **Step 1: Survey the real key space**

Run:
```bash
npx ts-node -e "
const idx=require('./data/config/index.json');
const keys=new Set();
for(const f of Object.values(idx)) for(const s of Object.values(f.sections)) for(const k of Object.keys(s.keys)) keys.add(k);
console.log([...keys].sort().join('\n'));
" | head -120
```
Expected: the full sorted list of every config key across all files. Use this as
the source of truth for what to document — do not invent keys.

- [ ] **Step 2: Write the doc**

Create `docs/re/config-schema.md` documenting, at minimum, the sections and keys
that appear across `.ai`/`.uca` files. Structure it as:

```markdown
# ZT1 Config Schema (.ai / .uca)

Derived from `data/config/` — full-fidelity dump of every config in the .ztd archives.
Keys are stored as arrays (duplicates preserved); most appear once.

## Sections
- `[Global]` — Class / Type / Subtype / DefaultSubtype (object taxonomy)
- `[Member]` — bare classification lines (e.g. `staff`, `zoo`, `aqua`) grouping objects into buy-menu categories
- `[Characteristics/Integers]` — numeric game rules (see key table)
- `[Characteristics/Strings]` — display names, image/plaque/icon asset paths
- `[m/...]` / `[f/...]` — gender-variant overrides (male/female staff & guests)
- `[cr_*]` — color-replacement palettes (recoloring rules)
- `[<subtype>/Icon]` — per-variant icon asset paths

## Key reference (Characteristics/Integers)
| Key | Meaning | Example | Confidence |
|-----|---------|---------|------------|
| cPurchaseCost | buy price in $ | 120 | high (observed) |
| cNameID / cHelpID | string-table IDs for name/help text | 8008 | high |
| cFootprintX / cFootprintY | tile footprint | 2 / 2 | high |
| cHungerChange | guest hunger delta when used | 0 | high |
| cThirstChange | guest thirst delta | 0 | high |
| cBathroomChange | guest bathroom-need delta | -100 | high |
| cEnergyChange | guest energy delta | 0 | high |
| cCommerce | is it a revenue object | 0/1 | med |
| cSelectable / cNeedsConfirm / cHideUser | UI behavior flags | 0/1 | med |
| ... | (fill from Step 1 survey — every key that recurs) | | |

## Staff-specific keys (staff/*.ai)
| Key | Meaning | Example |
|-----|---------|---------|
| cSlowRate / cMediumRate / cFastRate | move speeds | 33 / 44 / 66 |
| cWorkCheck / cChaseCheck | AI tick intervals | 5 / 2 |
| cFoodPerTile / cFoodUnitsSecond | keeper feeding rules | 1000 / 10 |
| cSicklyAnimalPct | % chance to detect sick animal | 15 |
| cWeaponRange | maint/security range | 5 |

## Open questions (→ Track B binary RE)
- Exact formula that consumes cHungerChange/cThirstChange/etc. per guest tick.
- How cSicklyAnimalPct / cWorkCheck feed keeper scheduling.
(Anything the config expresses as a value but not as an algorithm goes here.)
```

Fill the `...` rows from the Step 1 survey so every recurring key is covered.

- [ ] **Step 3: Verify no invented keys**

Run:
```bash
npx ts-node -e "
const idx=require('./data/config/index.json');
const real=new Set();
for(const f of Object.values(idx)) for(const s of Object.values(f.sections)) for(const k of Object.keys(s.keys)) real.add(k.toLowerCase());
const fs=require('fs'); const doc=fs.readFileSync('docs/re/config-schema.md','utf8');
const cited=[...doc.matchAll(/\bc[A-Z][A-Za-z]+/g)].map(m=>m[0].toLowerCase());
const bad=[...new Set(cited)].filter(k=>!real.has(k));
console.log(bad.length? 'INVENTED KEYS: '+bad.join(', ') : 'OK: all cited keys exist in dump');
"
```
Expected: `OK: all cited keys exist in dump`. If it lists invented keys, remove
them from the doc.

- [ ] **Step 4: Commit** (`docs/re/` is gitignored, so force-add this doc)

`docs/re/` is under the gitignored `re/`? No — `re/` at repo root is ignored, but
`docs/re/` is a different path and is NOT ignored. Confirm, then commit:

Run: `git check-ignore docs/re/config-schema.md || echo "not ignored, safe to commit"`
Expected: `not ignored, safe to commit`.

```bash
git add docs/re/config-schema.md
git commit -m "docs(re): ZT1 config schema recovered from full-fidelity dump"
```

---

### Task 5: Asset + config manifest

Enumerate every file across all archives, classify by type, and write a manifest.
This gives an inventory of what exists (and what's still unextracted) so the asset
completeness pass has a checklist.

**Files:**
- Create: `tools/build_manifest.ts`

**Interfaces:**
- Consumes: `ArchiveManager` (`listFiles()`).
- Produces: `data/manifest.json` = `{ total: number, byType: Record<string,number>, byTopDir: Record<string,number>, files: string[] }`.

- [ ] **Step 1: Write the manifest builder**

```ts
// tools/build_manifest.ts
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
```

- [ ] **Step 2: Run it**

Run: `npx ts-node tools/build_manifest.ts`
Expected: prints total file count (six figures — ~328k observed) and a `byType`
map showing real extensions (`ai`, `uca`, `pal`, `ani`, `cfg`, `scn`, `lyt`, `tga`,
`wav`, and `(graphics-frame)` for extensionless sprite frames).

- [ ] **Step 3: Sanity-check the manifest is valid JSON with expected keys**

Run:
```bash
npx ts-node -e "const m=require('./data/manifest.json'); console.log('total',m.total,'| ai',m.byType.ai,'| topdirs',Object.keys(m.byTopDir).join(','))"
```
Expected: `total` matches Step 2, `ai` ≈ 729, top dirs include `animals`, `objects`,
`scenery`, `staff`, `guests`, `ui`.

- [ ] **Step 4: Commit**

```bash
git add tools/build_manifest.ts
git commit -m "feat(tools): build asset+config manifest from archives"
```

---

## Self-Review

**Spec coverage:**
- A1 (complete config dump, no field discarded) → Task 1 (parser) + Task 3 (dump). ✓
- A2 (config schema doc) → Task 4. ✓
- A3 (asset completeness pass / manifest of what exists) → Task 5. ✓ Note: Task 5
  delivers the *inventory/manifest* half of A3. The actual widening of
  `master_extract_v2.ts` to rip every category's PNGs is deferred — the manifest is
  the checklist that scopes it, and per-category extraction is naturally its own
  follow-on plan once we see the manifest. Flagged here so it isn't forgotten.
- Legal (gitignore data/ + re/) → Task 2. ✓

**Placeholder scan:** The only intentional "fill from survey" is Task 4 Step 2's
key table, which is data-driven by Step 1's output and guarded by Step 3's
invented-key check — not a placeholder, a generated-from-real-data instruction.

**Type consistency:** `IniFile` / `IniSection` (Task 1) used identically in Task 3
and Task 4. `ArchiveManager.listFiles`/`getFile` signatures match the real class.

## Deferred to follow-on plans

- **A3 extraction widening:** extend `master_extract_v2.ts` (or a new sweep tool)
  to extract PNGs for every category the manifest lists, driven by
  `data/manifest.json`. Scoped once the manifest exists.
- **Track B (binary RE):** B1 Ghidra scaffold, B2 algorithm recovery, B3 port —
  prioritized by the "Open questions" section of `docs/re/config-schema.md`.

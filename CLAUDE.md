# browser-zoo

Web-based recreation of **Zoo Tycoon 1 (2001)** — Three.js isometric renderer, TypeScript, Vite.  
Requires original ZT1 `.ztd`/`.pal` files in `Gamefiles/` (not distributed).

## Status

**Milestone 1 complete.** All 6 phases shipped. Game is playable end-to-end.
`.zoo` map parser rewritten browser-native (commit `abbec4d`) — scenarios now render the real ZT1 maps.

**Now: decompilation program** (`docs/superpowers/specs/2026-07-02-zt1-decompilation-design.md`) — recover ground-truth game rules and feed them into `web/src/core/`.
- **Track A done** (2026-07-05): full-fidelity INI parser (`tools/lib/iniParser.ts`), config dump (`tools/dump_configs.ts`), schema doc (`docs/re/config-schema.md`), manifest (`tools/build_manifest.ts`). Derived output lands in `data/` + `docs/re/` (gitignored; schema doc force-added).
- **A3 done** (2026-07-06): full-corpus asset sweep. `tools/sweep_all.ts` runs `tools/sweep_assets.ts` as a subprocess-per-chunk pool (Jimp's PNG encode holds native memory only freed on process exit, so a single process OOMs the 328k-file corpus). Output in `data/assets/`: 55,311 graphics → 1.04M PNG frames + meta.json, 255k assets copied, 0 failures, coverage verified vs manifest. `.lle`/`ztatb`/`ztats`/`ztst` copied undecoded (terrain tiles — see `docs/re/archive-survey.md`).
- **B1 done** (2026-07-06): Ghidra 12.1.2 (in `~/.local/opt/`, JDK 21) auto-analyzed `Gamefiles/zoo.exe` → `re/zoo.gpr`; `tools/ghidra/NameFromStrings.java` naming pass renamed 323 fns + indexed all 7,316 to `re/functions.csv`. Rerun the pass: `analyzeHeadless re zoo -process zoo.exe -noanalysis -scriptPath tools/ghidra -postScript NameFromStrings.java re/functions.csv`.
- **Next**: Track B B2 — algorithm recovery from `zoo.exe`, scoped by the schema doc's open questions (satisfaction/happiness, guest AI, economy tick).

## Running the game

```bash
npm install
npx vite web          # http://localhost:5173
```

To extract assets first (needs your own ZT1 files in `Gamefiles/`):
```bash
npx ts-node tools/master_extract.ts
```

## Key directories

| Path | Purpose |
|---|---|
| `web/src/` | Main game source (TypeScript) |
| `web/src/core/` | Engine subsystems (AudioManager, TerrainManager, StaffManager, etc.) |
| `web/src/ui/` | HUD, MainMenu, StatusMeter |
| `web/src/utils/` | Validators, helpers |
| `tools/` | Asset extraction pipeline (`master_extract.ts`) |
| `Gamefiles/` | Your ZT1 `.ztd` / `.pal` files (gitignored) |
| `web/public/assets/` | Extracted PNG + JSON assets (gitignored) |
| `.planning/` | ROADMAP, STATE, REQUIREMENTS, per-phase docs |

## Architecture notes

- **Renderer**: Three.js `OrthographicCamera` with frustum-based isometric projection. Canvas is offset by HUD dimensions (`leftW`, `bottomH`) computed at runtime.
- **HUD scaling**: `HUD.scaleToViewport()` runs on `resize`. All button positions are stored as `data-orig*` attributes and scaled by `Math.min(vw/800, vh/600)`. StatusMeters expose `setScale()`. The renderer listens via `hud.onResize()`.
- **Audio**: `AudioManager` wraps Web Audio API. Context is suspended until a user gesture (`click`/`keydown`). Music plays after gesture; ambient plays when entering game.
- **Multiplayer**: PeerJS P2P — `NetworkManager`. Multiplayer submenu lives in `MainMenu.showMultiplayerSubmenu()`.
- **Persistence**: `PersistenceManager` — named save slots + autosave in `localStorage`.
- **Staff**: `KeeperInstance`, `MaintInstance`, `GuideInstance` — all extend `StaffInstance`. Each has a typed `.id` field.
- **`.zoo` maps** (`ZooMapParser.ts`): browser-native parser (no Node `Buffer`). Anchors the terrain window from the object list, then maps ZT1 terrain/fence/scenery/animal codes to extracted assets. TZFBF/TZFBG magics.
- **Sprites** (`utils/spriteLoader.ts`): BGR-corrected directional animations. Known gotcha — the HEAD-probe for frame existence gets false positives because Vite's dev-server SPA fallback returns 200 for missing files; the batch loader's fallback catches it and truncates animations to the real frame count, so it's warning noise not breakage.

## Roadmap / next ideas

- More scenarios and aquatic animals
- Save/load polish (UI for slot selection)
- Mobile/touch controls

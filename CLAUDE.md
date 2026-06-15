# browser-zoo

Web-based recreation of **Zoo Tycoon 1 (2001)** — Three.js isometric renderer, TypeScript, Vite.  
Requires original ZT1 `.ztd`/`.pal` files in `Gamefiles/` (not distributed).

## Status

**Milestone 1 complete.** All 6 phases shipped. Game is playable end-to-end.

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

## Roadmap / next ideas

- More scenarios and aquatic animals
- Save/load polish (UI for slot selection)
- Mobile/touch controls

# ROADMAP: browser-zoo

## Phase 1: Foundation & The "Master Extract" (Extraction Pipeline)
**Goal**: Create a production-ready tool to convert all Zoo Tycoon 1 assets into web-friendly formats.
- [ ] [PHASE-1-01] Consolidate `extract_zoo_graphics.ts` and `final_solve_v3.ts` into a unified `Extractor` class.
- [ ] [PHASE-1-02] Implement an `ArchiveManager` to handle `.ztd` file indexing and extraction.
- [ ] [PHASE-1-03] Build a `PaletteResolver` to automatically find and apply `.pal` files.
- [ ] [PHASE-1-04] Create a CLI script to batch-extract all animals, terrain, and UI elements into `web/public/assets/`.
- [ ] [PHASE-1-05] Create a minimal "Asset Viewer" in the web app to verify the extracted assets.
- [ ] **Success**: A folder full of PNGs and JSON metadata that the web app can use.

## Phase 2: Core Rendering & Isometric Map
**Goal**: Render a static zoo environment in the browser.
- [ ] [PHASE-2-01] Set up the React/Vite project structure in `web/`.
- [ ] [PHASE-2-02] Implement an `IsometricGrid` component for rendering terrain tiles.
- [ ] [PHASE-2-03] Create a `Sprite` component that can render extracted frames at specific coordinates.
- [ ] [PHASE-2-04] Implement basic camera controls (pan, zoom).
- [ ] **Success**: A scrollable isometric map with terrain and some static animal sprites.

## Phase 3: User Interface & Main Menu
**Goal**: Recreate the Zoo Tycoon UI and main menu.
- [x] [PHASE-3-01] Design and implement the Main Menu screen with interactive buttons and background.
- [ ] [PHASE-3-02] Create the primary in-game HUD (toolbars, stats bar, selection panels).
- [ ] [PHASE-3-03] Implement UI sound effects and custom mouse cursors.
- [ ] [PHASE-3-04] Integrate the UI with the core rendering engine.
- [ ] **Success**: A fully functional main menu and game HUD using original assets.

# ROADMAP: browser-zoo

## Phase 1: Foundation & The "Master Extract" (Extraction Pipeline)
**Goal**: Create a production-ready tool to convert all Zoo Tycoon 1 assets into web-friendly formats.
- [x] [PHASE-1-01] Consolidate `extract_zoo_graphics.ts` and `final_solve_v3.ts` into a unified `Extractor` class.
- [x] [PHASE-1-02] Implement an `ArchiveManager` to handle `.ztd` file indexing and extraction.
- [x] [PHASE-1-03] Build a `PaletteResolver` to automatically find and apply `.pal` files.
- [x] [PHASE-1-04] Create a CLI script to batch-extract all animals, terrain, and UI elements into `web/public/assets/`.
- [x] [PHASE-1-05] Create a minimal "Asset Viewer" in the web app to verify the extracted assets.
- [x] **Success**: A folder full of PNGs and JSON metadata that the web app can use.

## Phase 2: Core Rendering & Isometric Map
**Goal**: Render a static zoo environment in the browser.
- [x] [PHASE-2-01] Set up the project structure in `web/`.
- [x] [PHASE-2-02] Implement an `IsometricGrid` component for rendering terrain tiles.
- [x] [PHASE-2-03] Create a `Sprite` component that can render extracted frames at specific coordinates.
- [x] [PHASE-2-04] Implement basic camera controls (pan, zoom).
- [x] **Success**: A scrollable isometric map with terrain and some static animal sprites.

## Phase 3: User Interface & Main Menu
**Goal**: Recreate the Zoo Tycoon UI and main menu.
- [x] [PHASE-3-01] Design and implement the Main Menu screen with interactive buttons and background.
- [x] [PHASE-3-02] Create the primary in-game HUD (toolbars, stats bar, selection panels).
- [x] [PHASE-3-03] Implement UI sound effects and custom mouse cursors.
- [x] [PHASE-3-04] Integrate the UI with the core rendering engine.
- [x] **Success**: A fully functional main menu and game HUD using original assets.

## Phase 4: Scenarios & Advanced AI
**Goal**: Implement scenario mechanics and more lifelike guest behaviors.
- [x] [PHASE-4-01] Implement Scenario Goal tracking and win/loss conditions.
- [x] [PHASE-4-02] Enhance Guest AI with needs (hunger, thirst) and building-seeking logic.
- [x] [PHASE-4-03] Implement .zoo map file parsing to load original scenario maps.
- [x] [PHASE-4-04] Add animal needs (hunger, exhaustion) and keeper maintenance tasks.
- [x] **Success**: Playable tutorial scenarios with winning conditions and complex guest behaviors.

## Phase 5: Financials & Staff Management
**Goal**: Implement daily running costs, staff salaries, and additional staff types.
- [x] [PHASE-5-01] Implement detailed Economy logic: Daily/Monthly running costs and staff salaries.
- [x] [PHASE-5-02] Add new staff types: Maintenance Workers (trash/repairs) and Tour Guides.
- [x] [PHASE-5-03] Implement Financial Panel to track income/expenses over time.
- [x] [PHASE-5-04] Add Pricing controls for zoo admission and building items.
- [x] **Success**: A balanced simulation where players must manage cash flow and staff efficiently.

## Phase 6: Audio, Polish & Performance
**Goal**: Final refinements, immersive audio, and performance optimization.
- [x] [PHASE-6-01] Implement spatialized animal sounds and persistent zoo ambiance loop.
- [x] [PHASE-6-02] Add visual polish: Shadows, weather systems, and improved Z-sorting.
- [x] [PHASE-6-03] Performance optimization for large zoos.
- [x] **Success**: A polished, immersive, and high-performance Zoo Tycoon experience in the browser.

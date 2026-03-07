# GEMINI.md - browser-zoo

## Project Overview
`browser-zoo` is a modern, web-based recreation of the classic "Zoo Tycoon 1" (2001). The project consists of two primary components:
1.  **Asset Extraction Pipeline (`tools/`)**: A suite of TypeScript scripts designed to reverse-engineer and decode proprietary Zoo Tycoon asset formats (including `.ztd` archives, `.pal` palettes, and custom sprite formats like FATZ/ZATF using Skip-Draw RLE).
2.  **Web-Based Game Engine (`web/`)**: A frontend application built with Three.js (and planned React integration) that renders an isometric zoo environment, handles animal animations, and implements core gameplay logic.

The ultimate goal is to provide a playable, moddable, and high-performance version of Zoo Tycoon 1 that runs directly in any modern web browser.

## Tech Stack
- **Language**: TypeScript (throughout)
- **Frontend**: [Three.js](https://threejs.org/), [Vite](https://vitejs.dev/)
- **Asset Extraction**: Node.js, [adm-zip](https://www.npmjs.com/package/adm-zip) (ZIP handling), [Jimp](https://www.npmjs.com/package/jimp) (Image processing)
- **Project Planning**: Structured documentation in `.planning/` (`PROJECT.md`, `ROADMAP.md`, `STATE.md`, `REQUIREMENTS.md`)

## Project Structure
- `.planning/`: Detailed project goals, requirements, roadmap, and current state.
- `tools/`: A large collection of scripts for reverse-engineering and extracting game assets.
    - `master_extract.ts`: The primary (evolving) script for batch-extracting assets.
    - `lib/`: Shared utilities for archive and palette handling.
- `web/`: The frontend application.
    - `src/main.ts`: Entry point for the Three.js renderer.
    - `src/zoo/`: Game logic (AnimalManager, etc.).
    - `public/assets/`: Destination for extracted PNGs and JSON metadata.
- `Gamefiles/`: (Required) Original Zoo Tycoon `.ztd` and `.pal` files for extraction.
- `External Tools/`: Reference tools like APE (Animal Property Editor).
- `Extras/`: Additional game content (animals, themes).

## Building and Running

### Asset Extraction
Before running the web app, you must extract the game assets.
- **Extract specific assets**: `npx ts-node tools/<script_name>.ts`
- **Batch extraction (WIP)**: `npx ts-node tools/master_extract.ts`
- *Note: Ensure the required `.ztd` files are present in `Gamefiles/`.*

### Web Development
- **Start Dev Server**: `npx vite web` (Runs the Vite server targeting the `web/` directory)
- **Build for Production**: `npx vite build web`

### Testing
- **Run Tests**: `npm test` (Currently a placeholder)

## Development Conventions
- **Surgical Updates**: When modifying extraction tools, maintain compatibility with the established decoding logic found in `tools/lib/`.
- **Isometric Standards**: The game uses an isometric perspective. Assets are typically rendered with an orthographic camera.
- **Asset Metadata**: Extracted assets should be accompanied by JSON metadata describing animations, offsets, and properties.
- **Source Control**: Original game files (`.ztd`) should generally **not** be committed to the repository (check `.gitignore`).

## Key Files to Reference
- `.planning/PROJECT.md`: High-level goals and tech stack.
- `.planning/ROADMAP.md`: Current development phases and milestones.
- `tools/master_extract.ts`: Reference for the extraction process.
- `web/src/main.ts`: Reference for the rendering engine initialization.

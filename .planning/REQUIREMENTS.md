# REQUIREMENTS: browser-zoo

## 0. Prerequisites
- [PRE-01] **Original Game Files**: Users must provide `.ztd` and `.pal` files from a legal copy of Zoo Tycoon 1 (2001). These are required for asset extraction.

## 1. Asset Extraction & Conversion (The Pipeline)
- [EXTRACT-01] **Archive Management**: Must be able to read and extract files from `.ztd` (ZIP) archives.
- [EXTRACT-02] **Graphic Decoding**: Support for the proprietary `FATZ`/`ZATF` "Skip-Draw" RLE format.
- [EXTRACT-03] **Palette Handling**: Automatically resolve and apply the correct `.pal` files for each graphic.
- [EXTRACT-04] **Output Formats**:
  - Sprites: Optimized PNG sheets or individual frames.
  - Terrain: PNG tiles.
  - Metadata: JSON files containing animation frames, animal stats, and object properties.
- [EXTRACT-05] **Efficiency**: Batch processing support to extract all assets in a single run.

## 2. Core Game Engine (Web)
- [RENDER-01] **Rendering**: React-based isometric renderer.
- [RENDER-02] **Asset Management**: Efficient loading and caching of extracted PNGs and JSON metadata.
- [RENDER-03] **Isometric Grid**: Support for terrain tiles, pathing, and object placement.
- [RENDER-04] **Animation System**: Playback of animal and object animations based on extracted frame data.

## 3. Game Logic & AI
- [LOGIC-01] **Animal AI**: Simple state machines for animal behaviors (idling, walking, eating, sleeping).
- [LOGIC-02] **Visitor AI**: Basic pathfinding and satisfaction logic.
- [LOGIC-03] **Zoo Management**: Tracking funds, animal happiness, and visitor counts.

## 4. Modding & Extensibility
- [MOD-01] **Standardized Format**: Use human-readable JSON for all game data.
- [MOD-02] **Custom Assets**: Allow users to add their own animals or buildings by providing compatible PNGs and JSON.

## 5. Performance & UX
- [UX-01] **Fast Loading**: Minimize initial bundle size; lazy-load assets as needed.
- [UX-02] **Modern UI**: A clean, responsive interface inspired by the original Zoo Tycoon but optimized for the web.

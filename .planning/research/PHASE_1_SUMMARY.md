# RESEARCH: Phase 1 - Extraction Pipeline

## Graphics Format Analysis
There are two primary ways the Zoo Tycoon 1 graphics (`.ztd` archives) are being parsed in existing tools:

1.  **ApeCore Block-Based (`extract_zoo_graphics.ts`)**:
    *   Iterates through rows.
    *   Each row has a `blockCount`.
    *   Each block has an `offset` (skip) and `colorCount` (draw).
    *   This is a structured, offset-based approach.

2.  **Stream Command-RLE (`final_solve_v3.ts`)**:
    *   A continuous stream of commands.
    *   `cmd 1`: Skip $N$ pixels.
    *   `cmd 2`: Draw $N$ pixels from data.
    *   `cmd 3`: End of Line (EOL).
    *   This is more flexible and appears to be a later "discovery" in the development of these tools.

**Decision**: The unified `Extractor` should support both or determine the correct one based on the file header (e.g., `FATZ` vs. `ZATF` or other flags). Initial testing suggests `final_solve_v3.ts` is more accurate for the newer animal sprites.

## Archive & Palette Management
*   **Archives**: Use `adm-zip` for reading `.ztd` files.
*   **Palettes**: Palettes are 8-bit indexed (256 colors).
*   **Transparency**: The color `[255, 0, 255]` (Magic Pink) is often used as a transparency key, alongside actual alpha channel data if present in the palette.

## Proposed Class Architecture

### `ArchiveManager`
- Index all files across all `.ztd` files in `Gamefiles/`.
- Provide `getFile(path)` which returns a Buffer from the correct archive.
- Cache zip instances to avoid repeated disk I/O.

### `PaletteResolver`
- Read `.pal` files.
- Handle BGRA and RGBA variations.
- Provide `getColor(index)` for a given palette.

### `Extractor` (The Core)
- `decodeFATZ(buffer, palette)`: Implements the reconciled RLE logic.
- `extractAnimal(id)`: High-level method that finds the `.uca`, `.pal`, and all `.ani`/graphics for a specific animal.
- `batchExtract(whitelist)`: Loops through animals and terrain to export to `web/public/assets/`.

## Verification Strategy
- Compare the output of the new `Extractor` against the original `final_solve_v3.ts` output for `afrbuf`.
- Verify metadata extraction correctly parses `cName` and `cFamily`.
- Ensure all exported PNGs have correct transparency.

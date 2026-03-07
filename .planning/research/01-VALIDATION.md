# VALIDATION: Phase 1 - Extraction Pipeline

## Strategy
We will use a "Golden Master" comparison for the extraction logic and automated unit tests for the utility classes.

## Verification Tiers
1.  **Unit Tests**: `ArchiveManager` and `PaletteResolver` will have automated tests to verify file indexing and palette parsing.
2.  **Pixel-Perfect Comparison**: The `Extractor` output for a specific animal (e.g., `afrbuf`) will be compared against a known good extraction to ensure no regressions.
3.  **Frontend Integration**: A React component (`AssetViewer`) will be tested to ensure it can successfully fetch and render the exported JSON and PNG files.

## Automated Commands
- `ts-node tools/test/verify_archive.ts`: Verifies file retrieval from .ztd files.
- `ts-node tools/test/verify_palette.ts`: Verifies palette parsing accuracy.
- `ts-node tools/test/verify_extractor.ts`: Verifies RLE decoding and transparency.
- `ts-node tools/test/verify_batch.ts`: Verifies the CLI tool generates the correct directory structure and files.

# PLAN: Phase 1 - Foundation & The "Master Extract"

---
id: phase-1
requirements: [EXTRACT-01, EXTRACT-02, EXTRACT-03, EXTRACT-04, EXTRACT-05]
must_haves:
  truths:
    - "All animal sprites are extracted as PNGs with correct transparency."
    - "Metadata for animals is exported as valid JSON."
    - "The extraction pipeline can be run via a single CLI command."
  artifacts:
    - "tools/lib/archive.ts"
    - "tools/lib/palette.ts"
    - "tools/lib/extractor.ts"
    - "tools/master_extract_v2.ts"
    - "web/public/assets/afrbuf/metadata.json"
  key_links:
    - "web/public/assets/afrbuf/m/eat/E/E_000.png"
---

## Tasks

<task id="1.1" phase="1">
  <title>Implementation: ArchiveManager</title>
  <files>
    <file>tools/lib/archive.ts</file>
  </files>
  <action>
    Create a robust ArchiveManager that indexes all .ztd files in the Gamefiles/ directory and provides a lookup service.
  </action>
  <verify>
    <manual>Run a test script that fetches a known file (e.g., 'animals/afrbuf/afrbuf.pal') from the ArchiveManager.</manual>
    <automated>ts-node tools/test/verify_archive.ts</automated>
  </verify>
  <done>ArchiveManager successfully retrieves buffers for files spread across multiple .ztd archives.</done>
</task>

<task id="1.2" phase="1">
  <title>Implementation: PaletteResolver</title>
  <files>
    <file>tools/lib/palette.ts</file>
  </files>
  <action>
    Implement a PaletteResolver that can parse .pal files (BGRA/RGBA) and handle palette lookup by name from the archives.
  </action>
  <verify>
    <manual>Check the parsed colors for a known palette (e.g., afrbuf.pal).</manual>
    <automated>ts-node tools/test/verify_palette.ts</automated>
  </verify>
  <done>PaletteResolver correctly parses and returns color arrays for any .pal file in the archives.</done>
</task>

<task id="1.3" phase="1">
  <title>Implementation: Extractor & RLE Logic</title>
  <files>
    <file>tools/lib/extractor.ts</file>
  </files>
  <action>
    Consolidate the FATZ RLE decoding logic into a unified Extractor class. Support the Command-RLE scheme (skip/draw/eol) and transparency (Magic Pink check).
  </action>
  <verify>
    <manual>Extract a single frame and visually inspect it.</manual>
    <automated>ts-node tools/test/verify_extractor.ts</automated>
  </verify>
  <done>Extractor can decode any FATZ graphic into a Jimp image with correct transparency and colors.</done>
</task>

<task id="1.4" phase="1">
  <title>Implementation: Batch CLI Script</title>
  <files>
    <file>tools/master_extract_v2.ts</file>
  </files>
  <action>
    Create a CLI tool that uses the ArchiveManager, PaletteResolver, and Extractor to batch-process a list of animals and export them to web/public/assets/.
  </action>
  <verify>
    <manual>Run 'ts-node tools/master_extract_v2.ts afrbuf' and check the output directory.</manual>
    <automated>ts-node tools/test/verify_batch.ts</automated>
  </verify>
  <done>Batch script successfully exports multiple animals with metadata and sprites to the web assets folder.</done>
</task>

<task id="1.5" phase="1">
  <title>Implementation: Asset Viewer Component</title>
  <files>
    <file>web/src/components/AssetViewer.tsx</file>
    <file>web/src/App.tsx</file>
  </files>
  <action>
    Create a simple React component in the web app that can load and display an extracted animal's metadata and a few animation frames to confirm frontend compatibility.
  </action>
  <verify>
    <manual>Open the web app and select 'afrbuf' in the Asset Viewer to see its metadata and sprites.</manual>
  </verify>
  <done>Extracted assets are confirmed to be usable by the React frontend.</done>
</task>

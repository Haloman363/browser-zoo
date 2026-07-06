# Archive Survey — unknown trees and types

**Date:** 2026-07-05 · **Source:** `data/manifest.json` (328,486 files) + header probes via `ArchiveManager`.

Facts below are observed from real files; hypotheses are labeled as such.

## Verdicts (consumed by `tools/sweep_assets.ts`)

| Tree / type | Contents (observed) | Verdict | Reason |
|---|---|---|---|
| `ztatb/` (250,454) | 1:1 `NNNN.lle` + `NNNN.pal` pairs under a deep numeric tree `ztatb/XX/XXXXXXXX/XXXXXXXX/` | **copy** (incl. sibling `.pal`) | Not the sprite format (no palName header); undecoded, so verbatim copy keeps the pack complete and the paired `.pal` stays available for a future decoder |
| `ztats/` (2,924) | one shared `00.pal` + sequential `000000.lle`… | **copy** (incl. `.pal`) | same as above |
| `ztst/` (82) | `eNNN.lle` + `eNNN.pal` pairs — names match the root-level water/slope codes (`e000.bmp`…) | **copy** (incl. `.pal`) | same as above |
| `.lle` (128,176) | see format notes below | **copy** | not decodable with the current extractor; format hypothesis recorded for a future task |
| `.tga` (112) | `awards/awardN.tga`, TGA type 2 (uncompressed truecolor), ~4.7 KB each | **copy** | already a standard, openable format |
| `.lyt` (110) | plain INI text — `[LayoutInfo]` anchor/x/y/dx/dy/id/layer + `[Background]`… (UI layout definitions) | **config-dump** | it's config, not a blob — added to `dump_configs.ts` `CONFIG_EXTS` |
| `.bmp`/`.txt`/`.scn`/`.zoo`/`.ini`/`.h`/`.zip`/`.ucs` | standard/opaque single files | **copy** | verbatim copy is lossless |

`.pal` files outside the three `zt*` trees remain **skip** — sprite decoding bakes their colors into the emitted PNGs.

## `.lle` format notes (hypothesis, unconfirmed)

Probed `ztatb/00/00000000/00000001/0000.lle` (1,233 B), `ztats/000000.lle` (1,233 B),
`ztst/e000.lle` (155 B), `ztst/e001.lle` (153 B):

- **No** sprite-format header (no `FATZ`, no speed/palNameSize/palName — the u32 at
  the palNameSize position is implausible, e.g. `2097168`).
- First four u16 LE values read as a plausible **height, width, y, x** record:
  - `ztatb`/`ztats` samples: `33, 64, 16, 32` — exactly ZT1's 64×33 isometric tile
    footprint.
  - `ztst/e000`: `17, 32, 1, 2`; `ztst/e001`: `17, 31, 1, -1` — half-tile edge pieces.
- Remaining bytes look like per-row RLE runs whose skip/count progression traces a
  diamond (`…1f 03 … 1e 05 … 1c 09 … 1a 0d …` — skips 31→30→28→26, counts
  3→5→9→13), consistent with an isometric tile mask. Exact row/block encoding not
  worked out.
- **Hypothesis:** terrain tile graphics — `ztatb` = per-terrain-pair blend tiles keyed
  by the numeric tree (terrain ids?) with per-slope tile codes matching the root
  `0000.bmp`…`1210.bmp` slope-code names; `ztst` = water/edge tiles (`e` prefix);
  `ztats` = a flat tile set sharing one palette. Decoding these is a candidate
  focused task (format RE — likely cheaper than Track B binary work, the structure
  is nearly readable from hex alone).

## Probe transcripts

```
ztatb/00/00000000/00000001/0000.lle len: 1233 palLen(at sprite offset): 2097168 (implausible)
  hex: 2100400010002000f012021f03b5b5151e00021e05b27c7c514b1d00021c097bae550f1e1cb57e871b00021a0d2f14af
ztats/000000.lle len: 1233 (same shape, h=33 w=64)
ztst/e000.lle len: 155  first u16s: 17, 32, 1, 2
ztst/e001.lle len: 153  first u16s: 17, 31, 1, -1 (0xffff)
ui/buya.lyt  → "[LayoutInfo]\r\nanchor=1032\r\nx=17\r\ny=6\r\ndx=179\r\ndy=440\r\nid=3\r\nhelpid=3\r\nlayer=1\r\n;hidden\r\nstate=1\r\n\r\n[Background]\r\ntype=UI…"
awards/award1.tga → TGA image type 2 (uncompressed truecolor), 4,668 B
```

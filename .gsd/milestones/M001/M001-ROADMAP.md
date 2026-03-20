# M001: Migration

**Vision:** To take the original Zoo Tycoon 1 game files (provided by the user) and convert them to a modern format that is playable in a web browser.

## Success Criteria


## Slices

- [x] **S01: Extraction Pipeline** `risk:medium` `depends:[]`
  > After this: unit tests prove extraction-pipeline works
- [x] **S02: Core Rendering** `risk:medium` `depends:[S01]`
  > After this: unit tests prove core-rendering works
- [x] **S03: User Interface** `risk:medium` `depends:[S02]`
  > After this: unit tests prove user-interface works
- [x] **S04: Scenarios Ai** `risk:medium` `depends:[S03]`
  > After this: unit tests prove scenarios-ai works
- [x] **S05: Financials Staff** `risk:medium` `depends:[S04]`
  > After this: unit tests prove financials-staff works
- [x] **S06: Audio Polish** `risk:medium` `depends:[S05]`
  > After this: unit tests prove audio-polish works

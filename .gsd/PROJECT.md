# PROJECT: browser-zoo

## Goal
To take the original Zoo Tycoon 1 game files (provided by the user) and convert them to a modern format that is playable in a web browser.

> **Note**: This project requires original game files (`.ztd`, `.pal`) from a legal copy of Zoo Tycoon 1 (2001). These files are not provided in this repository.

## Key Features
- **Functionality**: Replicating the core gameplay loops of Zoo Tycoon 1.
- **Efficiency**: Optimized rendering and asset management for browser environments.
- **Modding Options**: Easy integration of custom animals, buildings, and scenarios.

## Tech Stack
- **Frontend**: React (Vite)
- **Tooling**: TypeScript scripts (located in `tools/`) for asset extraction and conversion.

## Success Criteria
- [ ] Successfully extract sprites, terrain, and game data from .ztd files.
- [ ] Render a playable zoo environment in the browser.
- [ ] Implement basic animal AI and visitor logic.
- [ ] Support modding via a standardized asset format.

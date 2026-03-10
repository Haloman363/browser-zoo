# browser-zoo

A modern, web-based recreation of the classic "Zoo Tycoon 1" (2001) built with Three.js.

## 🦁 Overview
`browser-zoo` is a project dedicated to bringing the authentic Zoo Tycoon experience to modern web browsers. It includes a custom asset extraction pipeline to decode original game files and a high-performance rendering engine that simulates the classic isometric gameplay.

## ⚠️ Requirements: Original Game Files
**This project does not distribute original Zoo Tycoon game assets.**

To use the extraction tools and run the game with original graphics, you must provide your own `.ztd` and `.pal` files from a legal copy of Zoo Tycoon 1 (2001).

1.  Locate your Zoo Tycoon installation.
2.  Copy the `.ztd` and `.pal` files into the `Gamefiles/` directory of this repository.
3.  Run the extraction scripts (see below).

## 🚀 Key Features
-   **Universal Extraction**: Tools to decode Skip-Draw RLE graphics and spatialized audio.
-   **Isometric Engine**: High-performance Three.js renderer with camera pan/zoom.
-   **Advanced AI**: Guest needs system, animal wandering, and staff maintenance routines.
-   **Management Simulation**: Economy system, scenario support, and exhibit suitability scoring.
-   **P2P Multiplayer**: Collaborative building via PeerJS.
-   **Modern Web Stack**: Built with TypeScript and Vite.

## 🛠️ Tech Stack
-   **Frontend**: [Three.js](https://threejs.org/) (Rendering), [Vite](https://vitejs.dev/) (Build Tool)
-   **Extraction**: [Node.js](https://nodejs.org/), [adm-zip](https://www.npmjs.com/package/adm-zip), [Jimp](https://www.npmjs.com/package/jimp)
-   **Networking**: [PeerJS](https://peerjs.com/) (Multiplayer)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)

## 🏗️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Extract Assets
Place your original game files in `Gamefiles/`, then run the batch extractor:
```bash
npx ts-node tools/master_extract.ts
```
*Note: This will populate `web/public/assets/` with PNGs and JSON metadata.*

### 3. Start the Game
```bash
npx vite web
```
Open `http://localhost:5173` in your browser.

## 🗺️ Roadmap
Check `.planning/ROADMAP.md` for detailed progress and upcoming phases.

## 📜 License
This project is for educational and reverse-engineering purposes. All Zoo Tycoon assets and intellectual property belong to their respective copyright holders (Microsoft/Blue Fang Games).

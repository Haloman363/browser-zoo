import * as fs from 'fs';
import * as path from 'path';
import { ArchiveManager } from './lib/archive';
import { PaletteResolver } from './lib/palette';
import { Extractor } from './lib/extractor';

const GAME_FILES_DIR = 'Gamefiles';
const OUTPUT_ROOT = 'web/public/assets/ui';

async function main() {
    const targetPath = process.argv[2]; // e.g., "ui/startup/stplay"
    if (!targetPath) {
        console.error("Usage: ts-node extract_ui_element.ts <uiPath>");
        process.exit(1);
    }

    const am = new ArchiveManager(GAME_FILES_DIR);
    const id = path.basename(targetPath);
    const outDir = path.join(OUTPUT_ROOT, id);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // 1. Find Palette
    let palette = PaletteResolver.getGrayscale();
    const palPath = `${targetPath}/${id}.pal`;
    if (am.hasFile(palPath)) {
        const palData = am.getFile(palPath);
        if (palData) palette = PaletteResolver.parse(palData);
    } else {
        // Fallback search for palette in the same folder
        const allPalettes = am.listFiles(f => f.startsWith(targetPath) && f.endsWith('.pal'));
        if (allPalettes.length > 0) {
            const palData = am.getFile(allPalettes[0]);
            if (palData) palette = PaletteResolver.parse(palData);
        }
    }

    // 2. Graphics
    const graphicFiles = am.listFiles(f => f.startsWith(targetPath + '/'))
        .filter(f => !['.ani', '.pal', '.wav', '.txt', '.lyt'].includes(path.extname(f).toLowerCase()));

    console.log(`Extracting ${id} from ${targetPath}...`);
    console.log(`  Found ${graphicFiles.length} graphics.`);

    for (const graphicPath of graphicFiles) {
        const graphicData = am.getFile(graphicPath);
        if (graphicData) {
            try {
                const frames = Extractor.decode(graphicData, palette);
                const state = path.basename(graphicPath);
                for (let i = 0; i < frames.length; i++) {
                    const frame = frames[i];
                    if (frame.width === 0 || frame.height === 0) continue;
                    const filename = `${state}_${i.toString().padStart(3, '0')}.png`;
                    await frame.image.writeAsync(path.join(outDir, filename));
                }
            } catch (err) {
                console.error(`  Error decoding ${graphicPath}: ${err}`);
            }
        }
    }
    console.log(`Extraction complete to ${outDir}`);
}

main().catch(console.error);

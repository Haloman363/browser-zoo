import * as fs from 'fs';
import * as path from 'path';
import { ArchiveManager } from './lib/archive';
import { PaletteResolver } from './lib/palette';
import { Extractor } from './lib/extractor';

const GAME_FILES_DIR = 'Gamefiles';
const OUTPUT_ROOT = 'web/public/assets';

async function extractStaff(am: ArchiveManager, staffId: string, subtype: string, animation: string) {
    const targetPath = `staff/${staffId}/${subtype}/${animation}`;
    const outDir = path.join(OUTPUT_ROOT, staffId, subtype, animation);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // 1. Find Palette
    let palette = PaletteResolver.getGrayscale();
    const possiblePalettes = [
        `staff/${staffId}/${staffId}.pal`,
        `staff/${staffId}/${subtype}/${staffId}.pal`,
        `staff/${staffId}/${animation}.pal`,
        `staff/maint/maint.pal` // Common for maintenance
    ];

    for (const p of possiblePalettes) {
        if (am.hasFile(p)) {
            const palData = am.getFile(p);
            if (palData) {
                palette = PaletteResolver.parse(palData);
                break;
            }
        }
    }

    // 2. Directions
    const directions = ['n', 'ne', 'e', 'se', 's'];
    for (const dir of directions) {
        const graphicPath = `${targetPath}/${dir}`;
        if (!am.hasFile(graphicPath)) continue;

        const graphicData = am.getFile(graphicPath);
        if (graphicData) {
            const dirDir = path.join(outDir, dir);
            if (!fs.existsSync(dirDir)) fs.mkdirSync(dirDir, { recursive: true });

            try {
                const frames = Extractor.decode(graphicData, palette);
                for (let i = 0; i < frames.length; i++) {
                    const filename = `${dir}_${i.toString().padStart(3, '0')}.png`;
                    await frames[i].image.writeAsync(path.join(dirDir, filename));
                }
            } catch (err) {
                console.error(`  Error decoding ${graphicPath}: ${err}`);
            }
        }
    }
}

async function main() {
    const am = new ArchiveManager(GAME_FILES_DIR);
    
    console.log("Extracting Maintenance Workers...");
    await extractStaff(am, 'maint', 'm', 'walk');
    await extractStaff(am, 'maint', 'f', 'walk');
    
    console.log("Extracting Tour Guides...");
    await extractStaff(am, 'tour', 'm', 'walk');
    await extractStaff(am, 'tour', 'f', 'walk');
    
    console.log("Extraction complete.");
}

main().catch(console.error);

import * as fs from 'fs';
import * as path from 'path';
import { ArchiveManager } from '../lib/archive';
import { PaletteResolver } from '../lib/palette';
import { Extractor } from '../lib/extractor';

async function main() {
    const gameFilesDir = 'Gamefiles';
    const am = new ArchiveManager(gameFilesDir);
    
    const animalId = 'afrbuf';
    const graphicPath = `animals/${animalId}/m/eat/E`;
    const palettePath = `animals/${animalId}/${animalId}.pal`;

    console.log(`Loading graphic: ${graphicPath}`);
    const graphicData = am.getFile(graphicPath);
    if (!graphicData) {
        console.error(`Error: Could not find graphic ${graphicPath}`);
        return;
    }

    console.log(`Loading palette: ${palettePath}`);
    const paletteData = am.getFile(palettePath);
    if (!paletteData) {
        console.error(`Error: Could not find palette ${palettePath}`);
        return;
    }

    const palette = PaletteResolver.parse(paletteData);
    const frames = Extractor.decode(graphicData, palette);

    console.log(`Decoded ${frames.length} frames.`);

    const outputDir = 'web/public/assets/test';
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const filename = `${animalId}_eat_E_${i.toString().padStart(3, '0')}.png`;
        const filePath = path.join(outputDir, filename);
        await frame.image.writeAsync(filePath);
        console.log(`Saved ${filePath} (${frame.width}x${frame.height})`);
        if (i > 2) break; // Just save a few frames for verification
    }

    console.log('Verification complete.');
}

main().catch(console.error);

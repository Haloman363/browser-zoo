import * as fs from 'fs';
import * as path from 'path';
import { ArchiveManager } from './lib/archive';
import { PaletteResolver } from './lib/palette';
import { Extractor } from './lib/extractor';
import Jimp from 'jimp';

const GAME_FILES_DIR = 'Gamefiles';
const OUTPUT_ROOT = 'web/public/assets/ui';

function decodeTGA(data: Buffer): Jimp {
    const idLen = data[0];
    const imageType = data[2];
    if (imageType !== 2) throw new Error("Only uncompressed truecolor TGA supported");

    const width = data.readUInt16LE(12);
    const height = data.readUInt16LE(14);
    const bpp = data[16];
    const descriptor = data[17];

    if (bpp !== 24 && bpp !== 32) throw new Error(`Only 24 or 32 bit TGA supported, got ${bpp}`);

    const bytesPerPixel = bpp / 8;
    const pixelData = data.slice(18 + idLen);

    const img = new Jimp(width, height, 0x00000000);
    const isTopDown = (descriptor & 0x20) !== 0;

    for (let y = 0; y < height; y++) {
        const actualY = isTopDown ? y : (height - 1 - y);
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * bytesPerPixel;
            const b = pixelData[idx];
            const g = pixelData[idx + 1];
            const r = pixelData[idx + 2];
            const a = bpp === 32 ? pixelData[idx + 3] : 255;
            img.setPixelColor(Jimp.rgbaToInt(r, g, b, a), x, actualY);
        }
    }
    return img;
}

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
        const allPalettes = am.listFiles(f => f.startsWith(targetPath) && f.endsWith('.pal'));
        if (allPalettes.length > 0) {
            const palData = am.getFile(allPalettes[0]);
            if (palData) palette = PaletteResolver.parse(palData);
        }
    }

    // 2. Graphics
    const graphicFiles = am.listFiles(f => f.startsWith(targetPath + '/'))
        .filter(f => !['.ani', '.pal', '.wav', '.txt', '.lyt', '.ai', '.cfg'].includes(path.extname(f).toLowerCase()));

    // Also explicitly check if the path itself is a file (like some TGA pointers)
    if (am.hasFile(targetPath + '.tga')) graphicFiles.push(targetPath + '.tga');

    console.log(`Extracting ${id} from ${targetPath}...`);
    console.log(`  Found ${graphicFiles.length} graphics.`);

    for (const graphicPath of graphicFiles) {
        const graphicData = am.getFile(graphicPath);
        if (graphicData) {
            try {
                const ext = path.extname(graphicPath).toLowerCase();
                const state = path.basename(graphicPath, ext);
                
                if (ext === '.tga') {
                    const img = decodeTGA(graphicData);
                    await img.writeAsync(path.join(outDir, `${state}.png`));
                } else {
                    const frames = Extractor.decode(graphicData, palette);
                    for (let i = 0; i < frames.length; i++) {
                        const frame = frames[i];
                        if (frame.width === 0 || frame.height === 0) continue;
                        const filename = `${state}_${i.toString().padStart(3, '0')}.png`;
                        await frame.image.writeAsync(path.join(outDir, filename));
                    }
                }
            } catch (err) {
                console.error(`  Error decoding ${graphicPath}: ${err}`);
            }
        }
    }
    console.log(`Extraction complete to ${outDir}`);
}

main().catch(console.error);

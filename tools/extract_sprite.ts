
import AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as path from 'path';
import Jimp from 'jimp';

const ZTD_PATH = 'Gamefiles/animals.ztd';
const ANIMAL_DIR = 'animals/afrbuf';
const OUTPUT_DIR = 'web/public/assets/test';

async function main() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const zip = new AdmZip(ZTD_PATH);
    const data = zip.getEntries().find((e: any) => e.entryName === `${ANIMAL_DIR}/m/eat/E`)?.getData();
    const palData = zip.getEntries().find((e: any) => e.entryName === `${ANIMAL_DIR}/afrbuf.pal`)?.getData();
    if (!data || !palData) return;

    // Correct Palette Mapping (BGRA)
    const palette: number[][] = [];
    for (let i = 0; i < 256; i++) {
        const idx = 4 + i * 4;
        palette.push([palData[idx+2], palData[idx+1], palData[idx]]);
    }

    const numFrames = data.readUInt32LE(0);
    const palPathLen = data.readUInt32LE(4);
    let ptr = 8 + palPathLen;
    
    console.log(`Extracting ${numFrames} frames using Row-Based Chunks...`);

    for (let f = 0; f < numFrames; f++) {
        if (ptr >= data.length - 16) break;

        const fStart = ptr;
        const width = data.readUInt16LE(ptr); 
        const height = data.readUInt16LE(ptr + 2); // Num Rows
        const totalSize = data.readUInt32LE(ptr + 4);
        
        // Use a wide canvas to avoid wrapping
        const canvasW = 256;
        const img = new Jimp(canvasW, height || 100, 0x00000000);
        
        let dataPtr = fStart + 16;
        const dataEnd = fStart + totalSize;

        for (let y = 0; y < (height || 100); y++) {
            if (dataPtr >= dataEnd) break;
            const numChunks = data.readUInt16LE(dataPtr);
            dataPtr += 2;
            
            let x = 0;
            for (let c = 0; c < numChunks; c++) {
                if (dataPtr + 2 > dataEnd) break;
                const skip = data[dataPtr++];
                const draw = data[dataPtr++];
                x += skip;
                for (let i = 0; i < draw; i++) {
                    const pix = data[dataPtr++];
                    if (pix !== 0 && x < canvasW && y < (height || 100)) {
                        const [r, g, b] = palette[pix];
                        img.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
                    }
                    x++;
                }
            }
        }

        await img.writeAsync(path.join(OUTPUT_DIR, `frame_${f}.png`));
        if (f % 20 === 0) console.log(`Saved frame ${f}`);
        
        ptr = fStart + totalSize + 4; 
    }
    console.log("Extraction complete!");
}

main().catch(console.error);

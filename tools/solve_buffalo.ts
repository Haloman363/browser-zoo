
import AdmZip from 'adm-zip';
import * as fs from 'fs';
import Jimp from 'jimp';

const ZTD_PATH = 'Gamefiles/animals.ztd';
const ANIMAL_DIR = 'animals/afrbuf';

async function main() {
    const zip = new AdmZip(ZTD_PATH);
    const data = zip.getEntries().find((e: any) => e.entryName === `${ANIMAL_DIR}/m/eat/E`)?.getData();
    const palData = zip.getEntries().find((e: any) => e.entryName === `${ANIMAL_DIR}/afrbuf.pal`)?.getData();
    if (!data || !palData) return;

    const palette: number[][] = [];
    for (let i = 0; i < 256; i++) {
        const idx = 4 + i * 4;
        palette.push([palData[idx], palData[idx+1], palData[idx+2]]);
    }

    const startOffset = 8 + data.readUInt32LE(4);
    
    // Header 0x22: 6c 00 (108) 39 00 (57) 65 05 (1381) ...
    // Let's assume Width=108 (or 54?)
    // Based on eat.ani: width is approx 54.
    
    if (!fs.existsSync('web/public/assets/solve')) fs.mkdirSync('web/public/assets/solve', { recursive: true });

    for (const w of [54, 57, 108]) {
        const image = new Jimp(w, 100, 0x00000000);
        let ptr = startOffset + 16;
        const totalSize = data.readUInt32LE(startOffset + 4);
        const end = startOffset + totalSize;
        
        let x = 0, y = 0;
        
        while (ptr < end && y < 100) {
            const ctrl = data.readInt8(ptr++);
            
            if (ctrl === 0) {
                // End of line
                x = 0;
                y++;
            } else if (ctrl > 0) {
                // Draw N pixels
                for (let i = 0; i < ctrl; i++) {
                    const pix = data[ptr++];
                    if (x < w && y < 100 && pix !== 0) {
                        const [r, g, b] = palette[pix];
                        image.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
                    }
                    x++;
                }
            } else {
                // Skip abs(N) pixels
                x += Math.abs(ctrl);
            }
            
            // Safety wrap
            while (x >= w) {
                x -= w;
                y++;
            }
        }
        await image.writeAsync(`web/public/assets/solve/buffalo_w${w}.png`);
        console.log(`Saved buffalo_w${w}.png`);
    }
}

main().catch(console.error);

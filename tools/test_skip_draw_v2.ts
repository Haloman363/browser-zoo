
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
    // 0x22 header
    const width = 57;
    const height = 50; 
    const totalSize = data.readUInt32LE(startOffset + 4); 
    const end = startOffset + totalSize;
    
    const img = new Jimp(width, height, 0x00000000);
    
    let ptr = startOffset + 16;
    let x = 0;
    let y = 0;

    // Decoding Loop
    while (ptr < end && y < height) {
        // Read [Skip] [Draw]
        const skip = data[ptr++];
        const draw = data[ptr++];
        
        // Apply Skip
        x += skip;
        while (x >= width) {
            x -= width;
            y++;
        }
        
        // Apply Draw
        for (let i = 0; i < draw; i++) {
            if (ptr >= end) break;
            const pix = data[ptr++];
            
            if (y < height && x < width && pix !== 0) {
                const [r, g, b] = palette[pix];
                // Check for Magenta (Transparency Key) just in case
                if (!(r === 255 && g === 0 && b === 255)) {
                    img.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
                }
            }
            
            x++;
            while (x >= width) {
                x -= width;
                y++;
            }
        }
    }

    await img.writeAsync('web/public/assets/test/buffalo_sd_v2.png');
    console.log("Saved buffalo_sd_v2.png");
}

main().catch(console.error);

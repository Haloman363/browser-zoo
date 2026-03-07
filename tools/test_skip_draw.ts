
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
    const width = 57;
    const height = 50; // From header 0x2c
    
    const img = new Jimp(width, height, 0x00000000);
    
    let x = 0;
    let y = 0;
    let ptr = startOffset + 16; // 0x32
    const end = startOffset + data.readUInt32LE(startOffset + 4);

    while (ptr < end && y < height) {
        const skip = data[ptr++];
        const draw = data[ptr++];
        
        // Handle wrapping explicitly? 
        // Or assumes stream fits in width?
        
        x += skip;
        while (x >= width) {
            x -= width;
            y++;
        }
        
        for (let i = 0; i < draw; i++) {
            if (ptr >= data.length) break;
            const pix = data[ptr++];
            if (y < height && x < width) {
                const [r, g, b] = palette[pix];
                img.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
            }
            x++;
            while (x >= width) {
                x -= width;
                y++;
            }
        }
    }

    await img.writeAsync('web/public/assets/test/buffalo_skip_draw.png');
    console.log("Saved buffalo_skip_draw.png");
}

main().catch(console.error);

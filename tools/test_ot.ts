
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
    const width = 108; 
    const height = 57; 
    const totalSize = data.readUInt32LE(startOffset + 4); 
    const end = startOffset + totalSize;
    
    const img = new Jimp(width, height, 0x00000000);
    
    let x = 0, y = 0, ptr = startOffset + 16;

    while (ptr < end && y < height) {
        const opaque = data[ptr++];
        const transparent = data[ptr++];
        
        // Draw opaque pixels
        for (let i = 0; i < opaque; i++) {
            if (ptr >= end) break;
            const pix = data[ptr++];
            if (y < height && x < width && pix !== 0) {
                const [r, g, b] = palette[pix];
                img.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
            }
            x++;
            while (x >= width) { x -= width; y++; }
        }
        
        // Skip transparent
        x += transparent;
        while (x >= width) { x -= width; y++; }
    }

    await img.writeAsync('web/public/assets/test/buffalo_opaque_trans.png');
    console.log("Saved buffalo_opaque_trans.png");
}

main().catch(console.error);


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
    
    const img = new Jimp(width, height, 0x00000000);
    let ptr = startOffset + 16;
    const totalSize = data.readUInt32LE(startOffset + 4);
    const end = startOffset + totalSize;
    
    let x = 0, y = 0;
    while (ptr < end && y < height) {
        const count = data[ptr++];
        for (let i = 0; i < count; i++) {
            const pix = data[ptr++];
            if (pix !== 0 && x < width && y < height) {
                const [r, g, b] = palette[pix];
                img.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
            }
            x++;
            if (x >= width) { x = 0; y++; }
        }
    }

    await img.writeAsync('web/public/assets/test/buffalo_108_simple.png');
    console.log("Saved buffalo_108_simple.png");
}

main().catch(console.error);

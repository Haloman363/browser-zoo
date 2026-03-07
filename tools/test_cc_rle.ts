
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
        palette.push([palData[idx], palData[idx + 1], palData[idx + 2]]);
    }

    const startOffset = 8 + data.readUInt32LE(4);
    const width = 57; 
    const totalSize = data.readUInt32LE(startOffset + 4);
    const end = startOffset + totalSize;
    
    const image = new Jimp(width, 100, 0x00000000);
    let ptr = startOffset + 16;
    
    let x = 0, y = 0;
    while (ptr < end - 1 && y < 100) {
        const count = data[ptr++];
        const pix = data[ptr++];
        
        for (let i = 0; i < count; i++) {
            if (pix !== 0 && x < width && y < 100) {
                const [r, g, b] = palette[pix];
                image.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
            }
            x++;
            if (x >= width) { x = 0; y++; }
        }
    }
    await image.writeAsync(`web/public/assets/test/buffalo_cc_rle.png`);
    console.log("Saved buffalo_cc_rle.png");
}

main().catch(console.error);

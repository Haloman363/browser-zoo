
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
    
    const image = new Jimp(width, 200, 0x00000000);
    let ptr = startOffset + 16;
    let x = 0, y = 0;

    while (ptr < end - 1 && y < 200) {
        const skip = data[ptr++];
        const draw = data[ptr++];
        
        x += skip;
        while (x >= width) { x -= width; y++; }
        
        for (let i = 0; i < draw; i++) {
            if (ptr >= end) break;
            const pix = data[ptr++];
            if (y < 200 && x < width && pix !== 0) {
                const [r, g, b] = palette[pix];
                image.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
            }
            x++;
            while (x >= width) { x -= width; y++; }
        }
    }
    await image.writeAsync(`web/public/assets/test/buffalo_stream.png`);
    console.log("Saved buffalo_stream.png");
}

main().catch(console.error);


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
    const totalSize = data.readUInt32LE(startOffset + 4); 
    const end = startOffset + totalSize;

    if (!fs.existsSync('web/public/assets/sd')) fs.mkdirSync('web/public/assets/sd', { recursive: true });

    for (let w = 40; w <= 60; w++) {
        const image = new Jimp(w, 80, 0x00000000);
        let ptr = startOffset + 16;
        let x = 0, y = 0;
        while (ptr < end - 1 && y < 80) {
            const skip = data[ptr++];
            const draw = data[ptr++];
            x += skip;
            while (x >= w) { x -= w; y++; }
            for (let i = 0; i < draw; i++) {
                if (ptr >= end) break;
                const pix = data[ptr++];
                if (y < 80 && x < w && pix !== 0) {
                    const [r, g, b] = palette[pix];
                    image.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
                }
                x++;
                while (x >= w) { x -= w; y++; }
            }
        }
        await image.writeAsync(`web/public/assets/sd/w_${w}.png`);
    }
    console.log("Saved SD tests.");
}

main().catch(console.error);


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
    const dataStart = startOffset + 16;
    const totalSize = data.readUInt32LE(startOffset + 4);
    const end = startOffset + totalSize;

    if (!fs.existsSync('web/public/assets/brute')) fs.mkdirSync('web/public/assets/brute', { recursive: true });

    for (let w = 30; w <= 150; w++) {
        const image = new Jimp(w, 100, 0x00000000);
        let ptr = dataStart;
        let x = 0, y = 0;
        while (ptr < end && y < 100) {
            const pix = data[ptr++];
            if (pix !== 0) {
                const [r, g, b] = palette[pix];
                image.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
            }
            x++;
            if (x >= w) { x = 0; y++; }
        }
        await image.writeAsync(`web/public/assets/brute/w_${w}.png`);
    }
    console.log("Saved brute tests.");
}

main().catch(console.error);

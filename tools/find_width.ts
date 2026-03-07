
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
    const totalSize = data.readUInt32LE(startOffset + 4);
    const end = startOffset + totalSize;
    
    if (!fs.existsSync('web/public/assets/widths')) fs.mkdirSync('web/public/assets/widths', { recursive: true });

    for (let w = 50; w <= 120; w++) {
        const image = new Jimp(w, 100, 0x00000000);
        let x = 0, y = 0, ptr = startOffset + 16;
        
        while (ptr < end && y < 100) {
            const ctrl = data[ptr++];
            if (ctrl === 0) {
                const skip = data[ptr++];
                x += skip;
            } else {
                for (let i = 0; i < ctrl; i++) {
                    const pix = data[ptr++];
                    if (y < 100 && x < w && pix !== 0) {
                        const [r, g, b] = palette[pix];
                        image.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
                    }
                    x++;
                }
            }
            while (x >= w) { x -= w; y++; }
        }
        await image.writeAsync(`web/public/assets/widths/w_${w}.png`);
    }
    console.log("Generated width tests with 0=skip logic.");
}

main().catch(console.error);


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
    const width = 108; // First value in header
    const totalSize = data.readUInt32LE(startOffset + 4);
    const height = 100;
    
    const image = new Jimp(width, height, 0x00000000);
    let ptr = startOffset + 16;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (ptr < startOffset + totalSize) {
                const pix = data[ptr++];
                if (pix !== 0) {
                    const [r, g, b] = palette[pix];
                    image.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
                }
            }
        }
    }
    await image.writeAsync(`web/public/assets/test/raw_test_108.png`);
}

main().catch(console.error);

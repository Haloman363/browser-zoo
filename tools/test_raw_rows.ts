
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
    
    const img = new Jimp(256, 256, 0x00000000);
    
    let x = 0, y = 0;
    let ptr = startOffset + 16;

    while (ptr < end && y < 256) {
        const pix = data[ptr++];
        if (pix === 0) {
            y++;
            x = 0;
        } else {
            const [r, g, b] = palette[pix];
            img.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
            x++;
        }
    }

    await img.writeAsync('web/public/assets/test/buffalo_raw_rows.png');
}

main().catch(console.error);

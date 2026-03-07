
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
        palette.push([palData[idx+2], palData[idx+1], palData[idx]]);
    }

    const startOffset = 8 + data.readUInt32LE(4);
    const width = 57; 
    const height = 100;
    
    const img = new Jimp(width, height, 0x00000000);
    let x=0, y=0, ptr = startOffset + 16;
    const end = startOffset + data.readUInt32LE(startOffset + 4);

    while(ptr < end && y < height) {
        const pix = data[ptr++];
        if (pix === 0) {
            // EOL
            y++; x = 0;
        } else {
            const [r, g, b] = palette[pix];
            // Skip Magenta transparency just in case
            if (!(r === 255 && g === 0 && b === 255)) {
                img.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
            }
            x++;
            if (x >= width) { x=0; y++; }
        }
    }

    await img.writeAsync('web/public/assets/test/buffalo_raw_eol.png');
}

main().catch(console.error);

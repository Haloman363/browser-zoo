
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
    
    let x = 0;
    let y = 0;
    let ptr = startOffset + 16;

    while (ptr < end && y < 256) {
        const ctrl = data[ptr++];
        
        if (ctrl === 0) {
            // End of Row
            y++;
            x = 0;
        } else if (ctrl < 0x80) {
            // Literal Run
            for (let i = 0; i < ctrl; i++) {
                const pix = data[ptr++];
                if (x < 256 && y < 256 && pix !== 0) {
                    const [r, g, b] = palette[pix];
                    img.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
                }
                x++;
            }
        } else {
            // Skip
            x += (ctrl - 0x80);
        }
    }

    // Crop
    let minX = 256, maxX = 0, minY = 256, maxY = 0;
    let found = false;
    for (let py = 0; py < 256; py++) {
        for (let px = 0; px < 256; px++) {
            if (img.getPixelColor(px, py) !== 0) {
                if (px < minX) minX = px;
                if (px > maxX) maxX = px;
                if (py < minY) minY = py;
                if (py > maxY) maxY = py;
                found = true;
            }
        }
    }

    if (found) {
        const w = maxX - minX + 1;
        const h = maxY - minY + 1;
        const final = new Jimp(w, h);
        final.blit(img, 0, 0, minX, minY, w, h);
        await final.writeAsync('web/public/assets/test/buffalo_absolute_eol.png');
        console.log(`Saved buffalo_absolute_eol.png (${w}x${h})`);
    } else {
        console.log("No pixels found.");
    }
}

main().catch(console.error);

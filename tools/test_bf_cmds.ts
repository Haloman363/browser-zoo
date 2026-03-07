
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
    const end = startOffset + data.readUInt32LE(startOffset + 4);
    
    let x = 0, y = 0;
    while (ptr < end && y < height) {
        const cmd = data[ptr++];
        const count = data[ptr++];
        
        if (cmd === 1) {
            // Skip
            x += count;
        } else if (cmd === 2) {
            // Draw
            for (let i = 0; i < count; i++) {
                const pix = data[ptr++];
                if (y < height && x < width && pix !== 0) {
                    const [r, g, b] = palette[pix];
                    img.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
                }
                x++;
            }
        } else if (cmd === 3) {
            // End of line? Or skip lines?
            y++;
            x = 0;
            // Does cmd 3 have a count? If so, maybe skip N lines?
            // ptr--; // If it doesn't have a count, step back
        } else {
            // Unknown cmd
        }
        
        while (x >= width) { x -= width; y++; }
    }

    await img.writeAsync('web/public/assets/test/buffalo_bf_cmds.png');
}

main().catch(console.error);

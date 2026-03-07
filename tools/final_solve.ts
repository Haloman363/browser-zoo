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

    // Palette: skip 4-byte header, then 256 * 4 bytes (RGBA)
    const palette: number[][] = [];
    for (let i = 0; i < 256; i++) {
        const idx = 4 + i * 4;
        palette.push([palData[idx], palData[idx+1], palData[idx+2], palData[idx+3]]);
    }

    const startOffset = 8 + data.readUInt32LE(4);
    const width = 108; 
    const height = 57; 
    const totalSize = data.readUInt32LE(startOffset + 4); 
    const end = startOffset + totalSize;
    
    const img = new Jimp(width, height, 0x00000000);
    
    let x = 0, y = 0, ptr = startOffset + 16;

    while (ptr < end && y < height) {
        const cmd = data[ptr++];
        const count = data[ptr++];
        
        if (cmd === 1) {
            // Skip
            x += count;
        } else if (cmd === 2) {
            // Draw
            for (let i = 0; i < count; i++) {
                if (ptr >= data.length) break;
                const pix = data[ptr++];
                
                // Index 1 is often Magenta (Transparent) in ZT1
                // Index 0 is often Black or Background
                // Let's check the alpha in our palette!
                const [r, g, b, a] = palette[pix];
                
                if (a > 0 && !(r === 255 && g === 0 && b === 255)) {
                    img.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
                }
                x++;
            }
        } else if (cmd === 3) {
            // End of Line
            y++;
            x = 0;
        } else {
            break;
        }
    }

    await img.writeAsync('web/public/assets/test/buffalo_final_solve_v2.png');
    console.log("Saved buffalo_final_solve_v2.png");
}

main().catch(console.error);

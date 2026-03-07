
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
    const numRows = data.readUInt16LE(startOffset); // 108?
    
    console.log(`numRows: ${numRows}`);
    
    const img = new Jimp(256, 256, 0x00000000); // Oversized for safety
    let ptr = startOffset + 2; 
    
    let maxX = 0;
    for (let y = 0; y < numRows; y++) {
        if (ptr + 2 > data.length) break;
        const numChunksInRow = data.readUInt16LE(ptr);
        ptr += 2;
        
        let x = 0;
        for (let c = 0; c < numChunksInRow; c++) {
            if (ptr + 2 > data.length) break;
            const skip = data[ptr++];
            const draw = data[ptr++];
            x += skip;
            for (let i = 0; i < draw; i++) {
                const pix = data[ptr++];
                if (y < 256 && x < 256 && pix !== 0) {
                    const [r, g, b] = palette[pix];
                    img.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
                }
                x++;
            }
        }
        if (x > maxX) maxX = x;
    }

    if (maxX > 0) {
        const finalImg = new Jimp(maxX, numRows);
        finalImg.blit(img, 0, 0, 0, 0, maxX, numRows);
        await finalImg.writeAsync('web/public/assets/test/buffalo_row_chunks.png');
        console.log(`Saved buffalo_row_chunks.png (${maxX}x${numRows})`);
    } else {
        console.log("No pixels decoded.");
    }
}

main().catch(console.error);

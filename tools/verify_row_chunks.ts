
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
    const width = data.readUInt16LE(startOffset); 
    const height = data.readUInt16LE(startOffset + 2); // 57?
    
    // Header check
    console.log(`Header: ${width}x${height}`);
    
    const img = new Jimp(256, 256, 0x00000000);
    
    let ptr = startOffset + 16;
    let y = 0;
    
    // According to dump, 0x32 starts with 01 00 (1 chunk)
    // Then 02 09 ...
    
    // We loop until we hit the end of the frame data block or run out of rows
    // But wait, do we know the number of rows? Is it `height`?
    // Let's assume `height` is the number of rows.
    
    for(let r=0; r<height; r++) { // Try to read `height` rows
        if(ptr >= data.length) break;
        
        const numChunks = data.readUInt16LE(ptr);
        ptr += 2;
        
        let x = 0;
        for(let c=0; c<numChunks; c++) {
            const skip = data[ptr++];
            const draw = data[ptr++];
            
            x += skip;
            for(let i=0; i<draw; i++) {
                const pix = data[ptr++];
                if(pix !== 0) {
                    const [red, g, b] = palette[pix];
                    img.setPixelColor(Jimp.rgbaToInt(red, g, b, 255), x, y);
                }
                x++;
            }
        }
        y++;
    }

    await img.writeAsync('web/public/assets/test/buffalo_row_verified.png');
    console.log("Saved buffalo_row_verified.png");
}

main().catch(console.error);

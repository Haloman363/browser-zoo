
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
    const width = data.readUInt16LE(startOffset); // 108
    const height = data.readUInt16LE(startOffset + 2); // 57
    const totalSize = data.readUInt32LE(startOffset + 6); // Size including header? (using +6 because 0x28 is size)
    // Wait, let's use the absolute offset logic.
    // startOffset is 0x22. Size is at 0x28. 
    
    console.log(`Width: ${width}, Height: ${height}`);
    
    const img = new Jimp(width, height, 0x00000000);
    
    let ptr = startOffset + 18; // Data starts at 0x34
    const end = startOffset + data.readUInt32LE(startOffset + 6);

    for (let y = 0; y < height; y++) {
        if (ptr >= data.length) break;
        
        const numChunks = data.readUInt16LE(ptr);
        ptr += 2;
        
        let x = 0;
        for (let c = 0; c < numChunks; c++) {
            if (ptr + 2 > data.length) break;
            const skip = data[ptr++];
            const draw = data[ptr++];
            
            x += skip;
            for (let i = 0; i < draw; i++) {
                const pix = data[ptr++];
                if (y < height && x < width && pix !== 0) {
                    const [r, g, b] = palette[pix];
                    img.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
                }
                x++;
            }
        }
    }

    await img.writeAsync('web/public/assets/test/buffalo_chunked.png');
    console.log("Saved buffalo_chunked.png");
}

main().catch(console.error);

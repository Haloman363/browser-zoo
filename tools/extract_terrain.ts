
import AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as path from 'path';
import Jimp from 'jimp';

const ZTD_PATH = 'Gamefiles/terrain.ztd';
const OUTPUT_DIR = 'web/public/assets/terrain';

async function main() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    
    const zip = new AdmZip(ZTD_PATH);
    const entry = zip.getEntries().find(e => e.entryName === 'terrain/grass.tga');
    if (!entry) {
        console.error('grass.tga not found');
        return;
    }
    
    const data = entry.getData();
    
    // TGA Header (18 bytes)
    // 0: ID length
    // 1: Color map type
    // 2: Image type (2 = uncompressed RGB)
    // 12: Width (2 bytes)
    // 14: Height (2 bytes)
    // 16: Pixel depth (usually 24 or 32)
    // 17: Descriptor
    
    const idLen = data[0];
    const imgType = data[2];
    const width = data.readUInt16LE(12);
    const height = data.readUInt16LE(14);
    const depth = data[16];
    
    console.log(`grass.tga: ${width}x${height}, type ${imgType}, depth ${depth}`);
    
    if (imgType !== 2) {
        console.error('Only uncompressed RGB TGA supported for now');
        return;
    }
    
    const pixelDataStart = 18 + idLen;
    const img = new Jimp(width, height);
    
    let ptr = pixelDataStart;
    
    // TGA is usually stored Bottom-Up, unless bit 5 of descriptor is set.
    // Descriptor is at offset 17.
    const desc = data[17];
    const topToBottom = (desc & 0x20) !== 0;
    
    const bytesPerPixel = depth / 8;
    
    for (let y = 0; y < height; y++) {
        const rowY = topToBottom ? y : (height - 1 - y);
        
        for (let x = 0; x < width; x++) {
            const b = data[ptr++];
            const g = data[ptr++];
            const r = data[ptr++];
            const a = (depth === 32) ? data[ptr++] : 255;
            
            img.setPixelColor(Jimp.rgbaToInt(r, g, b, a), x, rowY);
        }
    }
    
    await img.writeAsync(path.join(OUTPUT_DIR, 'grass.png'));
    console.log('Extracted grass.png');
}

main().catch(console.error);


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
    
    if (!fs.existsSync('web/public/assets/brute_force')) fs.mkdirSync('web/public/assets/brute_force', { recursive: true });

    // We'll scan the first 2000 bytes for potential frame starts
    for (let i = startOffset; i < startOffset + 2000; i += 2) {
        // Assume frame starts with some header, then data. 
        // Let's try every offset.
        
        const width = 108; 
        const height = 57;
        const img = new Jimp(width, height, 0x00000000);
        
        let ptr = i;
        let x = 0, y = 0;
        let decodedCount = 0;
        
        // Try decoding 100 commands
        try {
            for(let c=0; c<200; c++) {
                if (ptr >= data.length - 1) break;
                const cmd = data[ptr++];
                const count = data[ptr++];
                if (cmd < 1 || cmd > 3 || count > 128) throw "Invalid";
                
                if (cmd === 1) x += count;
                else if (cmd === 2) {
                    for(let p=0; p<count; p++) {
                        const pix = data[ptr++];
                        if (pix !== 0 && x < width && y < height) {
                            const [r, g, b] = palette[pix];
                            img.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
                            decodedCount++;
                        }
                        x++;
                    }
                } else if (cmd === 3) {
                    y++; x = 0;
                }
                while (x >= width) { x -= width; y++; }
                if (y >= height) break;
            }
            
            if (decodedCount > 100) {
                await img.writeAsync(`web/public/assets/brute_force/off_${i.toString(16)}.png`);
                console.log(`Found potential frame at 0x${i.toString(16)} (Pixels: ${decodedCount})`);
            }
        } catch(e) {}
    }
}

main().catch(console.error);

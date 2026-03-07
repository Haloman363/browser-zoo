
import AdmZip from 'adm-zip';
import * as fs from 'fs';
import Jimp from 'jimp';

const ZTD_PATH = 'Gamefiles/animals.ztd';
const ANIMAL_DIR = 'animals/afrbuf';

async function main() {
    const zip = new AdmZip(ZTD_PATH);
    const spriteEntry = zip.getEntries().find((e: any) => e.entryName === `${ANIMAL_DIR}/m/eat/E`);
    if (!spriteEntry) return;
    const data = spriteEntry.getData();

    const palData = zip.getEntries().find((e: any) => e.entryName === `${ANIMAL_DIR}/afrbuf.pal`)?.getData();
    if (!palData) return;
    const palette: number[][] = [];
    for (let i = 0; i < 256; i++) {
        palette.push([palData[i * 3], palData[i * 3 + 1], palData[i * 3 + 2]]);
    }

    const palPathLen = data.readUInt32LE(4);
    const startOffset = 8 + palPathLen;
    
    // Frame 0:
    const width = data.readUInt16LE(startOffset); // 57
    const totalSize = data.readUInt32LE(startOffset + 4); // 1381
    const dataStart = startOffset + 14; // Header seems to be 14 bytes
    
    // Guess height based on data or anchor?
    // Let's just use a large height and crop later.
    const tempHeight = 200;
    const image = new Jimp(width, tempHeight);
    
    let x = 0;
    let y = 0;
    let offset = dataStart;
    const decodeEnd = startOffset + totalSize;

    while (offset < decodeEnd - 1) {
        const skip = data[offset++];
        const literal = data[offset++];
        
        x += skip;
        while (x >= width) {
            x -= width;
            y++;
        }
        
        for (let i = 0; i < literal; i++) {
            const pixelIndex = data[offset++];
            if (y < tempHeight) {
                const [r, g, b] = palette[pixelIndex];
                image.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
            }
            x++;
            while (x >= width) {
                x -= width;
                y++;
            }
        }
    }

    // Crop to actual height
    const finalHeight = y + 1;
    const finalImage = new Jimp(width, finalHeight);
    finalImage.blit(image, 0, 0, 0, 0, width, finalHeight);
    await finalImage.writeAsync('web/public/assets/test/frame_0_test.png');
    console.log(`Saved frame_0_test.png (${width}x${finalHeight})`);
}

main().catch(console.error);

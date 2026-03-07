
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
        palette.push([palData[idx], palData[idx + 1], palData[idx + 2]]);
    }

    const startOffset = 8 + data.readUInt32LE(4);
    
    // Frame 0: [width (2)] [height (2)] [totalSize (4)] [ox (2)] [oy (2)] [ax (2)] [ay (2)]
    // Based on hex: 6c 00 (108) 39 00 (57) 65 05 00 00 (1381) ...
    const width = data.readUInt16LE(startOffset);
    const height = data.readUInt16LE(startOffset + 2);
    const totalSize = data.readUInt32LE(startOffset + 4);
    
    console.log(`Decoding Frame 0: ${width}x${height}, totalSize=${totalSize}`);

    const image = new Jimp(width, height, 0x00000000);
    let outPtr = 0;
    let inPtr = startOffset + 16;
    const end = startOffset + totalSize;

    while (inPtr < end - 1) {
        const skip = data[inPtr++];
        const literal = data[inPtr++];
        
        outPtr += skip;
        for (let i = 0; i < literal; i++) {
            const pix = data[inPtr++];
            const px = outPtr % width;
            const py = Math.floor(outPtr / width);
            if (py < height && pix !== 0) {
                const [r, g, b] = palette[pix];
                image.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), px, py);
            }
            outPtr++;
        }
    }

    await image.writeAsync('web/public/assets/test/buffalo_fixed.png');
    console.log("Saved buffalo_fixed.png");
}

main().catch(console.error);

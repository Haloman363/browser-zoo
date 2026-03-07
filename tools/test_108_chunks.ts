
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
    const numChunks = data.readUInt16LE(startOffset); // 108
    const width = data.readUInt16LE(startOffset + 2); // 57
    
    console.log(`Decoding ${numChunks} chunks, wrap width ${width}`);
    
    const pixels: {isOpaque: boolean, val: number}[] = [];
    let ptr = startOffset + 18; // Skip header

    for (let c = 0; c < numChunks; c++) {
        const skip = data[ptr++];
        const draw = data[ptr++];
        
        for (let i = 0; i < skip; i++) {
            pixels.push({ isOpaque: false, val: 0 });
        }
        for (let i = 0; i < draw; i++) {
            pixels.push({ isOpaque: true, val: data[ptr++] });
        }
    }

    console.log(`Total decoded pixels: ${pixels.length}`);
    const height = Math.ceil(pixels.length / width);
    const image = new Jimp(width, height, 0x00000000);

    for (let i = 0; i < pixels.length; i++) {
        if (pixels[i].isOpaque) {
            const [r, g, b] = palette[pixels[i].val];
            image.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), i % width, Math.floor(i / width));
        }
    }

    await image.writeAsync('web/public/assets/test/buffalo_108chunks.png');
    console.log("Saved buffalo_108chunks.png");
}

main().catch(console.error);

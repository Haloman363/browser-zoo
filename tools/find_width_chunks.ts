
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

    const numChunks = data.readUInt16LE(0x34); 
    console.log(`Decoding ${numChunks} chunks...`);
    
    const pixels: {isOpaque: boolean, val: number}[] = [];
    let ptr = 0x36;

    for (let c = 0; c < numChunks; c++) {
        const skip = data[ptr++];
        const draw = data[ptr++];
        for (let i = 0; i < skip; i++) pixels.push({isOpaque: false, val: 0});
        for (let i = 0; i < draw; i++) {
            pixels.push({isOpaque: true, val: data[ptr++]});
        }
    }

    console.log(`Total pixels: ${pixels.length}`);

    if (!fs.existsSync('web/public/assets/chunks')) fs.mkdirSync('web/public/assets/chunks', { recursive: true });

    for (let w = 30; w <= 150; w++) {
        const h = Math.ceil(pixels.length / w);
        if (h === 0 || h > 1000) continue;
        const image = new Jimp(w, h, 0x00000000);
        for (let i = 0; i < pixels.length; i++) {
            if (pixels[i].isOpaque) {
                const [r, g, b] = palette[pixels[i].val];
                image.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), i % w, Math.floor(i / w));
            }
        }
        await image.writeAsync(`web/public/assets/chunks/w_${w}.png`);
    }
}

main().catch(console.error);

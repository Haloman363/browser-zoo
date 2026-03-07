
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
    const totalSize = data.readUInt32LE(startOffset + 4);
    const end = startOffset + totalSize;
    const dataStart = startOffset + 16;

    if (!fs.existsSync('web/public/assets/final_v2')) fs.mkdirSync('web/public/assets/final_v2', { recursive: true });

    for (let w = 50; w <= 70; w++) {
        const img = new Jimp(w, 80, 0x00000000);
        let x=0, y=0, ptr=dataStart;
        while(ptr < end-1 && y < 80) {
            const skip = data[ptr++];
            const draw = data[ptr++];
            x += skip;
            while(x >= w){x-=w; y++;}
            for(let i=0; i<draw; i++) {
                if (ptr >= end) break;
                const pix = data[ptr++];
                if(pix !== 0 && x < w && y < 80) img.setPixelColor(Jimp.rgbaToInt(palette[pix][0], palette[pix][1], palette[pix][2], 255), x, y);
                x++; if(x>=w){x=0;y++;}
            }
        }
        await img.writeAsync(`web/public/assets/final_v2/w${w}.png`);
    }
}

main().catch(console.error);

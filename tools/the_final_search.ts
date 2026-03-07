
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

    if (!fs.existsSync('web/public/assets/final')) fs.mkdirSync('web/public/assets/final', { recursive: true });

    // Try Widths
    const widths = [54, 57, 108];
    
    // Variant 1: Count-Color [Count][Color]
    for(const w of widths) {
        const img = new Jimp(w, 100, 0x00000000);
        let x=0, y=0, ptr=dataStart;
        while(ptr < end-1 && y < 100) {
            const count = data[ptr++];
            const pix = data[ptr++];
            for(let i=0; i<count; i++) {
                if(pix !== 0 && x < w && y < 100) img.setPixelColor(Jimp.rgbaToInt(palette[pix][0], palette[pix][1], palette[pix][2], 255), x, y);
                x++; if(x>=w){x=0;y++;}
            }
        }
        await img.writeAsync(`web/public/assets/final/v1_w${w}.png`);
    }

    // Variant 2: Skip-Draw [Skip][Draw][Pixels...]
    for(const w of widths) {
        const img = new Jimp(w, 100, 0x00000000);
        let x=0, y=0, ptr=dataStart;
        while(ptr < end-1 && y < 100) {
            const skip = data[ptr++];
            const draw = data[ptr++];
            x += skip;
            while(x >= w){x-=w; y++;}
            for(let i=0; i<draw; i++) {
                const pix = data[ptr++];
                if(pix !== 0 && x < w && y < 100) img.setPixelColor(Jimp.rgbaToInt(palette[pix][0], palette[pix][1], palette[pix][2], 255), x, y);
                x++; if(x>=w){x=0;y++;}
            }
        }
        await img.writeAsync(`web/public/assets/final/v2_w${w}.png`);
    }

    // Variant 3: Signed Control [Ctrl][Pixels if > 0 else Skip abs]
    for(const w of widths) {
        const img = new Jimp(w, 100, 0x00000000);
        let x=0, y=0, ptr=dataStart;
        while(ptr < end && y < 100) {
            const ctrl = data.readInt8(ptr++);
            if(ctrl === 0){ x=0; y++; }
            else if(ctrl > 0) {
                for(let i=0; i<ctrl; i++){
                    const pix = data[ptr++];
                    if(pix !== 0 && x < w && y < 100) img.setPixelColor(Jimp.rgbaToInt(palette[pix][0], palette[pix][1], palette[pix][2], 255), x, y);
                    x++; if(x>=w){x=0;y++;}
                }
            } else {
                x += Math.abs(ctrl);
                while(x >= w){x-=w; y++;}
            }
        }
        await img.writeAsync(`web/public/assets/final/v3_w${w}.png`);
    }

    // Variant 4: Type-Count-Draw [Type][Count] (1=Skip, 2=Draw)
    for(const w of widths) {
        const img = new Jimp(w, 100, 0x00000000);
        let x=0, y=0, ptr=dataStart;
        while(ptr < end-1 && y < 100) {
            const type = data[ptr++];
            const count = data[ptr++];
            if(type === 1) x += count;
            else if(type === 2) {
                for(let i=0; i<count; i++){
                    const pix = data[ptr++];
                    if(pix !== 0 && x < w && y < 100) img.setPixelColor(Jimp.rgbaToInt(palette[pix][0], palette[pix][1], palette[pix][2], 255), x, y);
                    x++;
                }
            } else if(type === 3) { y++; x=0; }
            while(x >= w){x-=w; y++;}
        }
        await img.writeAsync(`web/public/assets/final/v4_w${w}.png`);
    }

    console.log("Final search complete.");
}

main().catch(console.error);

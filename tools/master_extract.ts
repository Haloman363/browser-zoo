
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
    const totalSize = data.readUInt32LE(startOffset + 4);
    const end = startOffset + totalSize;
    const dataStart = startOffset + 16;

    if (!fs.existsSync('web/public/assets/master')) fs.mkdirSync('web/public/assets/master', { recursive: true });

    const widths = [57, 108];

    // Method A: Skip-Draw (2-byte control)
    for (const w of widths) {
        const img = new Jimp(w, 100, 0x00000000);
        let x = 0, y = 0, ptr = dataStart;
        while (ptr < end - 1 && y < 100) {
            const skip = data[ptr++];
            const draw = data[ptr++];
            x += skip;
            while (x >= w) { x -= w; y++; }
            for (let i = 0; i < draw; i++) {
                if (ptr >= end) break;
                const pix = data[ptr++];
                if (y < 100 && x < w && pix !== 0) {
                    img.setPixelColor(Jimp.rgbaToInt(palette[pix][0], palette[pix][1], palette[pix][2], 255), x, y);
                }
                x++;
                while (x >= w) { x -= w; y++; }
            }
        }
        await img.writeAsync(`web/public/assets/master/sd_w${w}.png`);
    }

    // Method B: Signed-Ctrl (1-byte control)
    for (const w of widths) {
        const img = new Jimp(w, 100, 0x00000000);
        let x = 0, y = 0, ptr = dataStart;
        while (ptr < end && y < 100) {
            const ctrl = data.readInt8(ptr++);
            if (ctrl === 0) { x = 0; y++; }
            else if (ctrl > 0) {
                for (let i = 0; i < ctrl; i++) {
                    if (ptr >= end) break;
                    const pix = data[ptr++];
                    if (y < 100 && x < w && pix !== 0) {
                        img.setPixelColor(Jimp.rgbaToInt(palette[pix][0], palette[pix][1], palette[pix][2], 255), x, y);
                    }
                    x++;
                    if (x >= w) { x = 0; y++; }
                }
            } else {
                x += Math.abs(ctrl);
                while (x >= w) { x -= w; y++; }
            }
        }
        await img.writeAsync(`web/public/assets/master/sc_w${w}.png`);
    }

    // Method C: Raw stream (no control)
    for (const w of widths) {
        const img = new Jimp(w, 100, 0x00000000);
        let x = 0, y = 0, ptr = dataStart;
        while (ptr < end && y < 100) {
            const pix = data[ptr++];
            if (y < 100 && x < w && pix !== 0) {
                img.setPixelColor(Jimp.rgbaToInt(palette[pix][0], palette[pix][1], palette[pix][2], 255), x, y);
            }
            x++;
            if (x >= w) { x = 0; y++; }
        }
        await img.writeAsync(`web/public/assets/master/raw_w${w}.png`);
    }
}

main().catch(console.error);

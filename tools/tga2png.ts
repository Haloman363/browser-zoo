import * as fs from 'fs';
import Jimp from 'jimp';

function tga2png(input: string, output: string) {
    const data = fs.readFileSync(input);
    const idLen = data[0];
    const imageType = data[2];
    if (imageType !== 2) throw new Error("Only uncompressed truecolor TGA supported");

    const width = data.readUInt16LE(12);
    const height = data.readUInt16LE(14);
    const bpp = data[16];
    const descriptor = data[17];

    if (bpp !== 24 && bpp !== 32) throw new Error(`Only 24 or 32 bit TGA supported, got ${bpp}`);

    const bytesPerPixel = bpp / 8;
    const pixelData = data.slice(18 + idLen);

    const img = new Jimp(width, height, 0x00000000);
    const isTopDown = (descriptor & 0x20) !== 0;

    for (let y = 0; y < height; y++) {
        const actualY = isTopDown ? y : (height - 1 - y);
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * bytesPerPixel;
            const b = pixelData[idx];
            const g = pixelData[idx + 1];
            const r = pixelData[idx + 2];
            const a = bpp === 32 ? pixelData[idx + 3] : 255;
            img.setPixelColor(Jimp.rgbaToInt(r, g, b, a), x, actualY);
        }
    }
    img.write(output);
}

const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) {
    console.error("Usage: ts-node tga2png.ts <input.tga> <output.png>");
    process.exit(1);
}

tga2png(input, output);

import Jimp from 'jimp';
import { Color } from './palette';

export interface Frame {
    width: number;
    height: number;
    x: number;
    y: number;
    image: Jimp;
}

export class Extractor {
    public static decode(data: Buffer, palette: Color[]): Frame[] {
        let offset = 0;

        // Check for FATZ magic
        const magic = data.toString('utf8', 0, 4);
        let hasBackground = false;
        if (magic === "FATZ") {
            offset += 8;
            hasBackground = data.readUInt8(offset) !== 0;
            offset += 1;
        } else {
            offset = 0;
        }

        // Header
        const speed = data.readUInt32LE(offset); offset += 4;
        const palNameSize = data.readUInt32LE(offset); offset += 4;
        const palName = data.subarray(offset, offset + palNameSize).toString('utf8').replace(/\0/g, '');
        offset += palNameSize;
        const frameCount = data.readUInt32LE(offset); offset += 4;

        const totalFrames = hasBackground ? frameCount + 1 : frameCount;
        const frames: Frame[] = [];

        console.log(`Extractor: totalFrames=${totalFrames}, starting offset=${offset}, bufferLength=${data.length}`);

        for (let i = 0; i < totalFrames; i++) {
            const frameStart = offset;
            if (offset + 16 > data.length) {
                console.warn(`Extractor: Unexpected EOF at frame ${i}, offset ${offset}`);
                break;
            }
            const frameSize = data.readUInt32LE(offset); offset += 4;
            const height = data.readUInt16LE(offset); offset += 2;
            const width = data.readUInt16LE(offset); offset += 2;
            const y = data.readInt16LE(offset); offset += 2;
            const x = data.readInt16LE(offset); offset += 2;
            // Skip 2 bytes of unknown
            offset += 2;

            if (width === 0 || height === 0) {
                frames.push({ width, height, x, y, image: new Jimp(1, 1, 0x00000000) });
                offset = frameStart + 4 + frameSize; // Next frame
                continue;
            }

            const image = new Jimp(width, height, 0x00000000);
            
            for (let currentY = 0; currentY < height; currentY++) {
                if (offset >= data.length) break;
                const blockCount = data.readUInt8(offset); offset += 1;
                let currentX = 0;
                for (let b = 0; b < blockCount; b++) {
                    if (offset + 2 > data.length) break;
                    const blockOffset = data.readUInt8(offset); offset += 1;
                    const colorCount = data.readUInt8(offset); offset += 1;
                    
                    currentX += blockOffset;
                    for (let c = 0; c < colorCount; c++) {
                        if (offset >= data.length) break;
                        const colorIdx = data.readUInt8(offset); offset += 1;
                        const color = palette[colorIdx];
                        if (color && color.a > 0 && !(color.r === 255 && color.g === 0 && color.b === 255)) {
                            image.setPixelColor(Jimp.rgbaToInt(color.r, color.g, color.b, 255), currentX, currentY);
                        }
                        currentX++;
                    }
                }
            }

            frames.push({ width, height, x, y, image });
            // Align offset to next frame just in case
            offset = frameStart + 4 + frameSize;
        }

        return frames;
    }
}

import Jimp from 'jimp';
import { Color } from './palette';

export interface Frame {
    width: number;
    height: number;
    x: number;
    y: number;
    image: Jimp;
}

export interface GraphicHeader {
    speed: number;
    palName: string;
    frameCount: number;
    hasBackground: boolean;
    dataOffset: number;
}

export class Extractor {
    // Returns null when the buffer does not look like a ZT1 graphic.
    public static readHeader(data: Buffer): GraphicHeader | null {
        let offset = 0;
        let hasBackground = false;
        if (data.length < 12) return null;
        if (data.toString('utf8', 0, 4) === 'FATZ') {
            offset = 8;
            hasBackground = data.readUInt8(offset) !== 0;
            offset += 1;
        }
        if (offset + 12 > data.length) return null;
        const speed = data.readUInt32LE(offset); offset += 4;
        const palNameSize = data.readUInt32LE(offset); offset += 4;
        if (palNameSize <= 0 || palNameSize >= 260 || offset + palNameSize + 4 > data.length) return null;
        const palName = data.subarray(offset, offset + palNameSize).toString('utf8').replace(/\0/g, '');
        offset += palNameSize;
        if (!/\.pal$/i.test(palName)) return null;
        const frameCount = data.readUInt32LE(offset); offset += 4;
        if (frameCount > 20000) return null;
        return { speed, palName, frameCount, hasBackground, dataOffset: offset };
    }

    public static decode(data: Buffer, palette: Color[]): Frame[] {
        const header = Extractor.readHeader(data);
        if (!header) return [];
        const { frameCount, hasBackground } = header;
        let offset = header.dataOffset;

        const totalFrames = hasBackground ? frameCount + 1 : frameCount;
        const frames: Frame[] = [];

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

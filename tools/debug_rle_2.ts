
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
    
    // Analyze Frame 0 again
    // Offset 0x22: 39 00 (57)
    const dataStart = startOffset + 16;
    const end = startOffset + data.readUInt32LE(startOffset + 4);
    
    console.log("Analyzing first 50 bytes of Frame 0 data:");
    let debugStr = "";
    for(let i=0; i<50; i++) {
        debugStr += data[dataStart+i].toString(16).padStart(2,'0') + " ";
    }
    console.log(debugStr);
    
    // The previous log showed: 01 00 02 09 01 15 28 00 03 06 ...
    // My previous assumption: [Skip 1] [Draw 0] [Skip 2] [Draw 9]
    // Draw 9 pixels: 01 15 28 00 03 06 0b 1f 26
    
    // Let's try to map this to the visual "lines" we saw.
    // If we have "Skip 1" then "Draw 0", that seems redundant.
    // Maybe "00" is a special large skip?
    
    // Let's try a different RLE interpretation used in some old games:
    // If byte < 0x80: Skip N.
    // If byte >= 0x80: Draw (N - 0x80).
    
    // Or:
    // [Command Byte]
    // Bit 7: 0 = Skip, 1 = Draw
    // Bits 0-6: Count
    
    // Test: 01 (Skip 1). 00 (Skip 0??). 02 (Skip 2). 09 (Skip 9).
    // Test: 01 (Draw 1). 00 (Draw 0).
    
    // Wait, the "lines" artifact usually means we are drawing PIXELS where we should be SKIPPING transparent areas.
    // The "noise" looked like real colors (brown/tan for buffalo), just scattered.
    // This implies the [Color Bytes] are correct, but their placement is wrong.
    
    // What if the "Control Byte" is 2 bytes?
    // 01 00 -> 0x0001
    // 02 09 -> 0x0902 ??
    
    // Let's try one brute force visualizer:
    // Just draw EVERY byte as a pixel, wrapping at width 57.
    // If we see the buffalo distorted, we know it's uncompressed.
    // If we see noise, it's compressed.
    
    const imgRaw = new Jimp(57, 100, 0x00000000);
    let ptr = dataStart;
    let x = 0, y = 0;
    while(ptr < end && y < 100) {
        const val = data[ptr++];
        if (val !== 0) {
             const [r, g, b] = palette[val];
             imgRaw.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
        }
        x++;
        if (x >= 57) { x=0; y++; }
    }
    await imgRaw.writeAsync('web/public/assets/test/brute_raw.png');
    console.log("Saved brute_raw.png");
}

main().catch(console.error);

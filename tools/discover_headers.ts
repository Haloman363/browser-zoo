
import AdmZip from 'adm-zip';
import * as fs from 'fs';

const ZTD_PATH = 'Gamefiles/animals.ztd';
const ANIMAL_DIR = 'animals/afrbuf';

async function main() {
    const zip = new AdmZip(ZTD_PATH);
    const spriteEntry = zip.getEntries().find((e: any) => e.entryName === `${ANIMAL_DIR}/m/eat/E`);
    if (!spriteEntry) return;
    const data = spriteEntry.getData();

    const numFrames = data.readUInt32LE(0);
    const palPathLen = data.readUInt32LE(4);
    const startOffset = 8 + palPathLen;
    
    console.log(`NumFrames: ${numFrames}, StartOffset: ${startOffset}`);

    // Discovery: find all potential headers
    const potentialHeaders: number[] = [];
    for (let i = startOffset; i < data.length - 14; i++) {
        const totalSize = data.readUInt32LE(i + 2);
        if (totalSize > 50 && totalSize < 10000) {
            const offX = data.readUInt16LE(i + 6);
            const offY = data.readUInt16LE(i + 8);
            const anchorX = data.readUInt16LE(i + 10);
            const anchorY = data.readUInt16LE(i + 12);
            
            if (offX < 200 && offY < 200 && anchorX < 200 && anchorY < 200) {
                // Check if it's preceded by RLE end (usually 00)
                // or if it's the very first frame
                potentialHeaders.push(i);
            }
        }
    }

    console.log(`Found ${potentialHeaders.length} potential headers.`);
    for (let i = 0; i < Math.min(10, potentialHeaders.length); i++) {
        const h = potentialHeaders[i];
        console.log(`Potential Header @ 0x${h.toString(16)}: totalSize=${data.readUInt32LE(h + 2)}`);
    }
}

main().catch(console.error);

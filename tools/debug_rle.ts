
import AdmZip from 'adm-zip';

const ZTD_PATH = 'Gamefiles/animals.ztd';
const ANIMAL_DIR = 'animals/afrbuf';

async function main() {
    const zip = new AdmZip(ZTD_PATH);
    const spriteEntry = zip.getEntries().find((e: any) => e.entryName === `${ANIMAL_DIR}/m/eat/E`);
    if (!spriteEntry) return;
    const data = spriteEntry.getData();

    const palPathLen = data.readUInt32LE(4);
    const startOffset = 8 + palPathLen;
    
    console.log(`Frame 0 starts at 0x${startOffset.toString(16)}`);
    
    // Dump first 100 bytes of RLE data
    let offset = startOffset + 16; // skip header
    for (let i = 0; i < 20; i++) {
        const skip = data[offset++];
        const literal = data[offset++];
        console.log(`Chunk ${i}: Skip ${skip}, Literal ${literal}`);
        offset += literal;
    }
}

main().catch(console.error);

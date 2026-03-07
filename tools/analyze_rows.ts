
import AdmZip from 'adm-zip';

const ZTD_PATH = 'Gamefiles/animals.ztd';
const ANIMAL_DIR = 'animals/afrbuf';

async function main() {
    const zip = new AdmZip(ZTD_PATH);
    const data = zip.getEntries().find((e: any) => e.entryName === `${ANIMAL_DIR}/m/eat/E`)?.getData();
    if (!data) return;

    const startOffset = 8 + data.readUInt32LE(4);
    const frame0Header = 18;
    let ptr = startOffset + frame0Header;
    
    console.log("Analyzing Row Structure...");
    for (let i = 0; i < 10; i++) {
        const lineLen = data.readUInt16LE(ptr);
        const nextPtr = ptr + lineLen;
        console.log(`Line ${i}: Offset 0x${ptr.toString(16)}, Length ${lineLen}`);
        
        // Peek inside line
        let chunkPtr = ptr + 2;
        while (chunkPtr < nextPtr) {
            const skip = data[chunkPtr++];
            const literal = data[chunkPtr++];
            console.log(`  Chunk: Skip ${skip}, Literal ${literal}`);
            chunkPtr += literal;
        }
        
        ptr = nextPtr;
        if (ptr >= data.length) break;
    }
}

main().catch(console.error);

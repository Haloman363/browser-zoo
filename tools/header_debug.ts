
import AdmZip from 'adm-zip';

const ZTD_PATH = 'Gamefiles/animals.ztd';
const ANIMAL_DIR = 'animals/afrbuf';

async function main() {
    const zip = new AdmZip(ZTD_PATH);
    const data = zip.getEntries().find((e: any) => e.entryName === `${ANIMAL_DIR}/m/eat/E`)?.getData();
    if (!data) return;

    const startOffset = 8 + data.readUInt32LE(4);
    let ptr = startOffset;
    
    for (let f = 0; f < 10; f++) {
        const width = data.readUInt16LE(ptr);
        const height = data.readUInt16LE(ptr + 2);
        const totalSize = data.readUInt32LE(ptr + 4);
        
        console.log(`Frame ${f} @ 0x${ptr.toString(16)}: ${width}x${height} (Size: ${totalSize})`);
        
        if (totalSize > 0 && totalSize < 10000) {
            ptr += totalSize + 4; // Padding logic?
        } else {
            console.log("Invalid size, stopping.");
            break;
        }
    }
}

main().catch(console.error);


import AdmZip from 'adm-zip';

const ZTD_PATH = 'Gamefiles/animals.ztd';
const ANIMAL_DIR = 'animals/afrbuf';

async function main() {
    const zip = new AdmZip(ZTD_PATH);
    const data = zip.getEntries().find((e: any) => e.entryName === `${ANIMAL_DIR}/m/eat/E`)?.getData();
    if (!data) return;

    const startOffset = 8 + data.readUInt32LE(4);
    let ptr = startOffset;
    
    // Header is 16 bytes.
    // Let's dump the first few bytes of DATA (offset + 16)
    // to see if it matches [uint16 numChunks] or [uint8 skip][uint8 draw]
    
    console.log("Dumping Frame 0 Data Start (Offset 0x32):");
    ptr += 16;
    for (let i = 0; i < 20; i++) {
        process.stdout.write(data[ptr + i].toString(16).padStart(2, '0') + " ");
    }
    console.log("\n");
}

main().catch(console.error);

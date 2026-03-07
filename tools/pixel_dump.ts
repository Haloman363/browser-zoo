
import AdmZip from 'adm-zip';

const ZTD_PATH = 'Gamefiles/animals.ztd';
const ANIMAL_DIR = 'animals/afrbuf';

async function main() {
    const zip = new AdmZip(ZTD_PATH);
    const data = zip.getEntries().find((e: any) => e.entryName === `${ANIMAL_DIR}/m/eat/E`)?.getData();
    if (!data) return;

    const startOffset = 8 + data.readUInt32LE(4);
    let ptr = startOffset + 16;
    
    console.log("Raw Byte Dump (512 bytes):");
    let lineHex = "";
    let lineChar = "";
    for (let i = 0; i < 512; i++) {
        const b = data[ptr + i];
        lineHex += b.toString(16).padStart(2, '0') + " ";
        lineChar += (b > 31 && b < 127) ? String.fromCharCode(b) : ".";
        
        if ((i + 1) % 32 === 0) {
            console.log(`${lineHex} | ${lineChar}`);
            lineHex = "";
            lineChar = "";
        }
    }
}

main().catch(console.error);

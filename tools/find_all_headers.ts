
import AdmZip from 'adm-zip';

const ZTD_PATH = 'Gamefiles/animals.ztd';
const ANIMAL_DIR = 'animals/afrbuf';

async function main() {
    const zip = new AdmZip(ZTD_PATH);
    const data = zip.getEntries().find((e: any) => e.entryName === `${ANIMAL_DIR}/m/eat/E`)?.getData();
    if (!data) return;

    const startOffset = 8 + data.readUInt32LE(4);
    
    console.log("Scanning for headers...");
    for (let i = startOffset; i < data.length - 16; i++) {
        // Look for the 'Size' field at i+4 or i+6
        const s1 = data.readUInt32LE(i + 4);
        const s2 = data.readUInt32LE(i + 6);
        
        if ((s1 > 100 && s1 < 10000) || (s2 > 100 && s2 < 10000)) {
            // Check Offsets
            const ox1 = data.readUInt16LE(i + 8), oy1 = data.readUInt16LE(i + 10);
            const ox2 = data.readUInt16LE(i + 10), oy2 = data.readUInt16LE(i + 12);
            
            if ((ox1 < 200 && oy1 < 200) || (ox2 < 200 && oy2 < 200)) {
                console.log(`Found candidate header at 0x${i.toString(16)}: s1=${s1}, s2=${s2}`);
            }
        }
    }
}

main().catch(console.error);

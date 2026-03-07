
import AdmZip from 'adm-zip';

const ZTD_PATH = 'Gamefiles/animals.ztd';
const ANIMAL_DIR = 'animals/afrbuf';

async function main() {
    const zip = new AdmZip(ZTD_PATH);
    const data = zip.getEntries().find((e: any) => e.entryName === `${ANIMAL_DIR}/m/eat/E`)?.getData();
    if (!data) return;

    const startOffset = 8 + data.readUInt32LE(4);
    
    for (let i = startOffset; i < startOffset + 500; i++) {
        const val16 = data.readUInt16LE(i);
        if (val16 > 20 && val16 < 200) {
            console.log(`Potential numRows ${val16} at offset 0x${i.toString(16)}`);
        }
    }
}

main().catch(console.error);

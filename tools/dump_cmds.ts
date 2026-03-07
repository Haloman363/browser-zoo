
import AdmZip from 'adm-zip';

const ZTD_PATH = 'Gamefiles/animals.ztd';
const ANIMAL_DIR = 'animals/afrbuf';

async function main() {
    const zip = new AdmZip(ZTD_PATH);
    const data = zip.getEntries().find((e: any) => e.entryName === `${ANIMAL_DIR}/m/eat/E`)?.getData();
    if (!data) return;

    const startOffset = 8 + data.readUInt32LE(4);
    let ptr = startOffset + 16;
    
    console.log("Dumping Frame 0 Commands:");
    for (let i = 0; i < 50; i++) {
        const cmd = data[ptr++];
        const count = data[ptr++];
        process.stdout.write(`[${cmd}, ${count}] `);
        if (cmd === 2) {
            let pixStr = "Pix: ";
            for (let j = 0; j < count; j++) {
                pixStr += data[ptr++].toString(16).padStart(2, '0') + " ";
            }
            console.log(pixStr);
        } else {
            console.log("");
        }
        if (ptr >= data.length) break;
    }
}

main().catch(console.error);

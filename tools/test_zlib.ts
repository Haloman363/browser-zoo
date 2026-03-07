
import AdmZip from 'adm-zip';
import * as zlib from 'zlib';
import * as fs from 'fs';

const ZTD_PATH = 'Gamefiles/animals.ztd';
const ANIMAL_DIR = 'animals/afrbuf';

async function main() {
    const zip = new AdmZip(ZTD_PATH);
    const data = zip.getEntries().find((e: any) => e.entryName === `${ANIMAL_DIR}/m/eat/E`)?.getData();
    if (!data) return;

    const startOffset = 8 + data.readUInt32LE(4);
    const totalSize = data.readUInt32LE(startOffset + 4);
    const compressed = data.slice(startOffset + 16, startOffset + totalSize);

    try {
        const decompressed = zlib.inflateSync(compressed);
        console.log(`Decompressed successfully! Size: ${decompressed.length}`);
    } catch (e) {
        console.log("Not Zlib compressed.");
    }
}

main().catch(console.error);

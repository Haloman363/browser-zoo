
import AdmZip from 'adm-zip';

const ZTD_PATH = 'Gamefiles/animals.ztd';
const ANIMAL_DIR = 'animals/afrbuf';

async function main() {
    const zip = new AdmZip(ZTD_PATH);
    const data = zip.getEntries().find((e: any) => e.entryName === `${ANIMAL_DIR}/m/eat/E`)?.getData();
    if (!data) return;

    const startOffset = 8 + data.readUInt32LE(4);
    const dataStart = startOffset + 18;
    const end = startOffset + data.readUInt32LE(startOffset + 6); // Using the size from my latest discovery

    console.log("Scanning for 00 markers...");
    let last00 = dataStart;
    const gaps: number[] = [];
    for (let i = dataStart; i < end; i++) {
        if (data[i] === 0) {
            gaps.push(i - last00);
            last00 = i;
        }
    }
    
    console.log("Gaps between 00 markers:");
    console.log(gaps.slice(0, 20).join(", "));
    
    // Count frequencies
    const freq: {[key: number]: number} = {};
    for (const g of gaps) freq[g] = (freq[g] || 0) + 1;
    console.log("Gap frequencies:", freq);
}

main().catch(console.error);

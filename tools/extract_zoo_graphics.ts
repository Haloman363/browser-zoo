
import AdmZip from 'adm-zip';
import Jimp from 'jimp';
import * as fs from 'fs';
import * as path from 'path';

// --- Interfaces mirroring ApeCore structs ---

interface Header {
    speed: number;      // uint32
    palNameSize: number; // uint32
    palName: string;    // char[]
    frameCount: number; // uint32
}

interface PixelBlock {
    offset: number;     // uint8
    colorCount: number; // uint8
    colors: number[];   // uint8[] indices into palette
}

interface PixelSet {
    blockCount: number; // uint8
    blocks: PixelBlock[];
}

interface Frame {
    frameSize: number;  // uint32
    height: number;     // uint16
    width: number;      // uint16
    y: number;          // int16
    x: number;          // int16
    unk1: number;       // uint8
    unk2: number;       // uint8
    pixelSets: PixelSet[];
}

interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

// --- Constants ---

const MAGIC = "FATZ";

// --- Helper Functions ---

function readBuffer(buffer: Buffer, offset: number, length: number): Buffer {
    return buffer.subarray(offset, offset + length);
}

function parseIni(content: string): any {
    const lines = content.split(/\r?\n/);
    const result: any = {};
    let currentSection = "";

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) continue;

        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            currentSection = trimmed.slice(1, -1);
            result[currentSection] = result[currentSection] || {};
        } else if (trimmed.includes('=')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').trim();
            
            if (currentSection) {
                result[currentSection][key.trim()] = value;
            } else {
                result[key.trim()] = value;
            }
        }
    }
    return result;
}

// --- Main Class ---

class ZooExtractor {
    zips: { name: string, zip: AdmZip }[] = [];
    colors: Color[] = [];
    frames: Frame[] = [];
    header: Header | null = null;
    hasBackground: boolean = false;
    palLocation: string = "";

    constructor(inputPath: string) {
        if (fs.statSync(inputPath).isDirectory()) {
            this.scanDir(inputPath);
        } else {
            this.zips.push({ name: path.basename(inputPath), zip: new AdmZip(inputPath) });
        }
    }

    scanDir(dirPath: string) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            if (file.endsWith('.ztd')) {
                const fullPath = path.join(dirPath, file);
                console.log(`Adding archive: ${file}`);
                this.zips.push({ name: file, zip: new AdmZip(fullPath) });
            }
        }
    }

    // Read palette from any zip
    readPalette(palPath: string): boolean {
        for (const { zip } of this.zips) {
            const entry = zip.getEntry(palPath);
            if (entry) {
                const data = entry.getData();
                let offset = 0;
                const colorCount = data.readUInt16LE(offset);
                offset += 4; // Skip count and 2 extra bytes

                console.log(`Reading palette: ${palPath}, Color count: ${colorCount}`);
                this.colors = [];
                for (let i = 0; i < colorCount; i++) {
                    const r = data.readUInt8(offset);
                    const g = data.readUInt8(offset + 1);
                    const b = data.readUInt8(offset + 2);
                    this.colors.push({ r, g, b, a: 255 });
                    offset += 4;
                }
                while (this.colors.length < 256) this.colors.push({ r: 0, g: 0, b: 0, a: 0 });
                return true;
            }
        }
        return false;
    }

    decodeGraphic(zip: AdmZip, graphicPath: string, outputDir: string) {
        const entry = zip.getEntry(graphicPath);
        if (!entry) return;
        
        const data = entry.getData();
        let offset = 0;

        const magic = data.toString('utf8', 0, 4);
        if (magic === MAGIC) {
            offset += 8;
            this.hasBackground = data.readUInt8(offset) !== 0;
            offset += 1;
        } else {
            offset = 0;
        }

        const speed = data.readUInt32LE(offset); offset += 4;
        const palNameSize = data.readUInt32LE(offset); offset += 4;
        const palName = data.subarray(offset, offset + palNameSize).toString('utf8').replace(/\0/g, '');
        offset += palNameSize;
        const frameCount = data.readUInt32LE(offset); offset += 4;

        let totalFrames = this.hasBackground ? frameCount + 1 : frameCount;
        if (!this.readPalette(palName)) {
             const basePal = path.basename(palName);
             if (!this.readPalette(basePal)) {
                 this.colors = [];
                 for(let i=0; i<256; i++) this.colors.push({r:i, g:i, b:i, a:255});
             }
        }

        this.frames = [];
        for (let i = 0; i < totalFrames; i++) {
            const frameSize = data.readUInt32LE(offset); offset += 4;
            const height = data.readUInt16LE(offset); offset += 2;
            const width = data.readUInt16LE(offset); offset += 2;
            const y = data.readInt16LE(offset); offset += 2;
            const x = data.readInt16LE(offset); offset += 2;
            offset += 2; // unk1, unk2

            const pixelSets: PixelSet[] = [];
            for (let row = 0; row < height; row++) {
                const blockCount = data.readUInt8(offset); offset += 1;
                const blocks: PixelBlock[] = [];
                for (let b = 0; b < blockCount; b++) {
                    const blockOffset = data.readUInt8(offset); offset += 1;
                    const colorCount = data.readUInt8(offset); offset += 1;
                    const blockColors: number[] = [];
                    for (let c = 0; c < colorCount; c++) {
                        blockColors.push(data.readUInt8(offset)); offset += 1;
                    }
                    blocks.push({ offset: blockOffset, colorCount, colors: blockColors });
                }
                pixelSets.push({ blockCount, blocks });
            }
            this.frames.push({ frameSize, height, width, y, x, unk1: 0, unk2: 0, pixelSets });
        }

        const baseName = path.basename(graphicPath, path.extname(graphicPath));
        const outDir = path.join(outputDir, baseName);
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        this.frames.forEach((frame, index) => this.saveFrame(frame, index, outDir, baseName));
    }

    async saveFrame(frame: Frame, index: number, outDir: string, baseName: string) {
        if (frame.width === 0 || frame.height === 0) return;
        const image = new Jimp(frame.width, frame.height, 0x00000000);
        for (let y = 0; y < frame.height; y++) {
            if (y >= frame.pixelSets.length) break;
            const row = frame.pixelSets[y];
            let currentX = 0;
            for (const block of row.blocks) {
                currentX += block.offset;
                for (const colorIndex of block.colors) {
                    if (currentX >= frame.width) break;
                    const color = this.colors[colorIndex] || { r: 255, g: 0, b: 255, a: 255 };
                    image.setPixelColor(Jimp.rgbaToInt(color.r, color.g, color.b, 255), currentX, y);
                    currentX++;
                }
            }
        }
        const filename = `${baseName}_${index.toString().padStart(3, '0')}.png`;
        await image.writeAsync(path.join(outDir, filename));
    }

    extractMetadata(zip: AdmZip, ucaPath: string, outputDir: string) {
        const entry = zip.getEntry(ucaPath);
        if (!entry) return;
        const data = parseIni(entry.getData().toString('utf8'));
        const metadata = {
            id: path.basename(ucaPath, path.extname(ucaPath)),
            name: data['member']?.cName || data['member']?.cCodeName || "Unknown",
            description: data['member']?.cLongHelp || "No description",
            family: data['member']?.cFamily || "Unknown",
            raw: data 
        };
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(path.join(outputDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
    }

    extractAll(outputRoot: string) {
        const whitelist = ['afrbuf', 'gorilla'];

        // 1. Metadata pass
        for (const { zip } of this.zips) {
            for (const entry of zip.getEntries()) {
                const ext = path.extname(entry.entryName).toLowerCase();
                if (ext === '.uca' || ext === '.ai') {
                    const baseName = path.basename(entry.entryName, ext);
                    if (whitelist.includes(baseName)) {
                        console.log(`Extracting metadata for ${baseName} from ${entry.entryName}`);
                        this.extractMetadata(zip, entry.entryName, path.join(outputRoot, baseName));
                    }
                }
            }
        }

        // 2. Graphics pass
        for (const { zip } of this.zips) {
            for (const entry of zip.getEntries()) {
                if (entry.isDirectory) continue;
                const entryName = entry.entryName;
                const whitelistedAnimal = whitelist.find(w => entryName.includes(`animals/${w}/`));
                
                if (whitelistedAnimal) {
                    const ext = path.extname(entryName).toLowerCase();
                    if (['.pal', '.uca', '.ani', '.ai'].includes(ext)) continue;
                    
                    // console.log(`Extracting graphic: ${entryName}`);
                    this.decodeGraphic(zip, entryName, path.join(outputRoot, whitelistedAnimal));
                    this.frames = [];
                }
            }
        }
    }
}

// --- Run ---

const ztdPath = process.argv[2];
const outPath = process.argv[3] || './extracted_zoo';

if (!ztdPath) {
    console.log("Usage: ts-node extract_zoo_graphics.ts <path_to_ztd> [output_dir]");
    process.exit(1);
}

const extractor = new ZooExtractor(ztdPath);
extractor.extractAll(outPath);

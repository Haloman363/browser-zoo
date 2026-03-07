import * as fs from 'fs';
import * as path from 'path';
import { ArchiveManager } from './lib/archive';
import { PaletteResolver } from './lib/palette';
import { Extractor } from './lib/extractor';

const GAME_FILES_DIR = 'Gamefiles';
const OUTPUT_ROOT = 'web/public/assets';

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
            if (currentSection) result[currentSection][key.trim()] = value;
            else result[key.trim()] = value;
        }
    }
    return result;
}

async function extractAnimal(am: ArchiveManager, id: string) {
    console.log(`\n--- Extracting ${id} ---`);
    const outDir = path.join(OUTPUT_ROOT, id);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // 1. Metadata
    const metadataPaths = [
        `animals/${id}/${id}.uca`, `animals/${id}/${id}.ai`, `animals/${id}.ai`, `animals/${id}.uca`,
        `scenery/building/${id}.ai`, `scenery/other/${id}.ai`, `fences/${id}.ai`, `guests/${id}.ai`, `staff/${id}.ai`
    ];
    for (const metaPath of metadataPaths) {
        if (am.hasFile(metaPath)) {
            const data = am.getFile(metaPath);
            if (data) {
                const parsed = parseIni(data.toString('utf8'));
                const metadata = {
                    id: id,
                    name: parsed['member']?.cName || parsed['member']?.cCodeName || id,
                    description: parsed['member']?.cLongHelp || "",
                    family: parsed['member']?.cFamily || "Unknown",
                };
                fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
                break;
            }
        }
    }

    // 2. Palette
    const palettePaths = [
        `animals/${id}/${id}.pal`, `animals/${id}.pal`, `objects/${id}/i.pal`, `objects/${id}/${id}.pal`,
        `fences/${id}/${id}.pal`, `guests/guests.pal`, `staff/${id}.pal`, `staff/lsmkeepr/lsmkeepr.pal`
    ];
    let palette = PaletteResolver.getGrayscale();
    for (const palPath of palettePaths) {
        if (am.hasFile(palPath)) {
            const palData = am.getFile(palPath);
            if (palData) { palette = PaletteResolver.parse(palData); break; }
        }
    }

    // 3. Graphics
    const graphicFiles = am.listFiles(f => {
        return f.startsWith(`objects/${id}/`) || f.startsWith(`animals/${id}/`) || 
               f.startsWith(`fences/${id}/`) || f.startsWith(`guests/${id}/`) || f.startsWith(`staff/${id}/`);
    }).filter(f => !['.uca', '.ai', '.ani', '.pal', '.wav', '.txt'].includes(path.extname(f).toLowerCase()));

    console.log(`  Found ${graphicFiles.length} graphics.`);
    for (const graphicPath of graphicFiles) {
        if (graphicPath.endsWith('/')) continue;
        const graphicData = am.getFile(graphicPath);
        if (graphicData) {
            try {
                const frames = Extractor.decode(graphicData, palette);
                let relativeDir = path.dirname(graphicPath);
                relativeDir = relativeDir.replace(/^(animals|objects|fences|guests|staff)\//, '');
                relativeDir = relativeDir.replace(id, '').replace(/^\//, '');
                const outSubDir = path.join(outDir, relativeDir);
                if (!fs.existsSync(outSubDir)) fs.mkdirSync(outSubDir, { recursive: true });
                for (let i = 0; i < frames.length; i++) {
                    const frame = frames[i];
                    if (frame.width === 0 || frame.height === 0) continue;
                    const filename = `${path.basename(graphicPath)}_${i.toString().padStart(3, '0')}.png`;
                    await frame.image.writeAsync(path.join(outSubDir, filename));
                }
            } catch (err) {}
        }
    }
}

async function main() {
    const targetId = process.argv[2];
    if (!targetId) {
        console.error("Usage: ts-node master_extract_v2.ts <animalId>");
        process.exit(1);
    }
    const am = new ArchiveManager(GAME_FILES_DIR);
    await extractAnimal(am, targetId);
    console.log(`\nExtraction of ${targetId} complete!`);
}

main().catch(console.error);

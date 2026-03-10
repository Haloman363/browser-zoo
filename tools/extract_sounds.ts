import * as fs from 'fs';
import * as path from 'path';
import { ArchiveManager } from './lib/archive';

const GAME_FILES_DIR = 'Gamefiles';
const OUTPUT_ROOT = 'web/public/assets/sounds';

const WHITELIST = [
    'afrbuf', 'gorilla', 'lion', 'tiger', 'chimpanz', 'eleph', 'giraffe', 'hippo', 'ostrich', 'zebra',
    'gallim', 'plateo', 'asieleph', 'bongo', 'yeti', 'baracuda', 'reindeer', 'mtnlion', 'llama', 'blckbuck',
    'bigfoot', 'mexwolf', 'lochness', 'wilddog', 'asblckbr', 'komodo', 'megath'
];

async function main() {
    const am = new ArchiveManager(GAME_FILES_DIR);
    if (!fs.existsSync(OUTPUT_ROOT)) fs.mkdirSync(OUTPUT_ROOT, { recursive: true });

    // 1. Extract general sounds from sounds.ztd
    console.log("Extracting general sounds...");
    const generalSounds = [
        'sounds/crwdloop.wav',
        'sounds/zbirds.wav',
        'sounds/zleaves.wav',
        'sounds/zwind.wav',
        'sounds/Forest1.wav',
        'sounds/Sea1.wav'
    ];

    for (const s of generalSounds) {
        if (am.hasFile(s)) {
            const data = am.getFile(s);
            if (data) {
                fs.writeFileSync(path.join(OUTPUT_ROOT, path.basename(s)), data);
            }
        }
    }

    // 2. Extract animal sounds
    console.log("Extracting animal sounds...");
    for (const id of WHITELIST) {
        // Search for WAVs in animal folders
        // Many animals have sounds like animals/afrbuf/afrbuf1.wav
        // We'll search by prefix
        const animalPathPrefix = `animals/${id}/`;
        const files = am.listFiles(f => f.startsWith(animalPathPrefix) && f.toLowerCase().endsWith('.wav'));
        
        if (files.length > 0) {
            console.log(`  Found ${files.length} sounds for ${id}`);
            const animalSoundDir = path.join(OUTPUT_ROOT, id);
            if (!fs.existsSync(animalSoundDir)) fs.mkdirSync(animalSoundDir, { recursive: true });
            
            for (const f of files) {
                const data = am.getFile(f);
                if (data) {
                    fs.writeFileSync(path.join(animalSoundDir, path.basename(f)), data);
                }
            }
        }
    }

    console.log("Sound extraction complete.");
}

main().catch(console.error);

import * as fs from 'fs';
import { ArchiveManager } from './lib/archive';
import { PaletteResolver } from './lib/palette';
import { Extractor } from './lib/extractor';
import * as path from 'path';

const GAME_FILES_DIR = 'Gamefiles';
const OUTPUT_ROOT = 'web/public/assets/ui/icons';

const WHITELIST = [
    'afrbuf', 'gorilla', 'lion', 'tiger', 'chimpanz', 'eleph', 'giraffe', 'hippo', 'ostrich', 'zebra',
    'gallim', 'plateo', 'asieleph', 'bongo', 'yeti', 'baracuda', 'reindeer', 'mtnlion', 'llama', 'blckbuck',
    'maint', 'guide'
];

const PATH_OVERRIDES: Record<string, string> = {
    'gorilla': 'animals/gorilla/plgorill/N',
    'chimpanz': 'animals/chimp/plchimp/N',
    'eleph': 'animals/elephant/plele/N',
    'giraffe': 'animals/giraffe/plgiraff/N',
    'ostrich': 'animals/ostrich/plostric/N',
    'asieleph': 'animals/asianele/plasiane/N',
    'yeti': 'animals/B101B026/plyeti/N',
    'baracuda': 'animals/baracuda/m/ssubswim/N',
    'reindeer': 'animals/reindeer/plmreind/N',
    'mtnlion': 'animals/mntnlion/plmntnli/N',
    'blckbuck': 'animals/blckbuck/plblckbu/N',
    'maint': 'staff/icmmaint/N',
    'guide': 'staff/icmguide/N'
};

async function main() {
    const am = new ArchiveManager(GAME_FILES_DIR);
    if (!fs.existsSync(OUTPUT_ROOT)) fs.mkdirSync(OUTPUT_ROOT, { recursive: true });

    for (const id of WHITELIST) {
        let iconPath = PATH_OVERRIDES[id] || `animals/${id}/pl${id}/N`;
        
        console.log(`Extracting icon for ${id} from ${iconPath}...`);
        
        let palette = PaletteResolver.getGrayscale();
        
        // Find best palette
        const possiblePalettes = [
            path.dirname(iconPath) + '/' + path.basename(path.dirname(iconPath)) + '.pal',
            path.dirname(iconPath) + '/../' + path.basename(path.dirname(path.dirname(iconPath))) + '.pal',
            `animals/${id}/${id}.pal`,
            `animals/${id}/pl${id}/pl${id}.pal`
        ];

        for (const p of possiblePalettes) {
            if (am.hasFile(p)) {
                const palData = am.getFile(p);
                if (palData) {
                    palette = PaletteResolver.parse(palData);
                    break;
                }
            }
        }

        if (am.hasFile(iconPath)) {
            const data = am.getFile(iconPath);
            if (data) {
                try {
                    const frames = Extractor.decode(data, palette);
                    if (frames.length > 0) {
                        // For baracuda (which isn't a pl icon), it might have many frames. Just pick middle one.
                        const frameIdx = id === 'baracuda' ? Math.floor(frames.length / 2) : 0;
                        await frames[frameIdx].image.writeAsync(path.join(OUTPUT_ROOT, `${id}.png`));
                    }
                } catch (err) {
                    console.error(`  Error decoding icon for ${id}: ${err}`);
                }
            }
        } else {
            console.warn(`  Icon file not found: ${iconPath}`);
        }
    }
}

main().catch(console.error);

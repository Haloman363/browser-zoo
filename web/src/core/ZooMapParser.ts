import { TerrainType } from './TerrainManager';
import { PathType } from './PathManager';

// ZT1 .zoo save format (verified against all 93 shipped maps):
//   "TZFB" + version u32 + language u32 + [campaign u32 if version > 71]
//   + width u32 + height u32 + entranceX u32 + entranceY u32 + exhibitCount u32
//   + variable exhibit/unknown data
//   + terrain: width*height 10-byte elements (i32 elevation, u8 shape, u8 type, i32 unknown), row-major
//   + u32 objectCount
//   + objects: [str category][str subcategory][str code][u32 restLen]
//              [rest: i32 unk, i32 x, i32 y, i32 height, i32 rotation, ...] (coords are tile*64)
// The exhibit block size varies by version, so the terrain window is anchored from the object
// list instead: objectStart = first size-prefixed category string, count at objectStart-4.
// Format notes: https://docs.google.com/document/d/1w2NlAkmT3iTLBfcJNMU0a3j5YoQWIHc7MArm4_xrI3I

export interface MapEntity {
    id: string;
    x: number;
    y: number;
    type: 'animal' | 'fence' | 'scenery';
    side?: 'n' | 'e' | 's' | 'w';
}

export interface ParsedMap {
    width: number;
    height: number;
    terrain: number[];
    paths: number[];
    entities: MapEntity[];
    entrance: { x: number, y: number };
}

// Engine grid is fixed 75x75; larger originals are cropped, smaller ones padded with grass
const GRID = 75;

const OBJECT_CATEGORIES = ['animals', 'fences', 'objects', 'building', 'paths', 'ambient', 'scenery', 'guests', 'staff', 'items'];

// ZT1 terrain type byte -> our TerrainType
const TERRAIN_MAP: Record<number, TerrainType> = {
    0x00: TerrainType.Grass,      0x01: TerrainType.Savannah,
    0x02: TerrainType.Sand,       0x03: TerrainType.Dirt,
    0x04: TerrainType.Rainforest, 0x05: TerrainType.BrownStone,
    0x06: TerrainType.GrayStone,  0x07: TerrainType.Gravel,
    0x08: TerrainType.Snow,       0x09: TerrainType.Water,
    0x0A: TerrainType.SaltWater,  0x0B: TerrainType.Deciduous,
    0x0C: TerrainType.Water,      // waterfall
    0x0D: TerrainType.Coniferous, 0x0E: TerrainType.Concrete,
    0x0F: TerrainType.Asphalt,    0x10: TerrainType.Trampled,
    0x11: TerrainType.GrayStone   // gunite
};

const PATH_MAP: Record<string, PathType> = {
    path: PathType.Tan,
    asphpath: PathType.Asphalt,
    brkpath: PathType.Brick,
    dirtpath: PathType.Dirt,
    stnepath: PathType.Stone
};

// ZT1 fence codes -> our three extracted fence assets (closest look)
const FENCE_MAP: Record<string, string> = {
    castiron: 'castiron',
    zoowall: 'bricklow', dwall: 'bricklow', lwhedge: 'bricklow', smrock: 'bricklow',
    wpicket: 'chaincon', wrail: 'chaincon', postrope: 'chaincon'
};

// ZT1 foliage/building codes -> our extracted scenery (closest look); unmapped codes are skipped
const SCENERY_MAP: Record<string, string> = {
    palm: 'acacia', shrtpalm: 'acacia',
    kapok: 'baobob', sigillar: 'baobob',
    fir: 'birch', cfir: 'birch', pine: 'birch', lodgpine: 'birch',
    wspruce: 'birch', westceda: 'birch', wrcedar: 'birch', pineshrb: 'birch',
    bush2: 'bamboo', bush4: 'bamboo', foxtail: 'bamboo', wtrlily: 'bamboo', ppear: 'bamboo',
    flower5: 'cherry', flower6: 'cherry', flower7: 'cherry',
    bench: 'bench', picnic2: 'bench'
};

// ZT1 species codes -> our whitelisted animal assets
const ANIMAL_MAP: Record<string, string> = {
    lion: 'lion', tiger: 'tiger', giraffe: 'giraffe', zebra: 'zebra',
    ostrich: 'ostrich', hippo: 'hippo', chimp: 'chimpanz', gorilla: 'gorilla',
    afrbuf: 'afrbuf', eleph: 'eleph', llama: 'llama', reindeer: 'reindeer',
    mtnlion: 'mtnlion', komodo: 'komodo', mexwolf: 'mexwolf'
};

export class ZooMapParser {
    public static parse(data: ArrayBuffer): ParsedMap {
        const bytes = new Uint8Array(data);
        const view = new DataView(data);

        if (String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== 'TZFB') {
            throw new Error('Invalid .zoo file header');
        }
        const version = view.getUint32(4, true);
        let off = 12;
        if (version > 71) off += 4; // campaign field
        const srcW = view.getUint32(off, true);
        const srcH = view.getUint32(off + 4, true);
        const entX = view.getUint32(off + 8, true);
        const entY = view.getUint32(off + 12, true);
        console.log(`[ZooMapParser] v${version} ${srcW}x${srcH} entrance=(${entX},${entY})`);

        // Anchor the terrain window from the object list
        const objStart = this.findObjectStart(bytes);
        if (objStart < 0) throw new Error('Object list not found');
        const objCount = view.getUint32(objStart - 4, true);
        const terrainStart = objStart - 4 - srcW * srcH * 10;
        if (terrainStart < 0) throw new Error('Terrain window out of bounds');

        // Crop/pad the source map into our fixed grid, keeping the entrance in view
        const cropX = Math.max(0, Math.min(srcW - GRID, entX - Math.floor(GRID / 2)));
        const cropY = Math.max(0, Math.min(srcH - GRID, entY - Math.floor(GRID / 2)));

        const terrain: number[] = new Array(GRID * GRID).fill(TerrainType.Grass);
        for (let y = 0; y < GRID; y++) {
            for (let x = 0; x < GRID; x++) {
                const sx = x + cropX, sy = y + cropY;
                if (sx >= srcW || sy >= srcH) continue;
                const t = bytes[terrainStart + (sy * srcW + sx) * 10 + 5];
                terrain[y * GRID + x] = TERRAIN_MAP[t] ?? TerrainType.Grass;
            }
        }

        const paths: number[] = new Array(GRID * GRID).fill(PathType.None);
        const entities: MapEntity[] = [];

        let o = objStart;
        for (let i = 0; i < objCount; i++) {
            const cat = this.readString(bytes, view, o); o = cat.next;
            const sub = this.readString(bytes, view, o); o = sub.next;
            const code = this.readString(bytes, view, o); o = code.next;
            const restLen = view.getUint32(o, true); o += 4;
            const x = Math.floor(view.getInt32(o + 4, true) / 64) - cropX;
            const y = Math.floor(view.getInt32(o + 8, true) / 64) - cropY;
            const rot = view.getInt32(o + 16, true);
            o += restLen;

            if (x < 0 || x >= GRID || y < 0 || y >= GRID) continue;

            if (cat.str === 'paths') {
                paths[y * GRID + x] = PATH_MAP[code.str] ?? PathType.Tan;
            } else if (cat.str === 'fences') {
                const id = FENCE_MAP[sub.str];
                const side = ({ 0: 'n', 2: 'e', 4: 's', 6: 'w' } as const)[rot as 0 | 2 | 4 | 6];
                if (id && side) entities.push({ id, x, y, type: 'fence', side });
            } else if (cat.str === 'objects' || cat.str === 'building') {
                const id = SCENERY_MAP[code.str];
                if (id) entities.push({ id, x, y, type: 'scenery' });
            } else if (cat.str === 'animals') {
                const id = ANIMAL_MAP[sub.str];
                if (id) entities.push({ id, x, y, type: 'animal' });
            }
            // ambient birds, guests, staff etc. are skipped
        }

        console.log(`[ZooMapParser] ${objCount} objects -> ${entities.length} entities, ${paths.filter(p => p !== PathType.None).length} path tiles`);
        return {
            width: GRID, height: GRID, terrain, paths, entities,
            entrance: {
                x: Math.max(0, Math.min(GRID - 1, entX - cropX)),
                y: Math.max(0, Math.min(GRID - 1, entY - cropY))
            }
        };
    }

    // The object list starts at the earliest size-prefixed category string
    private static findObjectStart(bytes: Uint8Array): number {
        let best = -1;
        for (const cat of OBJECT_CATEGORIES) {
            const pat = new Uint8Array(4 + cat.length);
            pat[0] = cat.length; // lengths are < 256 so the u32 prefix is [len,0,0,0]
            for (let i = 0; i < cat.length; i++) pat[4 + i] = cat.charCodeAt(i);
            const idx = this.indexOf(bytes, pat, 32);
            if (idx >= 0 && (best < 0 || idx < best)) best = idx;
        }
        return best;
    }

    private static indexOf(haystack: Uint8Array, needle: Uint8Array, from: number): number {
        outer: for (let i = from; i <= haystack.length - needle.length; i++) {
            for (let j = 0; j < needle.length; j++) {
                if (haystack[i + j] !== needle[j]) continue outer;
            }
            return i;
        }
        return -1;
    }

    private static readString(bytes: Uint8Array, view: DataView, offset: number): { str: string, next: number } {
        const len = view.getUint32(offset, true);
        if (len > 64) throw new Error(`Implausible string length ${len} at ${offset}`);
        let str = '';
        for (let i = 0; i < len; i++) str += String.fromCharCode(bytes[offset + 4 + i]);
        return { str, next: offset + 4 + len };
    }
}

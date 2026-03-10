import { TerrainType } from './TerrainManager';
import { PathType } from './PathManager';

export interface ParsedMap {
    width: number;
    height: number;
    terrain: number[];
    paths: number[];
    entities: { id: string, x: number, y: number, type: string }[];
}

export class ZooMapParser {
    public static parse(data: Buffer): ParsedMap {
        const header = data.toString('utf8', 0, 5);
        if (header !== 'TZFBF') throw new Error("Invalid .zoo file header");

        const width = data.readUInt32LE(12);
        const height = data.readUInt32LE(16);
        console.log(`[ZooMapParser] Map size: ${width}x${height}`);

        const terrain: number[] = new Array(width * height).fill(0);
        const paths: number[] = new Array(width * height).fill(0);
        const entities: { id: string, x: number, y: number, type: string }[] = [];

        // Grid starts at 0x20C0 for most maps
        const gridOffset = 0x20C0;
        for (let i = 0; i < width * height; i++) {
            const offset = gridOffset + i * 10;
            if (offset + 10 > data.length) break;
            
            // Byte 0: Terrain
            // Byte 1: Path
            terrain[i] = this.mapTerrain(data[offset]);
            paths[i] = this.mapPath(data[offset + 1]);
        }

        // Entity Scanner
        this.scanEntities(data, entities, gridOffset + width * height * 10);

        return { width, height, terrain, paths, entities };
    }

    private static mapTerrain(original: number): number {
        // Original ZT1 terrain mapping (approximate)
        switch (original) {
            case 0: return TerrainType.Grass;
            case 1: return TerrainType.Sand;
            case 2: return TerrainType.Dirt;
            case 3: return TerrainType.Water;
            case 4: return TerrainType.Rock;
            case 5: return TerrainType.Snow;
            default: return TerrainType.Grass;
        }
    }

    private static mapPath(original: number): number {
        if (original === 0xFF || original === 0) return PathType.None;
        // Map original path IDs to our internal PathType
        if (original < 5) return PathType.Asphalt;
        if (original < 10) return PathType.Brick;
        return PathType.Dirt;
    }

    private static scanEntities(data: Buffer, entities: any[], startOffset: number) {
        const knownTypes = [
            { marker: 'animals', type: 'animal' },
            { marker: 'fences', type: 'fence' },
            { marker: 'building', type: 'scenery' },
            { marker: 'objects', type: 'scenery' },
            { marker: 'staff', type: 'staff' }
        ];
        
        // Scan the remainder of the file for entity blocks
        for (let offset = startOffset; offset < data.length - 100; offset++) {
            for (const kt of knownTypes) {
                if (data.slice(offset, offset + kt.marker.length).toString() === kt.marker) {
                    // Marker found! Scan forward for IDs and coordinates
                    let searchLimit = Math.min(offset + 500, data.length - 20);
                    for (let j = offset + kt.marker.length; j < searchLimit; j++) {
                        // Look for 0x01 separator followed by a likely ID
                        if (data[j] === 0x01 && data[j+1] >= 97 && data[j+1] <= 122) {
                            const id = this.readString(data, j + 1);
                            if (id && id.length > 2) {
                                // Try to find coordinates in the following bytes
                                // In TZFBF, coords are often at fixed offsets from the ID string start
                                // For animals/objects: X at +24, Y at +28 (relative to j+1)
                                try {
                                    const x = data.readInt32LE(j + 25);
                                    const y = data.readInt32LE(j + 29);
                                    
                                    const tileX = Math.floor(x / 32);
                                    const tileY = Math.floor(y / 32);

                                    if (tileX >= 0 && tileX < 150 && tileY >= 0 && tileY < 150) {
                                        entities.push({ id, x: tileX, y: tileY, type: kt.type });
                                    }
                                } catch (e) {}
                                j += id.length + 1; // Skip the ID
                            }
                        }
                    }
                    offset += 200; // Jump ahead after processing block
                    break;
                }
            }
        }
    }

    private static readString(data: Buffer, offset: number): string {
        let str = "";
        for (let i = offset; i < offset + 32; i++) {
            if (data[i] === 0) break;
            if (data[i] >= 32 && data[i] <= 126) str += String.fromCharCode(data[i]);
            else break;
        }
        return str;
    }
}

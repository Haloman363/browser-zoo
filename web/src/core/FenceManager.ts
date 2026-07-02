import * as THREE from 'three';
import { PX_TO_WORLD, fixSpriteTexture } from '../utils/spriteLoader';

export interface Edge {
    x: number;
    y: number;
    side: 'n' | 'e' | 's' | 'w';
}

export class FenceManager {
    private fenceSprites: Map<string, THREE.Sprite> = new Map();
    private fenceData: Map<string, string> = new Map(); // "x,y,side" -> fenceId
    private textureCache: Map<string, THREE.Texture> = new Map();

    constructor(private scene: THREE.Scene) {}

    public async placeFence(x: number, y: number, side: 'n' | 'e' | 's' | 'w', fenceId: string) {
        const key = `${x},${y},${side}`;
        if (this.fenceData.has(key)) return;

        // ZT1 fences have ne, nw, se, sw views; flat edges use 'se' or 'sw'.
        let view = 'se';
        if (side === 'n' || side === 's') view = 'sw';

        // Load texture BEFORE committing data so a failed load doesn't leave an invisible wall
        const texture = await this.getTexture(fenceId, view);
        this.fenceData.set(key, fenceId);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));

        const worldPos = this.getEdgeWorldPos(x, y, side);
        const scale = PX_TO_WORLD;
        const img = texture.image;
        sprite.scale.set(img.width * scale, img.height * scale, 1);
        sprite.position.set(worldPos.x, (img.height * scale) / 2, worldPos.z);
        
        // Z-sorting: Fences on North edges are "further away"
        sprite.renderOrder = Math.floor(worldPos.z * 100);

        this.scene.add(sprite);
        this.fenceSprites.set(key, sprite);
    }

    private async getTexture(id: string, view: string): Promise<THREE.Texture> {
        const cacheKey = `${id}:${view}`;
        if (this.textureCache.has(cacheKey)) return this.textureCache.get(cacheKey)!;

        const url = `/assets/${id}/f/idle/${view}_000.png`;
        let tex = await new THREE.TextureLoader().loadAsync(url);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex = fixSpriteTexture(tex);
        this.textureCache.set(cacheKey, tex);
        return tex;
    }

    private getEdgeWorldPos(x: number, y: number, side: 'n' | 'e' | 's' | 'w'): THREE.Vector3 {
        const tileSize = 2;
        const halfW = (75 * tileSize) / 2;
        const halfH = (75 * tileSize) / 2;
        const cx = x * tileSize - halfW + tileSize / 2;
        const cz = y * tileSize - halfH + tileSize / 2;

        if (side === 'n') return new THREE.Vector3(cx, 0, cz - tileSize / 2);
        if (side === 's') return new THREE.Vector3(cx, 0, cz + tileSize / 2);
        if (side === 'e') return new THREE.Vector3(cx + tileSize / 2, 0, cz);
        return new THREE.Vector3(cx - tileSize / 2, 0, cz);
    }

    public isEdgeBlocked(x: number, y: number, side: 'n' | 'e' | 's' | 'w'): boolean {
        return this.fenceData.has(`${x},${y},${side}`);
    }

    // Removes all fences on the given tile's edges; returns true if any were removed
    public removeFencesAt(x: number, y: number): boolean {
        let removed = false;
        for (const side of ['n', 'e', 's', 'w']) {
            const key = `${x},${y},${side}`;
            if (this.fenceData.delete(key)) {
                const sprite = this.fenceSprites.get(key);
                if (sprite) {
                    this.scene.remove(sprite);
                    this.fenceSprites.delete(key);
                }
                removed = true;
            }
        }
        return removed;
    }

    public reset() {
        this.fenceSprites.forEach(s => this.scene.remove(s));
        this.fenceSprites.clear();
        this.fenceData.clear();
    }

    public serialize() {
        return Array.from(this.fenceData.entries()).map(([key, id]) => {
            const [x, y, side] = key.split(',');
            return { x: parseInt(x), y: parseInt(y), side, id };
        });
    }
}

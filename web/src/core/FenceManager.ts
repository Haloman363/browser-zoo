import * as THREE from 'three';

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

        this.fenceData.set(key, fenceId);
        
        // ZT1 fences usually have ne, nw, se, sw views. 
        // We'll map our n, e, s, w to these.
        // For a flat edge, we'll use 'se' or 'sw' depending on orientation.
        let view = 'se';
        if (side === 'n' || side === 's') view = 'sw';
        
        const texture = await this.getTexture(fenceId, view);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
        
        const worldPos = this.getEdgeWorldPos(x, y, side);
        const scale = 0.4;
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

        const url = `/assets/${id}/f/idle/${view}/${view}_000.png`;
        const tex = await new THREE.TextureLoader().loadAsync(url);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
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

    public serialize() {
        return Array.from(this.fenceData.entries()).map(([key, id]) => {
            const [x, y, side] = key.split(',');
            return { x: parseInt(x), y: parseInt(y), side, id };
        });
    }
}


import * as THREE from 'three';
import { Pathfinder, Tile, BlockedCheck } from '../core/Pathfinder';

export interface AnimalMetadata {
    id: string;
    name: string;
    description: string;
    family: string;
}

interface AnimationState {
    materials: THREE.SpriteMaterial[];
    frameDuration: number;
}

export class AnimalManager {
    private metadataCache: Map<string, AnimalMetadata> = new Map();
    private animationCache: Map<string, Record<string, AnimationState>> = new Map();
    private loadingPromises: Map<string, Promise<void>> = new Map();
    private pathfinder: Pathfinder = new Pathfinder(75, 75);

    constructor(private scene: THREE.Scene) {}

    async loadAnimal(id: string, animation: string = 'walk'): Promise<void> {
        const cacheKey = `${id}:${animation}`;
        if (this.loadingPromises.has(cacheKey)) return this.loadingPromises.get(cacheKey);
        
        const promise = (async () => {
            const directions = ['n', 'ne', 'e', 'se', 's'];
            const anims: Record<string, AnimationState> = {};
            const texLoader = new THREE.TextureLoader();

            for (const dir of directions) {
                const frames: THREE.SpriteMaterial[] = [];
                let frameIndex = 0;
                while (frameIndex < 256) {
                    const frameNum = frameIndex.toString().padStart(3, '0');
                    const url = `/assets/${id}/m/${animation}/${dir}/${dir}_${frameNum}.png`;
                    try {
                        const check = await fetch(url, { method: 'HEAD' }); 
                        if (!check.ok) break;
                        const texture = await texLoader.loadAsync(url);
                        texture.magFilter = THREE.NearestFilter;
                        texture.minFilter = THREE.NearestFilter;
                        frames.push(new THREE.SpriteMaterial({ map: texture, transparent: true }));
                        frameIndex++;
                    } catch (e) { break; }
                }
                if (frames.length > 0) {
                    anims[dir.toUpperCase()] = { materials: frames, frameDuration: 1000 / 12 };
                }
            }

            const mirrorMap: Record<string, string> = { 'SW': 'SE', 'W': 'E', 'NW': 'NE' };
            for (const [target, source] of Object.entries(mirrorMap)) {
                if (anims[source]) {
                    const sourceState = anims[source];
                    const mirroredMats = sourceState.materials.map(mat => {
                        const tex = mat.map!.clone();
                        tex.wrapS = THREE.RepeatWrapping;
                        tex.repeat.x = -1; 
                        tex.offset.x = 1; 
                        return new THREE.SpriteMaterial({ map: tex, transparent: true });
                    });
                    anims[target] = { materials: mirroredMats, frameDuration: sourceState.frameDuration };
                }
            }
            this.animationCache.set(cacheKey, anims);
        })();

        this.loadingPromises.set(cacheKey, promise);
        return promise;
    }

    createInstance(id: string, animation: string = 'walk', startTile?: Tile): AnimalInstance | null {
        const cacheKey = `${id}:${animation}`;
        const anims = this.animationCache.get(cacheKey);
        if (!anims) return null;
        return new AnimalInstance(id, anims, this.scene, this.pathfinder, startTile);
    }
}

export class AnimalInstance {
    public sprite: THREE.Sprite;
    public happiness: number = 60;
    private currentDir: string = 'S';
    private currentFrame: number = 0;
    private lastFrameTime: number = 0;
    
    private currentTile: Tile;
    private path: Tile[] = [];
    private moveSpeed: number = 0.05;
    private lerpAlpha: number = 0;

    constructor(
        public id: string, 
        private animations: Record<string, AnimationState>,
        scene: THREE.Scene,
        private pathfinder: Pathfinder,
        startTile: Tile = { x: 37, y: 37 }
    ) {
        this.currentTile = { ...startTile };
        const startMat = this.animations[this.currentDir]?.materials[0] || new THREE.SpriteMaterial({ color: 0xff0000 });
        this.sprite = new THREE.Sprite(startMat);
        scene.add(this.sprite);
    }

    setPosition(x: number, y: number, z: number) {
        const scale = 0.4;
        const img = this.sprite.material.map?.image;
        if (img) {
            this.sprite.scale.set(img.width * scale, img.height * scale, 1);
            this.sprite.position.set(x, y + (img.height * scale) / 2, z);
            this.sprite.renderOrder = Math.floor(z * 100); 
        } else {
            this.sprite.position.set(x, y, z);
        }
    }

    public setHappiness(val: number) {
        this.happiness = Math.max(0, Math.min(100, val));
    }

    setDirection(dir: string) {
        if (this.animations[dir]) {
            this.currentDir = dir;
            if (this.currentFrame >= this.animations[dir].materials.length) {
                this.currentFrame = 0;
            }
        }
    }

    private updateDirection(from: Tile, to: Tile) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        let dir = 'S';
        if (dx > 0 && dy > 0) dir = 'SE';
        else if (dx > 0 && dy < 0) dir = 'NE';
        else if (dx < 0 && dy > 0) dir = 'SW';
        else if (dx < 0 && dy < 0) dir = 'NW';
        else if (dx > 0) dir = 'E';
        else if (dx < 0) dir = 'W';
        else if (dy > 0) dir = 'S';
        else if (dy < 0) dir = 'N';
        this.setDirection(dir);
    }

    public walkTo(target: Tile, isEdgeBlocked: BlockedCheck) {
        this.path = this.pathfinder.findPath(this.currentTile, target, isEdgeBlocked);
        if (this.path.length > 0) {
            this.path.shift(); 
        }
    }

    update(time: number, isEdgeBlocked: BlockedCheck, getExhibitAt: (x: number, y: number) => number) {
        const anim = this.animations[this.currentDir];
        if (!anim) return;

        // 1. Movement Logic
        if (this.path.length > 0) {
            const nextTile = this.path[0];
            this.updateDirection(this.currentTile, nextTile);

            this.lerpAlpha += this.moveSpeed;
            if (this.lerpAlpha >= 1) {
                this.currentTile = nextTile;
                this.path.shift();
                this.lerpAlpha = 0;
            }

            const p1 = this.getTileWorldPos(this.currentTile);
            const p2 = this.path.length > 0 ? this.getTileWorldPos(this.path[0]) : p1;
            const x = p1.x + (p2.x - p1.x) * this.lerpAlpha;
            const z = p1.z + (p2.z - p1.z) * this.lerpAlpha;
            this.setPosition(x, 0, z);
        } else {
            // Idle/Wander Logic
            if (Math.random() < 0.005) { 
                const tx = Math.floor(Math.max(0, Math.min(74, this.currentTile.x + (Math.random() * 10 - 5))));
                const ty = Math.floor(Math.max(0, Math.min(74, this.currentTile.y + (Math.random() * 10 - 5))));
                
                // Only wander if the target is in the same exhibit
                if (getExhibitAt(tx, ty) === getExhibitAt(this.currentTile.x, this.currentTile.y)) {
                    this.walkTo({ x: tx, y: ty }, isEdgeBlocked);
                }
            }
        }

        // 2. Animation Logic
        if (time - this.lastFrameTime > anim.frameDuration) {
            this.currentFrame = (this.currentFrame + 1) % anim.materials.length;
            this.sprite.material = anim.materials[this.currentFrame];
            this.lastFrameTime = time;
            this.setPosition(this.sprite.position.x, 0, this.sprite.position.z);
        }
    }

    private getTileWorldPos(tile: Tile): THREE.Vector3 {
        const tileSize = 2;
        const halfW = (75 * tileSize) / 2;
        const halfH = (75 * tileSize) / 2;
        return new THREE.Vector3(
            tile.x * tileSize - halfW + tileSize / 2,
            0,
            tile.y * tileSize - halfH + tileSize / 2
        );
    }
}

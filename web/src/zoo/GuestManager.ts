import * as THREE from 'three';
import { Pathfinder, Tile, BlockedCheck } from '../core/Pathfinder';
import { PathManager } from '../core/PathManager';

interface AnimationState {
    materials: THREE.SpriteMaterial[];
    frameDuration: number;
}

export class GuestInstance {
    public sprite: THREE.Sprite;
    public happiness: number = 75;
    public thoughts: string[] = [];
    private currentDir: string = 'S';
    private currentFrame: number = 0;
    private lastFrameTime: number = 0;
    
    private currentTile: Tile;
    private path: Tile[] = [];
    private moveSpeed: number = 0.06;
    private lerpAlpha: number = 0;

    constructor(
        public type: 'man' | 'woman', 
        private animations: Record<string, AnimationState>,
        scene: THREE.Scene,
        private pathfinder: Pathfinder,
        startTile: Tile
    ) {
        this.currentTile = { ...startTile };
        const startMat = this.animations[this.currentDir]?.materials[0] || new THREE.SpriteMaterial({ color: 0x00ff00 });
        this.sprite = new THREE.Sprite(startMat);
        scene.add(this.sprite);
        this.thoughts.push("Just arrived at the zoo!");
    }

    setPosition(x: number, y: number, z: number) {
        const scale = 0.35;
        const img = this.sprite.material.map?.image;
        if (img) {
            this.sprite.scale.set(img.width * scale, img.height * scale, 1);
            this.sprite.position.set(x, y + (img.height * scale) / 2, z);
            this.sprite.renderOrder = Math.floor(z * 100); 
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
        if (this.animations[dir]) this.currentDir = dir;
    }

    public walkTo(target: Tile, isEdgeBlocked: BlockedCheck) {
        this.path = this.pathfinder.findPath(this.currentTile, target, isEdgeBlocked);
        if (this.path.length > 0) this.path.shift();
    }

    update(time: number, isEdgeBlocked: BlockedCheck, pathManager: PathManager, animals: any[]) {
        const anim = this.animations[this.currentDir];
        if (!anim) return;

        if (this.path.length > 0) {
            const nextTile = this.path[0];
            this.updateDirection(this.currentTile, nextTile);
            this.lerpAlpha += this.moveSpeed;
            if (this.lerpAlpha >= 1) {
                this.currentTile = nextTile;
                this.path.shift();
                this.lerpAlpha = 0;
                this.checkNearbyAnimals(animals);
            }
            const p1 = this.getTileWorldPos(this.currentTile);
            const p2 = this.path.length > 0 ? this.getTileWorldPos(this.path[0]) : p1;
            this.setPosition(p1.x + (p2.x - p1.x) * this.lerpAlpha, 0, p1.z + (p2.z - p1.z) * this.lerpAlpha);
        } else {
            if (Math.random() < 0.01) {
                const target = this.findRandomPathTile(pathManager);
                if (target) this.walkTo(target, isEdgeBlocked);
                else if (Math.random() < 0.1) this.thoughts.push("I wish there were more paths here.");
            }
        }

        if (time - this.lastFrameTime > anim.frameDuration) {
            this.currentFrame = (this.currentFrame + 1) % anim.materials.length;
            this.sprite.material = anim.materials[this.currentFrame];
            this.lastFrameTime = time;
            this.setPosition(this.sprite.position.x, 0, this.sprite.position.z);
        }
    }

    private checkNearbyAnimals(animals: any[]) {
        animals.forEach(a => {
            const dist = Math.sqrt(Math.pow(a.tileX - this.currentTile.x, 2) + Math.pow(a.tileY - this.currentTile.y, 2));
            if (dist < 5 && Math.random() < 0.05) {
                this.thoughts.push(`Look at that ${a.id}!`);
                if (this.thoughts.length > 5) this.thoughts.shift();
                this.happiness = Math.min(100, this.happiness + 2);
            }
        });
    }

    private findRandomPathTile(pathManager: PathManager): Tile | null {
        for (let i = 0; i < 20; i++) {
            const tx = Math.floor(Math.max(0, Math.min(74, this.currentTile.x + (Math.random() * 20 - 10))));
            const ty = Math.floor(Math.max(0, Math.min(74, this.currentTile.y + (Math.random() * 20 - 10))));
            if (pathManager.hasPath(tx, ty)) return { x: tx, y: ty };
        }
        return null;
    }

    private getTileWorldPos(tile: Tile): THREE.Vector3 {
        const tileSize = 2;
        return new THREE.Vector3(tile.x * tileSize - 75 + 1, 0, tile.y * tileSize - 75 + 1);
    }
}

export class GuestManager {
    public guests: GuestInstance[] = [];
    private animationCache: Map<string, Record<string, AnimationState>> = new Map();

    constructor(private scene: THREE.Scene, private pathfinder: Pathfinder) {}

    public async init() {
        await this.loadGuestType('man');
        await this.loadGuestType('woman');
    }

    private async loadGuestType(type: string) {
        const directions = ['n', 'ne', 'e', 'se', 's'];
        const anims: Record<string, AnimationState> = {};
        const texLoader = new THREE.TextureLoader();
        for (const dir of directions) {
            const frames: THREE.SpriteMaterial[] = [];
            let frameIndex = 0;
            while (frameIndex < 32) {
                const url = `/assets/${type}/walk/${dir}/${dir}_${frameIndex.toString().padStart(3, '0')}.png`;
                try {
                    const check = await fetch(url, { method: 'HEAD' });
                    if (!check.ok) break;
                    const tex = await texLoader.loadAsync(url);
                    tex.magFilter = THREE.NearestFilter;
                    tex.minFilter = THREE.NearestFilter;
                    frames.push(new THREE.SpriteMaterial({ map: tex, transparent: true }));
                    frameIndex++;
                } catch (e) { break; }
            }
            if (frames.length > 0) anims[dir.toUpperCase()] = { materials: frames, frameDuration: 1000/12 };
        }
        const mirrorMap: Record<string, string> = { 'SW': 'SE', 'W': 'E', 'NW': 'NE' };
        for (const [target, source] of Object.entries(mirrorMap)) {
            if (anims[source]) {
                const mirrored = anims[source].materials.map(m => {
                    const t = m.map!.clone();
                    t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1;
                    return new THREE.SpriteMaterial({ map: t, transparent: true });
                });
                anims[target] = { materials: mirrored, frameDuration: anims[source].frameDuration };
            }
        }
        this.animationCache.set(type, anims);
    }

    public spawnGuest(x: number, y: number) {
        const type = Math.random() > 0.5 ? 'man' : 'woman';
        const anims = this.animationCache.get(type);
        if (anims) {
            const guest = new GuestInstance(type as any, anims, this.scene, this.pathfinder, { x, y });
            this.guests.push(guest);
        }
    }

    public update(time: number, isEdgeBlocked: BlockedCheck, pathManager: PathManager, animals: any[]) {
        this.guests.forEach(g => g.update(time, isEdgeBlocked, pathManager, animals));
        if (this.guests.length < 10 && Math.random() < 0.01) {
            this.spawnGuest(37, 37);
        }
    }
}

import * as THREE from 'three';
import { Pathfinder, Tile, BlockedCheck } from '../core/Pathfinder';
import { AudioManager } from '../core/AudioManager';
import { VisualEffectManager } from '../core/VisualEffectManager';
import { loadDirectionalAnims, AnimationState, PX_TO_WORLD } from '../utils/spriteLoader';

export interface AnimalMetadata {
    id: string;
    name: string;
    description: string;
    family: string;
}

export class AnimalManager {
    private metadataCache: Map<string, AnimalMetadata> = new Map();
    private animationCache: Map<string, Record<string, AnimationState>> = new Map();
    private loadingPromises: Map<string, Promise<void>> = new Map();
    private pathfinder: Pathfinder = new Pathfinder(75, 75);

    constructor(public scene: THREE.Scene, private audioManager?: AudioManager) {}

    async loadAnimal(id: string, animation: string = 'walk'): Promise<void> {
        const cacheKey = `${id}:${animation}`;
        if (this.loadingPromises.has(cacheKey)) return this.loadingPromises.get(cacheKey);
        
        const promise = (async () => {
            // Load sounds if not already loaded
            if (this.audioManager) {
                const filenames = [1, 2, 3, 4, 5].map(n => `${id}${n}.wav`);
                await this.audioManager.loadAnimalSounds(id, filenames);
            }

            const anims = await loadDirectionalAnims(`/assets/${id}/m/${animation}`);
            this.animationCache.set(cacheKey, anims);
        })();

        // Drop failed loads from the cache so a transient error doesn't poison retries
        promise.catch(() => this.loadingPromises.delete(cacheKey));
        this.loadingPromises.set(cacheKey, promise);
        return promise;
    }

    createInstance(id: string, animation: string = 'walk', startTile?: Tile): AnimalInstance | null {
        const cacheKey = `${id}:${animation}`;
        const anims = this.animationCache.get(cacheKey);
        if (!anims || Object.keys(anims).length === 0) return null;
        return new AnimalInstance(id, anims, this.scene, this.pathfinder, startTile);
    }

    public reset() {
        // Handled by EditorManager
    }
}

export class AnimalInstance {
    public sprite: THREE.Sprite;
    public shadow: THREE.Mesh;
    public happiness: number = 60;
    public hunger: number = 0;
    public energy: number = 100;
    public health: number = 100;
    public currentTile: Tile;

    private currentDir: string = 'S';
    private currentFrame: number = 0;
    private lastFrameTime: number = 0;
    private path: Tile[] = [];
    private moveSpeed: number = 0.05;
    private lerpAlpha: number = 0;

    constructor(
        public id: string, 
        private animations: Record<string, AnimationState>,
        private scene: THREE.Scene,
        private pathfinder: Pathfinder,
        startTile: Tile = { x: 37, y: 37 }
    ) {
        this.currentTile = { ...startTile };
        const startMat = this.animations[this.currentDir]?.materials[0] || new THREE.SpriteMaterial({ color: 0xff0000 });
        this.sprite = new THREE.Sprite(startMat);
        this.scene.add(this.sprite);

        // Add shadow
        const shadowGeo = new THREE.PlaneGeometry(2, 1);
        const shadowMat = new THREE.MeshBasicMaterial({ 
            map: VisualEffectManager.getShadowTexture(), 
            transparent: true, 
            depthWrite: false 
        });
        this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
        this.shadow.rotation.x = -Math.PI / 2;
        this.shadow.position.y = 0.01;
        this.scene.add(this.shadow);
    }

    setPosition(x: number, y: number, z: number) {
        const scale = PX_TO_WORLD;
        const img = this.sprite.material.map?.image;
        if (img) {
            this.sprite.scale.set(img.width * scale, img.height * scale, 1);
            this.sprite.position.set(x, y + (img.height * scale) / 2, z);
            this.sprite.renderOrder = Math.floor(z * 100);

            // Sync shadow
            this.shadow.position.set(x, 0.01, z);
            this.shadow.scale.set(img.width * scale * 0.6, img.width * scale * 0.6, 1);
        } else {
            this.sprite.position.set(x, y, z);
            this.shadow.position.set(x, 0.01, z);
        }
    }

    public setHappiness(val: number) {
        this.happiness = Math.max(0, Math.min(100, val));
    }

    public feed() {
        this.hunger = 0;
        this.happiness = Math.min(100, this.happiness + 10);
    }

    public heal() {
        this.health = 100;
        this.happiness = Math.min(100, this.happiness + 20);
    }

    public rest() {
        this.energy = 100;
    }

    public destroy() {
        this.scene.remove(this.sprite);
        this.scene.remove(this.shadow);
        if (this.sprite.material.map) this.sprite.material.map.dispose();
        this.sprite.material.dispose();
        this.shadow.geometry.dispose();
        (this.shadow.material as THREE.Material).dispose();
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

    update(time: number, isEdgeBlocked: BlockedCheck, getExhibitAt: (x: number, y: number) => number, audioManager?: AudioManager) {
        const anim = this.animations[this.currentDir];
        if (!anim) return;

        // 1. Update Needs
        this.hunger += 0.005;
        this.energy -= 0.003;
        if (this.hunger > 80) this.happiness -= 0.01;
        if (this.energy < 20) this.happiness -= 0.005;

        // 2. Movement Logic
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
            if (Math.random() < 0.005 && this.energy > 30) { 
                const tx = Math.floor(Math.max(0, Math.min(74, this.currentTile.x + (Math.random() * 10 - 5))));
                const ty = Math.floor(Math.max(0, Math.min(74, this.currentTile.y + (Math.random() * 10 - 5))));
                
                if (getExhibitAt(tx, ty) === getExhibitAt(this.currentTile.x, this.currentTile.y)) {
                    this.walkTo({ x: tx, y: ty }, isEdgeBlocked);
                }
            }
        }

        // 3. Audio Logic (Random Sounds)
        if (audioManager && Math.random() < 0.001) {
            audioManager.playAnimalSound(this.id, this.sprite.position);
        }

        // 4. Animation Logic
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

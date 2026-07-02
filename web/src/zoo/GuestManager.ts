import * as THREE from 'three';
import { Pathfinder, Tile, BlockedCheck } from '../core/Pathfinder';
import { PathManager } from '../core/PathManager';
import { VisualEffectManager } from '../core/VisualEffectManager';
import { loadDirectionalAnims, AnimationState, PX_TO_WORLD } from '../utils/spriteLoader';

export type GuestState = 'wandering' | 'seeking_food' | 'seeking_drink' | 'seeking_restroom' | 'seeking_rest' | 'seeking_trash' | 'leaving';

export class GuestInstance {
    public sprite: THREE.Sprite;
    public shadow: THREE.Mesh;
    public happiness: number = 75;
    public hunger: number = 0;
    public thirst: number = 0;
    public bathroom: number = 0;
    public energy: number = 100;
    public trash: number = 0;
    public thoughts: string[] = [];
    
    private state: GuestState = 'wandering';
    private currentDir: string = 'S';
    private currentFrame: number = 0;
    private lastFrameTime: number = 0;
    
    private currentTile: Tile;
    private path: Tile[] = [];
    private moveSpeed: number = 0.06;
    private lerpAlpha: number = 0;
    private waitStartTime: number = 0;

    constructor(
        public type: 'man' | 'woman', 
        private animations: Record<string, AnimationState>,
        private scene: THREE.Scene,
        private pathfinder: Pathfinder,
        startTile: Tile
    ) {
        this.currentTile = { ...startTile };
        const startMat = this.animations[this.currentDir]?.materials[0] || new THREE.SpriteMaterial({ color: 0x00ff00 });
        this.sprite = new THREE.Sprite(startMat);
        scene.add(this.sprite);
        this.thoughts.push("Just arrived at the zoo!");

        const shadowGeo = new THREE.PlaneGeometry(1.2, 0.6);
        const shadowMat = new THREE.MeshBasicMaterial({ 
            map: VisualEffectManager.getShadowTexture(), 
            transparent: true, 
            depthWrite: false 
        });
        this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
        this.shadow.rotation.x = -Math.PI / 2;
        this.shadow.position.y = 0.01;
        this.scene.add(this.shadow);

        const p = this.getTileWorldPos(this.currentTile);
        this.setPosition(p.x, 0, p.z);
    }

    setPosition(x: number, y: number, z: number) {
        const scale = PX_TO_WORLD;
        const img = this.sprite.material.map?.image;
        if (img) {
            this.sprite.scale.set(img.width * scale, img.height * scale, 1);
            this.sprite.position.set(x, y + (img.height * scale) / 2, z);
            this.sprite.renderOrder = Math.floor(z * 100);
        } else {
            this.sprite.position.set(x, y + 0.5, z);
        }
        this.shadow.position.set(x, 0.01, z);
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

    update(time: number, isEdgeBlocked: BlockedCheck, pathManager: PathManager, animals: any[], buildings: any[], onConcessionPurchase: () => void) {
        const anim = this.animations[this.currentDir];
        if (!anim) return;

        // 1. Update Needs
        this.hunger += 0.01;
        this.thirst += 0.015;
        this.bathroom += 0.008;
        this.energy -= 0.005;
        this.trash += 0.005;

        if (this.state === 'wandering' && (this.hunger > 50 || this.thirst > 50 || this.energy < 40 || this.trash > 60)) {
            this.updateState(buildings, isEdgeBlocked);
        }

        // 2. State Machine
        if (this.state === 'seeking_rest' && this.path.length === 0) {
            if (time - this.waitStartTime > 5000) { // Rest for 5s
                this.energy = 100;
                this.state = 'wandering';
                this.addThought("Feeling much better now.");
            }
            return;
        }

        if (this.path.length > 0) {
            const nextTile = this.path[0];
            this.updateDirection(this.currentTile, nextTile);
            this.lerpAlpha += this.moveSpeed;
            if (this.lerpAlpha >= 1) {
                this.currentTile = nextTile;
                this.path.shift();
                this.lerpAlpha = 0;
                this.checkNearbyAnimals(animals);
                this.checkArrivedAtTarget(buildings, onConcessionPurchase, time);
            }
            const p1 = this.getTileWorldPos(this.currentTile);
            const p2 = this.path.length > 0 ? this.getTileWorldPos(this.path[0]) : p1;
            this.setPosition(p1.x + (p2.x - p1.x) * this.lerpAlpha, 0, p1.z + (p2.z - p1.z) * this.lerpAlpha);
        } else {
            if (Math.random() < 0.01) {
                // Prefer paths; wander nearby grass if none around (so gate guests don't freeze)
                const target = this.findRandomPathTile(pathManager) || {
                    x: Math.floor(Math.max(0, Math.min(74, this.currentTile.x + (Math.random() * 12 - 6)))),
                    y: Math.floor(Math.max(0, Math.min(74, this.currentTile.y + (Math.random() * 12 - 6))))
                };
                this.walkTo(target, isEdgeBlocked);
            }
        }

        // 3. Animation
        if (time - this.lastFrameTime > anim.frameDuration) {
            this.currentFrame = (this.currentFrame + 1) % anim.materials.length;
            this.sprite.material = anim.materials[this.currentFrame];
            this.lastFrameTime = time;
            this.setPosition(this.sprite.position.x, 0, this.sprite.position.z);
        }
    }

    private updateState(buildings: any[], isEdgeBlocked: BlockedCheck) {
        if (this.energy < 40) {
            const bench = buildings.find(b => b.id.includes('bench'));
            if (bench) {
                this.state = 'seeking_rest';
                this.addThought("I need to find a place to sit down.");
                this.walkTo({ x: bench.tileX, y: bench.tileY }, isEdgeBlocked);
                return;
            }
        }

        if (this.trash > 60) {
            const can = buildings.find(b => b.id.includes('trash') || b.id.includes('bin'));
            if (can) {
                this.state = 'seeking_trash';
                this.addThought("Looking for a trash can.");
                this.walkTo({ x: can.tileX, y: can.tileY }, isEdgeBlocked);
                return;
            }
        }

        if (this.hunger > 70) {
            const stand = buildings.find(b => b.id.includes('burger') || b.id.includes('hotdog'));
            if (stand) {
                this.state = 'seeking_food';
                this.addThought("I'm hungry! Looking for food.");
                this.walkTo({ x: stand.tileX, y: stand.tileY }, isEdgeBlocked);
            }
        } else if (this.thirst > 70) {
            const stand = buildings.find(b => b.id.includes('drink') || b.id.includes('soda'));
            if (stand) {
                this.state = 'seeking_drink';
                this.addThought("So thirsty...");
                this.walkTo({ x: stand.tileX, y: stand.tileY }, isEdgeBlocked);
            }
        }
    }

    private checkArrivedAtTarget(buildings: any[], onConcessionPurchase: () => void, time: number) {
        if (this.path.length > 0) return;

        if (this.state === 'seeking_food') {
            this.hunger = 0; this.trash += 20; this.state = 'wandering';
            this.addThought("Yum! That burger was great.");
            this.happiness = Math.min(100, this.happiness + 10);
            onConcessionPurchase();
        } else if (this.state === 'seeking_drink') {
            this.thirst = 0; this.trash += 10; this.state = 'wandering';
            this.addThought("Refreshing!");
            this.happiness = Math.min(100, this.happiness + 10);
            onConcessionPurchase();
        } else if (this.state === 'seeking_rest') {
            this.waitStartTime = time;
            this.addThought("Taking a break.");
        } else if (this.state === 'seeking_trash') {
            this.trash = 0; this.state = 'wandering';
            this.addThought("There we go, all clean.");
            this.happiness = Math.min(100, this.happiness + 5);
        }
    }

    private addThought(t: string) {
        this.thoughts.push(t);
        if (this.thoughts.length > 5) this.thoughts.shift();
    }

    private checkNearbyAnimals(animals: any[]) {
        animals.forEach(a => {
            const dist = Math.sqrt(Math.pow(a.tileX - this.currentTile.x, 2) + Math.pow(a.tileY - this.currentTile.y, 2));
            if (dist < 5 && Math.random() < 0.05) {
                this.addThought(`Look at that ${a.id}!`);
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

    public destroy() {
        this.scene.remove(this.sprite);
        this.scene.remove(this.shadow);
        if (this.sprite.material.map) this.sprite.material.map.dispose();
        this.sprite.material.dispose();
        this.shadow.geometry.dispose();
        (this.shadow.material as THREE.Material).dispose();
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
        this.animationCache.set(type, await loadDirectionalAnims(`/assets/${type}/walk`, 32));
    }

    // Called whenever a new guest enters the zoo (pays admission at the gate, like ZT1)
    public onAdmission: () => void = () => {};

    // Where new guests appear; scenario maps set this to the zoo entrance
    public entrance = { x: 37, y: 74 };

    public spawnGuest(x: number, y: number) {
        const type = Math.random() > 0.5 ? 'man' : 'woman';
        const anims = this.animationCache.get(type);
        if (anims && Object.keys(anims).length > 0) {
            const guest = new GuestInstance(type as any, anims, this.scene, this.pathfinder, { x, y });
            this.guests.push(guest);
            this.onAdmission();
        }
    }

    public update(time: number, isEdgeBlocked: BlockedCheck, pathManager: PathManager, animals: any[], buildings: any[], onConcessionPurchase: () => void) {
        this.guests.forEach(g => g.update(time, isEdgeBlocked, pathManager, animals, buildings, onConcessionPurchase));
        // Guests only show up when the zoo has animals; they enter at the zoo entrance
        if (this.guests.length < 10 && animals.length > 0 && Math.random() < 0.01) {
            this.spawnGuest(this.entrance.x, this.entrance.y);
        }
    }

    public reset() {
        this.guests.forEach(g => g.destroy());
        this.guests = [];
    }
}

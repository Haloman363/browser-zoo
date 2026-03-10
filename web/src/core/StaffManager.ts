import * as THREE from 'three';
import { Pathfinder, Tile, BlockedCheck } from '../core/Pathfinder';
import { VisualEffectManager } from './VisualEffectManager';

interface AnimationState {
    materials: THREE.SpriteMaterial[];
    frameDuration: number;
}

export type StaffType = 'keeper' | 'maint' | 'guide';

export abstract class StaffInstance {
    public sprite: THREE.Sprite;
    public shadow: THREE.Mesh;
    public currentTile: Tile;
    protected currentDir: string = 'S';
    protected currentFrame: number = 0;
    protected lastFrameTime: number = 0;
    
    protected path: Tile[] = [];
    protected moveSpeed: number = 0.07;
    protected lerpAlpha: number = 0;

    constructor(
        protected animations: Record<string, AnimationState>,
        protected scene: THREE.Scene,
        protected pathfinder: Pathfinder,
        startTile: Tile
    ) {
        this.currentTile = { ...startTile };
        const startMat = this.animations[this.currentDir]?.materials[0] || new THREE.SpriteMaterial({ color: 0xcccccc });
        this.sprite = new THREE.Sprite(startMat);
        scene.add(this.sprite);

        // Add shadow
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
    }

    setPosition(x: number, y: number, z: number) {
        const scale = 0.35;
        const img = this.sprite.material.map?.image;
        if (img) {
            this.sprite.scale.set(img.width * scale, img.height * scale, 1);
            this.sprite.position.set(x, y + (img.height * scale) / 2, z);
            this.sprite.renderOrder = Math.floor(z * 100); 
            
            // Sync shadow
            this.shadow.position.set(x, 0.01, z);
        }
    }

    protected updateDirection(from: Tile, to: Tile) {
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

    protected getTileWorldPos(tile: Tile): THREE.Vector3 {
        const tileSize = 2;
        const halfW = (75 * tileSize) / 2;
        const halfH = (75 * tileSize) / 2;
        return new THREE.Vector3(
            tile.x * tileSize - halfW + tileSize / 2,
            0,
            tile.y * tileSize - halfH + tileSize / 2
        );
    }

    public destroy() {
        this.scene.remove(this.sprite);
        this.scene.remove(this.shadow);
        if (this.sprite.material.map) this.sprite.material.map.dispose();
        this.sprite.material.dispose();
        this.shadow.geometry.dispose();
        (this.shadow.material as THREE.Material).dispose();
    }

    abstract update(time: number, isEdgeBlocked: BlockedCheck, editorManager: any): void;
}

export type KeeperState = 'wandering' | 'moving_to_exhibit' | 'performing_task';

export class KeeperInstance extends StaffInstance {
    private state: KeeperState = 'wandering';
    private targetExhibit: number | null = null;
    private taskStartTime: number = 0;

    update(time: number, isEdgeBlocked: BlockedCheck, editorManager: any) {
        const anim = this.animations[this.currentDir];
        if (!anim) return;

        if (this.state === 'performing_task') {
            if (time - this.taskStartTime > 3000) {
                this.completeTask(editorManager);
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
                if (this.path.length === 0 && this.state === 'moving_to_exhibit') {
                    this.state = 'performing_task';
                    this.taskStartTime = time;
                }
            }
            const p1 = this.getTileWorldPos(this.currentTile);
            const p2 = this.path.length > 0 ? this.getTileWorldPos(this.path[0]) : p1;
            this.setPosition(p1.x + (p2.x - p1.x) * this.lerpAlpha, 0, p1.z + (p2.z - p1.z) * this.lerpAlpha);
        } else {
            if (Math.random() < 0.01) {
                this.checkForNeeds(editorManager, isEdgeBlocked);
            }
        }

        if (time - this.lastFrameTime > anim.frameDuration) {
            this.currentFrame = (this.currentFrame + 1) % anim.materials.length;
            this.sprite.material = anim.materials[this.currentFrame];
            this.lastFrameTime = time;
            this.setPosition(this.sprite.position.x, 0, this.sprite.position.z);
        }
    }

    private checkForNeeds(editorManager: any, isEdgeBlocked: BlockedCheck) {
        const instances = editorManager.getAnimalInstances();
        const needyAnimal = instances.find((a: any) => a.hunger > 70 || a.health < 50);
        
        if (needyAnimal) {
            const exhibitId = editorManager.exhibitManager.getExhibitAt(needyAnimal.currentTile.x, needyAnimal.currentTile.y);
            if (exhibitId !== 0) {
                this.targetExhibit = exhibitId;
                this.state = 'moving_to_exhibit';
                const tiles = editorManager.exhibitManager.getExhibitTiles(exhibitId);
                this.walkTo(tiles[Math.floor(Math.random() * tiles.length)], isEdgeBlocked);
                return;
            }
        }

        if (Math.random() < 0.1) {
            const tx = Math.floor(Math.max(0, Math.min(74, this.currentTile.x + (Math.random() * 10 - 5))));
            const ty = Math.floor(Math.max(0, Math.min(74, this.currentTile.y + (Math.random() * 10 - 5))));
            this.walkTo({ x: tx, y: ty }, isEdgeBlocked);
        }
    }

    private completeTask(editorManager: any) {
        const instances = editorManager.getAnimalInstances();
        instances.forEach((a: any) => {
            const eid = editorManager.exhibitManager.getExhibitAt(a.currentTile.x, a.currentTile.y);
            if (eid === this.targetExhibit) {
                a.feed();
                a.heal();
            }
        });
        this.state = 'wandering';
        this.targetExhibit = null;
    }
}

export class MaintInstance extends StaffInstance {
    update(time: number, isEdgeBlocked: BlockedCheck, editorManager: any) {
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
            }
            const p1 = this.getTileWorldPos(this.currentTile);
            const p2 = this.path.length > 0 ? this.getTileWorldPos(this.path[0]) : p1;
            this.setPosition(p1.x + (p2.x - p1.x) * this.lerpAlpha, 0, p1.z + (p2.z - p1.z) * this.lerpAlpha);
        } else {
            if (Math.random() < 0.01) {
                const tx = Math.floor(Math.max(0, Math.min(74, this.currentTile.x + (Math.random() * 15 - 7))));
                const ty = Math.floor(Math.max(0, Math.min(74, this.currentTile.y + (Math.random() * 15 - 7))));
                this.walkTo({ x: tx, y: ty }, isEdgeBlocked);
            }
        }

        if (time - this.lastFrameTime > anim.frameDuration) {
            this.currentFrame = (this.currentFrame + 1) % anim.materials.length;
            this.sprite.material = anim.materials[this.currentFrame];
            this.lastFrameTime = time;
            this.setPosition(this.sprite.position.x, 0, this.sprite.position.z);
        }
    }
}

export class GuideInstance extends StaffInstance {
    update(time: number, isEdgeBlocked: BlockedCheck, editorManager: any) {
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
            }
            const p1 = this.getTileWorldPos(this.currentTile);
            const p2 = this.path.length > 0 ? this.getTileWorldPos(this.path[0]) : p1;
            this.setPosition(p1.x + (p2.x - p1.x) * this.lerpAlpha, 0, p1.z + (p2.z - p1.z) * this.lerpAlpha);
        } else {
            if (Math.random() < 0.01) {
                const tx = Math.floor(Math.max(0, Math.min(74, this.currentTile.x + (Math.random() * 12 - 6))));
                const ty = Math.floor(Math.max(0, Math.min(74, this.currentTile.y + (Math.random() * 12 - 6))));
                this.walkTo({ x: tx, y: ty }, isEdgeBlocked);
            }
        }

        if (time - this.lastFrameTime > anim.frameDuration) {
            this.currentFrame = (this.currentFrame + 1) % anim.materials.length;
            this.sprite.material = anim.materials[this.currentFrame];
            this.lastFrameTime = time;
            this.setPosition(this.sprite.position.x, 0, this.sprite.position.z);
        }
    }
}

export class StaffManager {
    public staff: StaffInstance[] = [];
    private animationCaches: Map<string, Record<string, AnimationState>> = new Map();

    constructor(private scene: THREE.Scene, private pathfinder: Pathfinder) {}

    public async init() {
        await this.loadStaffType('keeper', 'walk');
        await this.loadStaffType('maint', 'walk');
        await this.loadStaffType('tour', 'walk');
    }

    private async loadStaffType(staffId: string, animation: string) {
        const directions = ['n', 'ne', 'e', 'se', 's'];
        const anims: Record<string, AnimationState> = {};
        const texLoader = new THREE.TextureLoader();

        for (const dir of directions) {
            const frames: THREE.SpriteMaterial[] = [];
            let frameIndex = 0;
            while (frameIndex < 32) {
                const frameNum = frameIndex.toString().padStart(3, '0');
                const url = `/assets/${staffId}/m/${animation}/${dir}/${dir}_${frameNum}.png`;
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
                const sourceState = anims[source];
                const mirrored = sourceState.materials.map(m => {
                    const t = m.map!.clone();
                    t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1;
                    return new THREE.SpriteMaterial({ map: t, transparent: true });
                });
                anims[target] = { materials: mirrored, frameDuration: anims[source].frameDuration };
            }
        }
        this.animationCaches.set(`${staffId}:${animation}`, anims);
    }

    public hire(type: StaffType, x: number, y: number) {
        const anims = this.animationCaches.get(`${type}:walk`);
        if (!anims) return;

        let instance: StaffInstance;
        if (type === 'maint') {
            instance = new MaintInstance(anims, this.scene, this.pathfinder, { x, y });
        } else if (type === 'guide') {
            instance = new GuideInstance(anims, this.scene, this.pathfinder, { x, y });
        } else {
            instance = new KeeperInstance(anims, this.scene, this.pathfinder, { x, y });
        }
        this.staff.push(instance);
    }

    public getSalaries(): number {
        return this.staff.reduce((total, s) => {
            if (s instanceof KeeperInstance) return total + 800;
            if (s instanceof MaintInstance) return total + 500;
            if (s instanceof GuideInstance) return total + 600;
            return total;
        }, 0);
    }

    public update(time: number, isEdgeBlocked: BlockedCheck, editorManager: any) {
        this.staff.forEach(s => s.update(time, isEdgeBlocked, editorManager));
    }

    public reset() {
        this.staff.forEach(s => s.destroy());
        this.staff = [];
    }

    // Compat helper
    public hireKeeper(x: number, y: number) { this.hire('keeper', x, y); }
    public get keepers() { return this.staff.filter(s => s instanceof KeeperInstance) as KeeperInstance[]; }
}

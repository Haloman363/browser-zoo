import * as THREE from 'three';
import { Pathfinder, Tile, BlockedCheck } from '../core/Pathfinder';

interface AnimationState {
    materials: THREE.SpriteMaterial[];
    frameDuration: number;
}

export class KeeperInstance {
    public sprite: THREE.Sprite;
    public currentTile: Tile;
    private currentDir: string = 'S';
    private currentFrame: number = 0;
    private lastFrameTime: number = 0;
    
    private path: Tile[] = [];
    private moveSpeed: number = 0.07;
    private lerpAlpha: number = 0;
    private targetExhibit: number | null = null;

    constructor(
        private animations: Record<string, AnimationState>,
        scene: THREE.Scene,
        private pathfinder: Pathfinder,
        startTile: Tile
    ) {
        this.currentTile = { ...startTile };
        const startMat = this.animations[this.currentDir]?.materials[0] || new THREE.SpriteMaterial({ color: 0x0000ff });
        this.sprite = new THREE.Sprite(startMat);
        scene.add(this.sprite);
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
                
                if (this.path.length === 0 && this.targetExhibit !== null) {
                    this.performMaintenance(editorManager);
                }
            }
            const p1 = this.getTileWorldPos(this.currentTile);
            const p2 = this.path.length > 0 ? this.getTileWorldPos(this.path[0]) : p1;
            this.setPosition(p1.x + (p2.x - p1.x) * this.lerpAlpha, 0, p1.z + (p2.z - p1.z) * this.lerpAlpha);
        } else {
            if (Math.random() < 0.01) {
                this.findExhibitToHelp(editorManager, isEdgeBlocked);
            }
        }

        if (time - this.lastFrameTime > anim.frameDuration) {
            this.currentFrame = (this.currentFrame + 1) % anim.materials.length;
            this.sprite.material = anim.materials[this.currentFrame];
            this.lastFrameTime = time;
            this.setPosition(this.sprite.position.x, 0, this.sprite.position.z);
        }
    }

    private findExhibitToHelp(editorManager: any, isEdgeBlocked: BlockedCheck) {
        const animalData = editorManager.getAnimalData(); 
        const exhibitIds = Array.from(new Set(animalData.map((a: any) => editorManager.exhibitManager.getExhibitAt(a.tileX, a.tileY)))).filter(id => id !== 0);
        
        if (exhibitIds.length > 0) {
            const targetId = exhibitIds[Math.floor(Math.random() * exhibitIds.length)] as number;
            const tiles = editorManager.exhibitManager.getExhibitTiles(targetId);
            if (tiles.length > 0) {
                this.targetExhibit = targetId;
                this.walkTo(tiles[Math.floor(Math.random() * tiles.length)], isEdgeBlocked);
            }
        }
    }

    private performMaintenance(editorManager: any) {
        const instances = editorManager.getAnimalInstances();
        instances.forEach((a: any) => {
            const atile = (a as any).currentTile;
            if (atile && editorManager.exhibitManager.getExhibitAt(atile.x, atile.y) === this.targetExhibit) {
                a.setHappiness(a.happiness + 15);
            }
        });
        this.targetExhibit = null;
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

export class StaffManager {
    public keepers: KeeperInstance[] = [];
    private animationCache: Record<string, AnimationState> = {};

    constructor(private scene: THREE.Scene, private pathfinder: Pathfinder) {}

    public async init() {
        await this.loadStaffType('keeper');
    }

    private async loadStaffType(id: string) {
        const directions = ['n', 'ne', 'e', 'se', 's'];
        const anims: Record<string, AnimationState> = {};
        const texLoader = new THREE.TextureLoader();

        for (const dir of directions) {
            const frames: THREE.SpriteMaterial[] = [];
            let frameIndex = 0;
            while (frameIndex < 32) {
                const url = `/assets/${id}/m/walk/${dir}/${dir}_${frameIndex.toString().padStart(3, '0')}.png`;
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
        this.animationCache = anims;
    }

    public hireKeeper(x: number, y: number) {
        const keeper = new KeeperInstance(this.animationCache, this.scene, this.pathfinder, { x, y });
        this.keepers.push(keeper);
    }

    public update(time: number, isEdgeBlocked: BlockedCheck, editorManager: any) {
        this.keepers.forEach(k => k.update(time, isEdgeBlocked, editorManager));
    }
}

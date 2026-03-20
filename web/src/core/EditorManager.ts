import * as THREE from 'three';
import { AnimalManager, AnimalInstance } from '../zoo/AnimalManager';
import { GuestManager, GuestInstance } from '../zoo/GuestManager';
import { GridRenderer } from './GridRenderer';
import { TerrainManager, TerrainType } from './TerrainManager';
import { PathManager, PathType } from './PathManager';
import { SceneryManager, SceneryInstance } from './SceneryManager';
import { FenceManager } from './FenceManager';
import { ExhibitManager } from './ExhibitManager';
import { StaffManager, KeeperInstance } from './StaffManager';
import { EconomyManager } from './EconomyManager';
import { SatisfactionManager } from './SatisfactionManager';
import { UIManager } from '../ui/UIManager';
import { PersistenceManager, ZooSaveData } from './PersistenceManager';
import { ZooMapParser, ParsedMap } from './ZooMapParser';
import { AudioManager } from './AudioManager';

export type EditorMode = 'select' | 'place_animal' | 'paint_terrain' | 'place_scenery' | 'place_fence' | 'paint_path' | 'hire_staff';

interface ManagedAnimal {
    id: string;
    tileX: number;
    tileY: number;
    instance: AnimalInstance;
}

interface ManagedScenery {
    id: string;
    tileX: number;
    tileY: number;
    instance: SceneryInstance;
}

export class EditorManager {
    private currentMode: EditorMode = 'select';
    private currentSelectedId: string | null = null;
    private currentTerrainType: TerrainType = TerrainType.Grass;
    private currentPathType: PathType = PathType.None;
    private animals: ManagedAnimal[] = [];
    private scenery: ManagedScenery[] = [];
    private persistence: PersistenceManager = new PersistenceManager();
    public exhibitManager: ExhibitManager;
    private satisfactionManager: SatisfactionManager = new SatisfactionManager();
    private onModeChangeCallback: (mode: EditorMode) => void = () => {};
    
    // Memory leak fix: Store timer IDs for cleanup
    private saveInterval?: NodeJS.Timer;
    private satisfactionInterval?: NodeJS.Timer;

    constructor(
        private animalManager: AnimalManager,
        private gridRenderer: GridRenderer,
        private terrainManager: TerrainManager,
        private pathManager: PathManager,
        private sceneryManager: SceneryManager,
        private fenceManager: FenceManager,
        private staffManager: StaffManager,
        private economyManager: EconomyManager,
        private uiManager: UIManager,
        private networkManager?: NetworkManager
    ) {
        this.exhibitManager = new ExhibitManager(fenceManager);
        this.saveInterval = setInterval(() => this.saveZoo(), 5000);
        this.satisfactionInterval = setInterval(() => this.updateSatisfaction(), 10000);
    }
    
    /**
     * Cleanup method to prevent memory leaks
     * Call this when resetting the zoo or destroying the editor
     */
    public destroy() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = undefined;
        }
        if (this.satisfactionInterval) {
            clearInterval(this.satisfactionInterval);
            this.satisfactionInterval = undefined;
        }
    }

    private broadcastAction(action: string, data: any) {
        if (this.networkManager && this.networkManager.isConnected()) {
            this.networkManager.send({ type: 'action', action, data });
        }
    }

    public async handleAction(action: string, data: any) {
        switch (action) {
            case 'place_animal':
                await this.placeAnimal(data.id, data.x, data.y, true);
                break;
            case 'place_scenery':
                await this.placeScenery(data.id, data.x, data.y, true);
                break;
            case 'place_fence':
                await this.fenceManager.placeFence(data.x, data.y, data.side, data.id);
                this.exhibitManager.updateExhibits();
                break;
            case 'paint_terrain':
                this.terrainManager.setTile(data.x, data.y, data.type);
                break;
            case 'paint_path':
                this.pathManager.setPath(data.x, data.y, data.type);
                break;
        }
    }

    public getMode() { return this.currentMode; }

    public setMode(mode: EditorMode) {
        this.currentMode = mode;
        this.onModeChangeCallback(mode);
    }

    public onModeChange(callback: (mode: EditorMode) => void) {
        this.onModeChangeCallback = callback;
    }

    public resetZoo(startingCash: number = 50000) {
        this.animals.forEach(a => a.instance.destroy());
        this.animals = [];
        
        this.scenery.forEach(s => s.instance.destroy(this.animalManager.scene));
        this.scenery = [];
        
        this.fenceManager.reset();
        this.terrainManager.reset();
        this.pathManager.reset();
        
        this.economyManager.setCash(startingCash);
        this.setMode('select');
    }

    public async loadMap(map: ParsedMap, startingCash: number = 25000) {
        this.resetZoo(startingCash);
        this.terrainManager.deserialize(map.terrain);
        if (map.paths) this.pathManager.deserialize(map.paths);
        
        for (const ent of map.entities) {
            try {
                if (ent.type === 'animal') {
                    await this.placeAnimal(ent.id, ent.x, ent.y);
                } else if (ent.type === 'scenery') {
                    await this.placeScenery(ent.id, ent.x, ent.y);
                } else if (ent.type === 'fence') {
                    // Just pick a side for now since parsing edge sides is hard
                    await this.fenceManager.placeFence(ent.x, ent.y, 'n', ent.id);
                }
            } catch(e) { console.warn(`Failed to place ${ent.id}:`, e); }
        }
        this.exhibitManager.updateExhibits();
    }

    public selectAnimalForPlacement(id: string) {
        this.currentSelectedId = id;
        this.setMode('place_animal');
    }

    public selectTerrainForPainting(name: string) {
        const typeMap: Record<string, TerrainType> = {
            'Grass': TerrainType.Grass,
            'Sand': TerrainType.Sand,
            'Dirt': TerrainType.Dirt,
            'Water': TerrainType.Water
        };
        this.currentTerrainType = typeMap[name] ?? TerrainType.Grass;
        this.setMode('paint_terrain');
    }

    public selectPathForPainting(name: string) {
        const typeMap: Record<string, PathType> = {
            'Asphalt': PathType.Asphalt,
            'Brick': PathType.Brick,
            'DirtPath': PathType.Dirt
        };
        this.currentPathType = typeMap[name] ?? PathType.None;
        this.setMode('paint_path');
    }

    public selectSceneryForPlacement(id: string) {
        this.currentSelectedId = id;
        this.setMode('place_scenery');
    }

    public selectFenceForPlacement(id: string) {
        this.currentSelectedId = id;
        this.setMode('place_fence');
    }

    public selectStaffForHiring(id: string) {
        this.currentSelectedId = id;
        this.setMode('hire_staff');
    }

    public async handleGridClick(tile: { x: number, y: number } | null, raycaster?: THREE.Raycaster) {
        if (!tile) return;

        const costs = this.economyManager.getCosts();

        if (this.currentMode === 'place_animal' && this.currentSelectedId) {
            if (this.economyManager.subtractCash(costs.animal)) {
                await this.placeAnimal(this.currentSelectedId, tile.x, tile.y);
                this.broadcastAction('place_animal', { id: this.currentSelectedId, x: tile.x, y: tile.y });
            } else {
                this.uiManager.showError('Insufficient funds for Animal!');
            }
        } else if (this.currentMode === 'paint_terrain') {
            if (this.terrainManager.getTile(tile.x, tile.y) !== this.currentTerrainType) {
                if (this.economyManager.subtractCash(costs.terrain)) {
                    this.terrainManager.setTile(tile.x, tile.y, this.currentTerrainType);
                    this.broadcastAction('paint_terrain', { type: this.currentTerrainType, x: tile.x, y: tile.y });
                } else {
                    this.uiManager.showError('Insufficient funds for Terrain!');
                }
            }
        } else if (this.currentMode === 'paint_path') {
            if (this.pathManager.getPath(tile.x, tile.y) !== this.currentPathType) {
                if (this.economyManager.subtractCash(costs.path)) {
                    this.pathManager.setPath(tile.x, tile.y, this.currentPathType);
                    this.broadcastAction('paint_path', { type: this.currentPathType, x: tile.x, y: tile.y });
                } else {
                    this.uiManager.showError('Insufficient funds for Path!');
                }
            }
        } else if (this.currentMode === 'place_scenery' && this.currentSelectedId) {
            if (this.economyManager.subtractCash(costs.scenery)) {
                await this.placeScenery(this.currentSelectedId, tile.x, tile.y);
                this.broadcastAction('place_scenery', { id: this.currentSelectedId, x: tile.x, y: tile.y });
            } else {
                this.uiManager.showError('Insufficient funds for Scenery!');
            }
        } else if (this.currentMode === 'place_fence' && this.currentSelectedId && raycaster) {
            const side = this.getNearestSide(tile, raycaster);
            if (!this.fenceManager.isEdgeBlocked(tile.x, tile.y, side)) {
                if (this.economyManager.subtractCash(costs.fence)) {
                    await this.fenceManager.placeFence(tile.x, tile.y, side, this.currentSelectedId);
                    this.exhibitManager.updateExhibits();
                    this.broadcastAction('place_fence', { id: this.currentSelectedId, x: tile.x, y: tile.y, side });
                } else {
                    this.uiManager.showError('Insufficient funds for Fence!');
                }
            }
        } else if (this.currentMode === 'hire_staff' && this.currentSelectedId) {
            const costMap: Record<string, number> = { 'keeper': 800, 'maint': 500, 'guide': 600 };
            const hireCost = costMap[this.currentSelectedId] || 500;
            if (this.economyManager.subtractCash(hireCost, 'salaries')) {
                this.staffManager.hire(this.currentSelectedId as any, tile.x, tile.y);
                // Staff not synced yet for simplicity
            } else {
                this.uiManager.showError(`Insufficient funds for ${this.currentSelectedId}!`);
            }
        }
    }

    public getEntityAt(tile: { x: number, y: number }, guestManager: GuestManager) {
        const animal = this.animals.find(a => {
            const atile = (a.instance as any).currentTile;
            return atile && atile.x === tile.x && atile.y === tile.y;
        });

        if (animal) {
            return {
                name: animal.id.toUpperCase(),
                stats: {
                    'Happiness': `${Math.floor(animal.instance.happiness)}%`,
                    'Exhibit': `#${this.exhibitManager.getExhibitAt(tile.x, tile.y)}`
                },
                thoughts: [
                    animal.instance.happiness > 70 ? "This grass is delicious." : "I'm a bit bored here."
                ]
            };
        }

        const guest = guestManager.guests.find(g => {
            const gtile = (g as any).currentTile;
            return gtile && gtile.x === tile.x && gtile.y === tile.y;
        });

        if (guest) {
            return {
                name: `GUEST (${guest.type.toUpperCase()})`,
                stats: {
                    'Happiness': `${Math.floor(guest.happiness)}%`
                },
                thoughts: guest.thoughts
            };
        }

        const staff = this.staffManager.staff.find(s => {
            const ktile = s.currentTile;
            return ktile && ktile.x === tile.x && ktile.y === tile.y;
        });

        if (staff) {
            let name = "STAFF";
            let thought = "Doing my job.";
            if (staff instanceof KeeperInstance) {
                name = "ZOO KEEPER";
                thought = "Just making sure the animals are happy.";
            } else if (staff.constructor.name === 'MaintInstance') {
                name = "MAINTENANCE WORKER";
                thought = "Keeping the zoo clean and tidy.";
            } else if (staff.constructor.name === 'GuideInstance') {
                name = "TOUR GUIDE";
                thought = "Welcome to our wonderful zoo!";
            }
            
            return {
                name,
                stats: { 'Status': 'Working' },
                thoughts: [thought]
            };
        }

        return null;
    }

    private getNearestSide(tile: { x: number, y: number }, raycaster: THREE.Raycaster): 'n' | 'e' | 's' | 'w' {
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const target = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, target);
        const worldPos = this.gridRenderer.getTileWorldPos(tile.x, tile.y);
        const dx = target.x - worldPos.x;
        const dz = target.z - worldPos.z;
        if (Math.abs(dx) > Math.abs(dz)) {
            return dx > 0 ? 'e' : 'w';
        } else {
            return dz > 0 ? 's' : 'n';
        }
    }

    public async placeAnimal(id: string, x: number, y: number, isRemote: boolean = false) {
        try {
            await this.animalManager.loadAnimal(id, 'walk');
            const instance = this.animalManager.createInstance(id, 'walk', { x, y });
            if (instance) {
                const worldPos = this.gridRenderer.getTileWorldPos(x, y);
                instance.setPosition(worldPos.x, 0, worldPos.z);
                this.animals.push({ id, tileX: x, tileY: y, instance });
                
                if (isRemote) {
                    console.log(`[EditorManager] Remote animal placed: ${id} at ${x},${y}`);
                }
            }
        } catch (e) { console.error(e); }
    }

    public async placeScenery(id: string, x: number, y: number, isRemote: boolean = false) {
        try {
            const texture = await this.sceneryManager.loadObject(id, 'se');
            const instance = this.sceneryManager.createInstance(id, texture);
            const worldPos = this.gridRenderer.getTileWorldPos(x, y);
            instance.setPosition(worldPos.x, 0, worldPos.z);
            this.scenery.push({ id, tileX: x, tileY: y, instance });

            if (isRemote) {
                console.log(`[EditorManager] Remote scenery placed: ${id} at ${x},${y}`);
            }
        } catch (e) { console.error(e); }
    }

    public getAnimalInstances() {
        return this.animals.map(a => a.instance);
    }

    public updateSatisfaction() {
        const exhibitIds = new Set<number>();
        this.animals.forEach(a => {
            const atile = (a.instance as any).currentTile;
            if (atile) exhibitIds.add(this.exhibitManager.getExhibitAt(atile.x, atile.y));
        });
        
        exhibitIds.forEach(eid => {
            if (eid === 0) return;
            const tiles = this.exhibitManager.getExhibitTiles(eid);
            const sceneryItems = this.scenery.map(s => ({ id: s.id, x: s.tileX, y: s.tileY }));
            
            this.animals.forEach(a => {
                const atile = (a.instance as any).currentTile;
                if (atile && this.exhibitManager.getExhibitAt(atile.x, atile.y) === eid) {
                    const score = this.satisfactionManager.calculateExhibitScore(tiles, this.terrainManager, sceneryItems, a.id);
                    // Satisfaction manager gives a baseline, but we only update if it would LOWER it, 
                    // unless keepers boost it above baseline? Let's just set it for now.
                    a.instance.setHappiness(score);
                }
            });
        });
    }

    public getAnimalData() {
        return this.animals.map(a => {
            const atile = (a.instance as any).currentTile || { x: a.tileX, y: a.tileY };
            return { id: a.id, tileX: atile.x, tileY: atile.y };
        });
    }

    public getSceneryData() {
        return this.scenery.map(s => ({ id: s.id, x: s.tileX, y: s.tileY }));
    }

    public getBuildings() {
        // For now, treat all scenery as potential buildings for guests
        return this.scenery.map(s => ({ id: s.id, tileX: s.tileX, tileY: s.tileY }));
    }

    public getFenceData() {
        return this.fenceManager.serialize();
    }

    public getPathData() {
        return Array.from(this.pathManager.serialize());
    }

    public serializeFullState() {
        return {
            terrain: this.terrainManager.serialize(),
            paths: this.getPathData(),
            scenery: this.getSceneryData(),
            fences: this.getFenceData(),
            animals: this.getAnimalData(),
            cash: this.economyManager.getCash()
        };
    }

    public saveZoo() {
        this.saveZooNamed('autosave');
    }

    public saveZooNamed(name: string) {
        this.persistence.save(name, this.terrainManager, this, this.economyManager.getCash());
    }

    public async loadZoo() {
        // Default to autosave on start
        const data = this.persistence.load('autosave');
        if (data) await this.loadZooData(data);
    }

    public async loadZooData(data: ZooSaveData) {
        console.log(`[EditorManager] Loading zoo '${data.name}'...`);
        this.resetZoo(data.cash || 50000);
        this.terrainManager.deserialize(data.terrain);
        if (data.paths) this.pathManager.deserialize(data.paths);
        
        for (const s of data.scenery) await this.placeScenery(s.id, s.x, s.y);
        if (data.fences) {
            for (const f of data.fences) await this.fenceManager.placeFence(f.x, f.y, f.side as any, f.id);
            this.exhibitManager.updateExhibits();
        }
        for (const a of data.animals) await this.placeAnimal(a.id, a.tileX, a.tileY);
    }

    public update(time: number, audioManager?: AudioManager) {
        const blockedCheck = (x: number, y: number, side: 'n' | 'e' | 's' | 'w') => 
            this.fenceManager.isEdgeBlocked(x, y, side);
        const exhibitCheck = (x: number, y: number) => 
            this.exhibitManager.getExhibitAt(x, y);
        this.animals.forEach(a => a.instance.update(time, blockedCheck, exhibitCheck, audioManager));
        this.staffManager.update(time, blockedCheck, this);
    }
}

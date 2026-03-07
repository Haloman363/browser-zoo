import * as THREE from 'three';
import { AnimalManager, AnimalInstance } from '../zoo/AnimalManager';
import { GuestManager, GuestInstance } from '../zoo/GuestManager';
import { GridRenderer } from './GridRenderer';
import { TerrainManager, TerrainType } from './TerrainManager';
import { PathManager, PathType } from './PathManager';
import { SceneryManager, SceneryInstance } from './SceneryManager';
import { FenceManager } from './FenceManager';
import { ExhibitManager } from './ExhibitManager';
import { StaffManager } from './StaffManager';
import { EconomyManager } from './EconomyManager';
import { SatisfactionManager } from './SatisfactionManager';
import { UIManager } from '../ui/UIManager';
import { PersistenceManager, ZooSaveData } from './PersistenceManager';

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

    constructor(
        private animalManager: AnimalManager,
        private gridRenderer: GridRenderer,
        private terrainManager: TerrainManager,
        private pathManager: PathManager,
        private sceneryManager: SceneryManager,
        private fenceManager: FenceManager,
        private staffManager: StaffManager,
        private economyManager: EconomyManager,
        private uiManager: UIManager
    ) {
        this.exhibitManager = new ExhibitManager(fenceManager);
        setInterval(() => this.saveZoo(), 5000);
        setInterval(() => this.updateSatisfaction(), 10000);
    }

    public getMode() { return this.currentMode; }

    public setMode(mode: EditorMode) {
        this.currentMode = mode;
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
            } else {
                this.uiManager.showError('Insufficient funds for Animal!');
            }
        } else if (this.currentMode === 'paint_terrain') {
            if (this.terrainManager.getTile(tile.x, tile.y) !== this.currentTerrainType) {
                if (this.economyManager.subtractCash(costs.terrain)) {
                    this.terrainManager.setTile(tile.x, tile.y, this.currentTerrainType);
                } else {
                    this.uiManager.showError('Insufficient funds for Terrain!');
                }
            }
        } else if (this.currentMode === 'paint_path') {
            if (this.pathManager.getPath(tile.x, tile.y) !== this.currentPathType) {
                if (this.economyManager.subtractCash(costs.path)) {
                    this.pathManager.setPath(tile.x, tile.y, this.currentPathType);
                } else {
                    this.uiManager.showError('Insufficient funds for Path!');
                }
            }
        } else if (this.currentMode === 'place_scenery' && this.currentSelectedId) {
            if (this.economyManager.subtractCash(costs.scenery)) {
                await this.placeScenery(this.currentSelectedId, tile.x, tile.y);
            } else {
                this.uiManager.showError('Insufficient funds for Scenery!');
            }
        } else if (this.currentMode === 'place_fence' && this.currentSelectedId && raycaster) {
            const side = this.getNearestSide(tile, raycaster);
            if (!this.fenceManager.isEdgeBlocked(tile.x, tile.y, side)) {
                if (this.economyManager.subtractCash(costs.fence)) {
                    await this.fenceManager.placeFence(tile.x, tile.y, side, this.currentSelectedId);
                    this.exhibitManager.updateExhibits();
                } else {
                    this.uiManager.showError('Insufficient funds for Fence!');
                }
            }
        } else if (this.currentMode === 'hire_staff' && this.currentSelectedId === 'keeper') {
            if (this.economyManager.subtractCash(1000)) { // Hiring cost
                this.staffManager.hireKeeper(tile.x, tile.y);
            } else {
                this.uiManager.showError('Insufficient funds for Keeper!');
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

        const keeper = this.staffManager.keepers.find(k => {
            const ktile = k.currentTile;
            return ktile && ktile.x === tile.x && ktile.y === tile.y;
        });

        if (keeper) {
            return {
                name: "ZOO KEEPER",
                stats: { 'Status': 'Working' },
                thoughts: ["Just making sure the animals are happy."]
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

    public async placeAnimal(id: string, x: number, y: number) {
        try {
            await this.animalManager.loadAnimal(id, 'walk');
            const instance = this.animalManager.createInstance(id, 'walk', { x, y });
            if (instance) {
                const worldPos = this.gridRenderer.getTileWorldPos(x, y);
                instance.setPosition(worldPos.x, 0, worldPos.z);
                this.animals.push({ id, tileX: x, tileY: y, instance });
            }
        } catch (e) { console.error(e); }
    }

    public async placeScenery(id: string, x: number, y: number) {
        try {
            const texture = await this.sceneryManager.loadObject(id, 'se');
            const instance = this.sceneryManager.createInstance(id, texture);
            const worldPos = this.gridRenderer.getTileWorldPos(x, y);
            instance.setPosition(worldPos.x, 0, worldPos.z);
            this.scenery.push({ id, tileX: x, tileY: y, instance });
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

    public getFenceData() {
        return this.fenceManager.serialize();
    }

    public getPathData() {
        return Array.from(this.pathManager.serialize());
    }

    public getStaffData() {
        return this.staffManager.keepers.map(k => ({ id: 'keeper', x: k.currentTile.x, y: k.currentTile.y }));
    }

    public saveZoo() {
        const saveData = {
            getAnimalData: () => this.getAnimalData(),
            getSceneryData: () => this.getSceneryData(),
            getFenceData: () => this.getFenceData(),
            getPathData: () => this.getPathData(),
            getStaffData: () => this.getStaffData()
        };
        this.persistence.save(this.terrainManager, saveData);
    }

    public async loadZoo() {
        const data = this.persistence.load();
        if (!data) return;
        console.log('[EditorManager] Loading saved zoo...');
        this.terrainManager.deserialize(data.terrain);
        if (data.paths) this.pathManager.deserialize(data.paths);
        for (const s of data.scenery) await this.placeScenery(s.id, s.x, s.y);
        if (data.fences) {
            for (const f of data.fences) await this.fenceManager.placeFence(f.x, f.y, f.side as any, f.id);
            this.exhibitManager.updateExhibits();
        }
        if ((data as any).staff) {
            for (const st of (data as any).staff) {
                if (st.id === 'keeper') this.staffManager.hireKeeper(st.x, st.y);
            }
        }
        for (const a of data.animals) await this.placeAnimal(a.id, a.tileX, a.tileY);
    }

    public update(time: number) {
        const blockedCheck = (x: number, y: number, side: 'n' | 'e' | 's' | 'w') => 
            this.fenceManager.isEdgeBlocked(x, y, side);
        const exhibitCheck = (x: number, y: number) => 
            this.exhibitManager.getExhibitAt(x, y);
        this.animals.forEach(a => a.instance.update(time, blockedCheck, exhibitCheck));
        this.staffManager.update(time, blockedCheck, this);
    }
}

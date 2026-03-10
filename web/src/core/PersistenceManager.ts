import { TerrainManager } from './TerrainManager';

export interface ZooSaveData {
    name: string;
    date: string;
    terrain: number[];
    paths: number[];
    animals: { id: string, tileX: number, tileY: number }[];
    scenery: { id: string, x: number, y: number }[];
    fences: { id: string, x: number, y: number, side: string }[];
    cash: number;
}

export class PersistenceManager {
    private SAVE_PREFIX = 'zt_save_';

    public save(name: string, terrainManager: TerrainManager, editorManager: any, cash: number) {
        const data: ZooSaveData = {
            name: name,
            date: new Date().toLocaleString(),
            terrain: terrainManager.serialize(),
            paths: editorManager.getPathData(),
            animals: editorManager.getAnimalData(),
            scenery: editorManager.getSceneryData(),
            fences: editorManager.getFenceData(),
            cash: cash
        };
        localStorage.setItem(this.SAVE_PREFIX + name, JSON.stringify(data));
        
        // Update save list
        const saves = this.listSaves();
        if (!saves.includes(name)) {
            saves.push(name);
            localStorage.setItem('zt_saves_list', JSON.stringify(saves));
        }
        console.log(`[PersistenceManager] Zoo '${name}' saved.`);
    }

    public load(name: string): ZooSaveData | null {
        const saved = localStorage.getItem(this.SAVE_PREFIX + name);
        if (!saved) return null;
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error(`[PersistenceManager] Failed to parse save data for ${name}`);
            return null;
        }
    }

    public listSaves(): string[] {
        const list = localStorage.getItem('zt_saves_list');
        return list ? JSON.parse(list) : [];
    }

    public deleteSave(name: string) {
        localStorage.removeItem(this.SAVE_PREFIX + name);
        const saves = this.listSaves().filter(s => s !== name);
        localStorage.setItem('zt_saves_list', JSON.stringify(saves));
    }
}

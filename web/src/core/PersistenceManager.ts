import { TerrainManager } from './TerrainManager';

export interface ZooSaveData {
    terrain: number[];
    paths: number[];
    animals: { id: string, x: number, y: number }[];
    scenery: { id: string, x: number, y: number }[];
    fences: { id: string, x: number, y: number, side: string }[];
}

export class PersistenceManager {
    private SAVE_KEY = 'zoo_tycoon_save';

    public save(terrainManager: TerrainManager, editorManager: any) {
        const data: ZooSaveData = {
            terrain: terrainManager.serialize(),
            paths: editorManager.getPathData(),
            animals: editorManager.getAnimalData(),
            scenery: editorManager.getSceneryData(),
            fences: editorManager.getFenceData()
        };
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
        console.log('[PersistenceManager] Zoo saved.');
    }

    public load(): ZooSaveData | null {
        const saved = localStorage.getItem(this.SAVE_KEY);
        if (!saved) return null;
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('[PersistenceManager] Failed to parse save data');
            return null;
        }
    }
}

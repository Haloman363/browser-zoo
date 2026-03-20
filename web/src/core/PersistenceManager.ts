import { TerrainManager } from './TerrainManager';
import { ZooSaveData, ZooSaveSchema } from '../utils/validators';

export { ZooSaveData } from '../utils/validators';

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
        
        // Validate before saving
        try {
            ZooSaveSchema.parse(data);
            localStorage.setItem(this.SAVE_PREFIX + name, JSON.stringify(data));
            
            // Update save list
            const saves = this.listSaves();
            if (!saves.includes(name)) {
                saves.push(name);
                localStorage.setItem('zt_saves_list', JSON.stringify(saves));
            }
            console.log(`[PersistenceManager] Zoo '${name}' saved.`);
        } catch (e) {
            console.error(`[PersistenceManager] Invalid save data for ${name}:`, e);
            throw new Error(`Failed to save: invalid data structure`);
        }
    }

    public load(name: string): ZooSaveData | null {
        const saved = localStorage.getItem(this.SAVE_PREFIX + name);
        if (!saved) return null;
        
        try {
            const parsed = JSON.parse(saved);
            // Validate loaded data to prevent injection attacks
            return ZooSaveSchema.parse(parsed);
        } catch (e) {
            console.error(`[PersistenceManager] Failed to load save data for ${name}:`, e);
            return null;
        }
    }

    public listSaves(): string[] {
        const list = localStorage.getItem('zt_saves_list');
        if (!list) return [];
        
        try {
            const parsed = JSON.parse(list);
            // Validate it's an array of strings
            if (!Array.isArray(parsed)) return [];
            return parsed.filter(item => typeof item === 'string' && item.length > 0);
        } catch (e) {
            console.error('[PersistenceManager] Failed to parse saves list');
            return [];
        }
    }

    public deleteSave(name: string) {
        localStorage.removeItem(this.SAVE_PREFIX + name);
        const saves = this.listSaves().filter(s => s !== name);
        localStorage.setItem('zt_saves_list', JSON.stringify(saves));
    }
}

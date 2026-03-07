import { TerrainType } from './TerrainManager';

export interface AnimalPreferences {
    preferredTerrain: TerrainType;
    preferredScenery: string[];
}

export class SatisfactionManager {
    private preferences: Record<string, AnimalPreferences> = {
        'afrbuf': { preferredTerrain: TerrainType.Grass, preferredScenery: ['baobob', 'acacia'] },
        'lion': { preferredTerrain: TerrainType.Sand, preferredScenery: ['acacia'] },
        'giraffe': { preferredTerrain: TerrainType.Grass, preferredScenery: ['baobob', 'acacia'] },
        'zebra': { preferredTerrain: TerrainType.Grass, preferredScenery: ['acacia'] },
        'gorilla': { preferredTerrain: TerrainType.Grass, preferredScenery: ['bamboo'] }
    };

    public calculateExhibitScore(
        tiles: { x: number, y: number }[], 
        terrainManager: any, 
        scenery: { id: string, x: number, y: number }[],
        animalId: string
    ): number {
        const prefs = this.preferences[animalId];
        if (!prefs) return 50; // Neutral

        if (tiles.length === 0) return 0;

        let score = 50;

        // 1. Terrain Score
        let correctTerrainCount = 0;
        tiles.forEach(t => {
            if (terrainManager.getTile(t.x, t.y) === prefs.preferredTerrain) {
                correctTerrainCount++;
            }
        });
        const terrainRatio = correctTerrainCount / tiles.length;
        score += (terrainRatio - 0.5) * 40; // Max +20 or -20

        // 2. Scenery Score
        const exhibitScenery = scenery.filter(s => tiles.some(t => t.x === s.x && t.y === s.y));
        let correctSceneryCount = 0;
        exhibitScenery.forEach(s => {
            if (prefs.preferredScenery.includes(s.id)) {
                correctSceneryCount++;
            }
        });
        score += Math.min(20, correctSceneryCount * 5); // +5 per correct item, max 20

        return Math.max(0, Math.min(100, score));
    }
}

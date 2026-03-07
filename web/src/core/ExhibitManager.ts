import { FenceManager } from './FenceManager';

export class ExhibitManager {
    private exhibitGrid: Int32Array; // 0 = outside, >0 = exhibit index
    private width: number = 75;
    private height: number = 75;

    constructor(private fenceManager: FenceManager) {
        this.exhibitGrid = new Int32Array(this.width * this.height);
    }

    public updateExhibits() {
        this.exhibitGrid.fill(0);
        let nextId = 1;

        // Simple approach: flood fill from every non-visited, non-fence tile
        const visited = new Set<number>();

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const idx = y * this.width + x;
                if (visited.has(idx)) continue;

                // Start a new potential exhibit fill
                const group: number[] = [];
                const isEnclosed = this.floodFill(x, y, visited, group);

                if (isEnclosed && group.length > 0) {
                    group.forEach(i => this.exhibitGrid[i] = nextId);
                    nextId++;
                }
            }
        }
        console.log(`[ExhibitManager] Detected ${nextId - 1} enclosed exhibits.`);
    }

    private floodFill(startX: number, startY: number, globalVisited: Set<number>, group: number[]): boolean {
        const queue: [number, number][] = [[startX, startY]];
        const localVisited = new Set<number>();
        let touchesEdge = false;

        while (queue.length > 0) {
            const [x, y] = queue.shift()!;
            const idx = y * this.width + x;

            if (localVisited.has(idx)) continue;
            localVisited.add(idx);
            group.push(idx);
            globalVisited.add(idx);

            // If we touch the world edge, this group is "outside"
            if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                touchesEdge = true;
            }

            // Check 4 neighbors
            const neighbors: [number, number, 'n' | 'e' | 's' | 'w'][] = [
                [x, y - 1, 'n'], [x, y + 1, 's'], [x + 1, y, 'e'], [x - 1, y, 'w']
            ];

            for (const [nx, ny, side] of neighbors) {
                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                    // Only move to neighbor if there's no fence blocking THIS side
                    if (!this.fenceManager.isEdgeBlocked(x, y, side)) {
                        queue.push([nx, ny]);
                    }
                }
            }
        }

        // If it never touched the world edge, it's enclosed by fences
        return !touchesEdge;
    }

    public getExhibitAt(x: number, y: number): number {
        return this.exhibitGrid[y * this.width + x];
    }

    public getExhibitTiles(exhibitId: number): { x: number, y: number }[] {
        const tiles: { x: number, y: number }[] = [];
        for (let i = 0; i < this.exhibitGrid.length; i++) {
            if (this.exhibitGrid[i] === exhibitId) {
                tiles.push({
                    x: i % this.width,
                    y: Math.floor(i / this.width)
                });
            }
        }
        return tiles;
    }
}

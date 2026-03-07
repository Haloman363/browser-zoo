export interface Tile {
    x: number;
    y: number;
}

export type BlockedCheck = (x: number, y: number, side: 'n' | 'e' | 's' | 'w') => boolean;

export class Pathfinder {
    constructor(private gridWidth: number = 75, private gridHeight: number = 75) {}

    public findPath(start: Tile, end: Tile, isEdgeBlocked: BlockedCheck): Tile[] {
        if (start.x === end.x && start.y === end.y) return [];

        const queue: Tile[] = [start];
        const visited: Set<string> = new Set();
        const parent: Map<string, Tile | null> = new Map();

        visited.add(`${start.x},${start.y}`);
        parent.set(`${start.x},${start.y}`, null);

        while (queue.length > 0) {
            const current = queue.shift()!;

            if (current.x === end.x && current.y === end.y) {
                return this.reconstructPath(parent, end);
            }

            for (const neighbor of this.getNeighbors(current, isEdgeBlocked)) {
                const key = `${neighbor.x},${neighbor.y}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    parent.set(key, current);
                    queue.push(neighbor);
                }
            }
        }

        return [];
    }

    private getNeighbors(tile: Tile, isEdgeBlocked: BlockedCheck): Tile[] {
        const neighbors: Tile[] = [];
        // Orthogonal neighbors
        const dirs: { x: number, y: number, side: 'n' | 'e' | 's' | 'w' }[] = [
            { x: 0, y: -1, side: 'n' }, { x: 0, y: 1, side: 's' },
            { x: 1, y: 0, side: 'e' }, { x: -1, y: 0, side: 'w' }
        ];

        for (const dir of dirs) {
            const nx = tile.x + dir.x;
            const ny = tile.y + dir.y;

            if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
                // Check if fence blocks movement from current tile to neighbor
                if (!isEdgeBlocked(tile.x, tile.y, dir.side)) {
                    neighbors.push({ x: nx, y: ny });
                }
            }
        }

        // We skip diagonals for simplicity when fences are involved, 
        // as ZT1 usually treats diagonal movement as passing through corners.
        return neighbors;
    }

    private reconstructPath(parent: Map<string, Tile | null>, end: Tile): Tile[] {
        const path: Tile[] = [];
        let current: Tile | null = end;
        while (current !== null) {
            path.push(current);
            current = parent.get(`${current.x},${current.y}`) || null;
        }
        return path.reverse();
    }
}

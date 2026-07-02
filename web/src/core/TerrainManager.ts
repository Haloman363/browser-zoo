export enum TerrainType {
    Grass = 0,
    Sand = 1,
    Dirt = 2,
    Water = 3,
    // Extended ZT1 types (used by scenario maps; painting UI offers the four above)
    Savannah = 4,
    Rainforest = 5,
    BrownStone = 6,
    GrayStone = 7,
    Gravel = 8,
    Snow = 9,
    SaltWater = 10,
    Deciduous = 11,
    Coniferous = 12,
    Concrete = 13,
    Asphalt = 14,
    Trampled = 15
}

export class TerrainManager {
    private gridData: Uint8Array;
    private width: number = 75;
    private height: number = 75;
    private onUpdateCallback: () => void = () => {};

    constructor(width: number = 75, height: number = 75) {
        this.width = width;
        this.height = height;
        this.gridData = new Uint8Array(width * height);
        this.gridData.fill(TerrainType.Grass);
    }

    public setTile(x: number, y: number, type: TerrainType) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.gridData[y * this.width + x] = type;
            this.onUpdateCallback();
        }
    }

    public getTile(x: number, y: number): TerrainType {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.gridData[y * this.width + x];
        }
        return TerrainType.Grass;
    }

    public getData(): Uint8Array {
        return this.gridData;
    }

    public onUpdate(callback: () => void) {
        this.onUpdateCallback = callback;
    }

    public reset() {
        this.gridData.fill(TerrainType.Grass);
        this.onUpdateCallback();
    }

    public serialize() {
        return Array.from(this.gridData);
    }

    public deserialize(data: number[]) {
        if (data.length === this.gridData.length) {
            this.gridData.set(data);
            this.onUpdateCallback();
        }
    }
}

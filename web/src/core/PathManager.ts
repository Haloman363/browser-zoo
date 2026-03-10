export enum PathType {
    None = 0,
    Asphalt = 1,
    Brick = 2,
    Dirt = 3
}

export class PathManager {
    private gridData: Uint8Array;
    private width: number = 75;
    private height: number = 75;
    private onUpdateCallback: () => void = () => {};

    constructor(width: number = 75, height: number = 75) {
        this.width = width;
        this.height = height;
        this.gridData = new Uint8Array(width * height);
        this.gridData.fill(PathType.None);
    }

    public setPath(x: number, y: number, type: PathType) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.gridData[y * this.width + x] = type;
            this.onUpdateCallback();
        }
    }

    public getPath(x: number, y: number): PathType {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.gridData[y * this.width + x];
        }
        return PathType.None;
    }

    public hasPath(x: number, y: number): boolean {
        return this.getPath(x, y) !== PathType.None;
    }

    public getData(): Uint8Array {
        return this.gridData;
    }

    public onUpdate(callback: () => void) {
        this.onUpdateCallback = callback;
    }

    public reset() {
        this.gridData.fill(PathType.None);
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

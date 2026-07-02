import * as THREE from 'three';
import { TerrainManager, TerrainType } from './TerrainManager';
import { PathManager, PathType } from './PathManager';

export class GridRenderer {
    public tileSize: number = 2;
    public gridWidth: number = 75;
    public gridHeight: number = 75;
    private hoverMesh: THREE.Mesh;
    private ground: THREE.Mesh | null = null;
    private atlasTexture: THREE.CanvasTexture | null = null;
    private terrainDataTexture: THREE.DataTexture | null = null;
    private pathDataTexture: THREE.DataTexture | null = null;

    constructor(
        private scene: THREE.Scene, 
        private terrainManager: TerrainManager,
        private pathManager: PathManager
    ) {
        const geometry = new THREE.PlaneGeometry(this.tileSize * 0.95, this.tileSize * 0.95);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
        this.hoverMesh = new THREE.Mesh(geometry, material);
        this.hoverMesh.rotation.x = -Math.PI / 2;
        this.hoverMesh.visible = false;
        this.scene.add(this.hoverMesh);

        this.initTerrain();
        
        this.terrainManager.onUpdate(() => this.updateTerrainTexture());
        this.pathManager.onUpdate(() => this.updatePathTexture());
    }

    private async initTerrain() {
        const atlas = await this.createAtlas();
        this.atlasTexture = new THREE.CanvasTexture(atlas);
        this.atlasTexture.magFilter = THREE.NearestFilter;
        this.atlasTexture.minFilter = THREE.NearestFilter;

        this.terrainDataTexture = new THREE.DataTexture(
            this.terrainManager.getData(),
            this.gridWidth,
            this.gridHeight,
            THREE.RedFormat,
            THREE.UnsignedByteType
        );
        this.terrainDataTexture.needsUpdate = true;

        this.pathDataTexture = new THREE.DataTexture(
            this.pathManager.getData(),
            this.gridWidth,
            this.gridHeight,
            THREE.RedFormat,
            THREE.UnsignedByteType
        );
        this.pathDataTexture.needsUpdate = true;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uAtlas: { value: this.atlasTexture },
                uTerrainData: { value: this.terrainDataTexture },
                uPathData: { value: this.pathDataTexture },
                uGridSize: { value: new THREE.Vector2(this.gridWidth, this.gridHeight) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                uniform sampler2D uAtlas;
                uniform sampler2D uTerrainData;
                uniform sampler2D uPathData;
                uniform vec2 uGridSize;

                void main() {
                    // Plane is rotated -90deg about X: UV v=0 is the south edge (tile y = max),
                    // but data rows start at tile y = 0 — flip v so painted tiles match clicks.
                    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
                    float terrainType = texture2D(uTerrainData, uv).r * 255.0;
                    float pathType = texture2D(uPathData, uv).r * 255.0;

                    vec2 localUv = fract(uv * uGridSize);

                    // Atlas: 32 slots — terrain types at 0-15, paths at 16+pathType
                    float terrainAtlasX = (terrainType + localUv.x) / 32.0;
                    vec4 terrainColor = texture2D(uAtlas, vec2(terrainAtlasX, localUv.y));

                    if (pathType > 0.0) {
                        float pathAtlasX = (16.0 + pathType + localUv.x) / 32.0;
                        gl_FragColor = texture2D(uAtlas, vec2(pathAtlasX, localUv.y));
                    } else {
                        gl_FragColor = terrainColor;
                    }
                }
            `
        });

        const geometry = new THREE.PlaneGeometry(this.gridWidth * this.tileSize, this.gridHeight * this.tileSize);
        this.ground = new THREE.Mesh(geometry, material);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = -0.01;
        this.scene.add(this.ground);
    }

    private updateTerrainTexture() {
        if (this.terrainDataTexture) {
            this.terrainDataTexture.image.data = this.terrainManager.getData();
            this.terrainDataTexture.needsUpdate = true;
        }
    }

    private updatePathTexture() {
        if (this.pathDataTexture) {
            this.pathDataTexture.image.data = this.pathManager.getData();
            this.pathDataTexture.needsUpdate = true;
        }
    }

    // Atlas layout: 32 slots of 128px. Terrain types (TerrainType enum) at slots 0-15,
    // path types (PathType enum) at slots 16+type. Colors approximate the ZT1 palette.
    private static readonly SLOT = 128;
    private static readonly TERRAIN_COLORS: [string, string][] = [
        ['#5c8a3a', '#4c7a2a'], // 0 Grass (replaced by photo texture when it loads)
        ['#d2b48c', '#c2a47c'], // 1 Sand
        ['#8b4513', '#7b3503'], // 2 Dirt
        ['#2f5fbf', '#2450a5'], // 3 Water (fresh)
        ['#b0a955', '#a09945'], // 4 Savannah
        ['#3d6b28', '#2d5b18'], // 5 Rainforest floor
        ['#7a5c44', '#6a4c34'], // 6 Brown stone
        ['#8a8a8a', '#7a7a7a'], // 7 Gray stone
        ['#a09a88', '#908a78'], // 8 Gravel
        ['#e8ecf2', '#d8dce2'], // 9 Snow
        ['#1e4e9c', '#153f85'], // 10 Salt water
        ['#6b8f3f', '#5b7f2f'], // 11 Deciduous floor
        ['#47723c', '#37622c'], // 12 Coniferous floor
        ['#b6b4a8', '#a6a498'], // 13 Concrete
        ['#46464a', '#38383c'], // 14 Asphalt
        ['#8a7b52', '#7a6b42']  // 15 Trampled
    ];
    private static readonly PATH_COLORS: [string, string][] = [
        ['#000000', '#000000'], // 0 None (never sampled)
        ['#333333', '#222222'], // 1 Asphalt
        ['#a52a2a', '#951a1a'], // 2 Brick
        ['#5d4037', '#4d3027'], // 3 Dirt
        ['#9c9c94', '#8c8c84'], // 4 Stone
        ['#c8b078', '#b8a068']  // 5 Tan (ZT1 standard path)
    ];

    private createAtlas(): Promise<HTMLCanvasElement> {
        return new Promise((resolve) => {
            const S = GridRenderer.SLOT;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            canvas.width = S * 32;
            canvas.height = S;

            const paint = (slot: number, [base, noise]: [string, string]) => {
                ctx.fillStyle = base;
                ctx.fillRect(slot * S, 0, S, S);
                this.addNoise(ctx, slot * S, 0, noise);
            };
            GridRenderer.TERRAIN_COLORS.forEach((c, i) => paint(i, c));
            GridRenderer.PATH_COLORS.forEach((c, i) => { if (i > 0) paint(16 + i, c); });

            const loader = new THREE.ImageLoader();
            loader.load('/assets/terrain/grass.png',
                (img) => { ctx.drawImage(img, 0, 0, S, S); resolve(canvas); },
                undefined,
                () => resolve(canvas)); // keep the flat color if the photo fails
        });
    }

    private addNoise(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
        const S = GridRenderer.SLOT;
        ctx.fillStyle = color;
        for (let i = 0; i < 300; i++) {
            ctx.fillRect(x + Math.random() * S, y + Math.random() * S, 2, 2);
        }
    }

    public updateHover(raycaster: THREE.Raycaster) {
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const target = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(plane, target)) {
            const halfW = (this.gridWidth * this.tileSize) / 2;
            const halfH = (this.gridHeight * this.tileSize) / 2;
            const tx = Math.floor((target.x + halfW) / this.tileSize);
            const tz = Math.floor((target.z + halfH) / this.tileSize);
            if (tx >= 0 && tx < this.gridWidth && tz >= 0 && tz < this.gridHeight) {
                this.hoverMesh.position.set(tx * this.tileSize - halfW + this.tileSize / 2, 0.01, tz * this.tileSize - halfH + this.tileSize / 2);
                this.hoverMesh.visible = true;
                return { x: tx, y: tz };
            }
        }
        this.hoverMesh.visible = false;
        return null;
    }

    public getTileWorldPos(tx: number, tz: number): THREE.Vector3 {
        const halfW = (this.gridWidth * this.tileSize) / 2;
        const halfH = (this.gridHeight * this.tileSize) / 2;
        return new THREE.Vector3(tx * this.tileSize - halfW + this.tileSize / 2, 0, tz * this.tileSize - halfH + this.tileSize / 2);
    }
}

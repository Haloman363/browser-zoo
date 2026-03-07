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
                    float terrainType = texture2D(uTerrainData, vUv).r * 255.0;
                    float pathType = texture2D(uPathData, vUv).r * 255.0;
                    
                    vec2 localUv = fract(vUv * uGridSize);
                    
                    // Sample Terrain
                    float terrainAtlasX = (terrainType + localUv.x) / 8.0;
                    vec4 terrainColor = texture2D(uAtlas, vec2(terrainAtlasX, localUv.y));
                    
                    // Sample Path
                    if (pathType > 0.0) {
                        // Paths are at index 4, 5, 6 in atlas (8 total slots)
                        float pathAtlasX = (3.0 + pathType + localUv.x) / 8.0;
                        vec4 pathColor = texture2D(uAtlas, vec2(pathAtlasX, localUv.y));
                        gl_FragColor = pathColor;
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

    private createAtlas(): Promise<HTMLCanvasElement> {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            // 8 slots total: 4 terrain, 4 paths
            canvas.width = 2048;
            canvas.height = 256;

            const loader = new THREE.ImageLoader();
            loader.load('/assets/terrain/grass.png', (img) => {
                // 0: Grass
                ctx.drawImage(img, 0, 0, 256, 256);
                
                // 1: Sand
                ctx.fillStyle = '#d2b48c';
                ctx.fillRect(256, 0, 256, 256);
                this.addNoise(ctx, 256, 0, '#c2a47c');

                // 2: Dirt
                ctx.fillStyle = '#8b4513';
                ctx.fillRect(512, 0, 256, 256);
                this.addNoise(ctx, 512, 0, '#7b3503');

                // 3: Water
                ctx.fillStyle = '#0000ff';
                ctx.fillRect(768, 0, 256, 256);
                this.addNoise(ctx, 768, 0, '#0000dd');

                // 4: Asphalt Path
                ctx.fillStyle = '#333333';
                ctx.fillRect(1024, 0, 256, 256);
                this.addNoise(ctx, 1024, 0, '#222222');

                // 5: Brick Path
                ctx.fillStyle = '#a52a2a';
                ctx.fillRect(1280, 0, 256, 256);
                this.addNoise(ctx, 1280, 0, '#951a1a');

                // 6: Dirt Path
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(1536, 0, 256, 256);
                this.addNoise(ctx, 1536, 0, '#4d3027');

                resolve(canvas);
            });
        });
    }

    private addNoise(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
        ctx.fillStyle = color;
        for (let i = 0; i < 500; i++) {
            ctx.fillRect(x + Math.random() * 256, y + Math.random() * 256, 2, 2);
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

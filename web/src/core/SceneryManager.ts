import * as THREE from 'three';

export interface SceneryMetadata {
    id: string;
    name: string;
    description: string;
}

export class SceneryManager {
    private textureCache: Map<string, THREE.Texture> = new Map();
    private loadingPromises: Map<string, Promise<THREE.Texture>> = new Map();

    constructor(public scene: THREE.Scene) {}

    public async loadObject(id: string, view: string = 'se'): Promise<THREE.Texture> {
        const cacheKey = `${id}:${view}`;
        if (this.loadingPromises.has(cacheKey)) return this.loadingPromises.get(cacheKey)!;

        const promise = (async () => {
            const texLoader = new THREE.TextureLoader();
            // Path: /assets/baobob/ne/ne_000.png
            const url = `/assets/${id}/${view}/${view}_000.png`;
            
            try {
                const texture = await texLoader.loadAsync(url);
                texture.magFilter = THREE.NearestFilter;
                texture.minFilter = THREE.NearestFilter;
                this.textureCache.set(cacheKey, texture);
                return texture;
            } catch (e) {
                console.error(`[SceneryManager] Failed to load ${url}`);
                throw e;
            }
        })();

        this.loadingPromises.set(cacheKey, promise);
        return promise;
    }

    public createInstance(id: string, texture: THREE.Texture): SceneryInstance {
        return new SceneryInstance(id, texture, this.scene);
    }
}

export class SceneryInstance {
    public sprite: THREE.Sprite;

    constructor(public id: string, texture: THREE.Texture, scene: THREE.Scene) {
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        this.sprite = new THREE.Sprite(material);
        scene.add(this.sprite);
    }

    public setPosition(x: number, y: number, z: number) {
        const scale = 0.4;
        const img = this.sprite.material.map?.image;
        if (img) {
            this.sprite.scale.set(img.width * scale, img.height * scale, 1);
            this.sprite.position.set(x, y + (img.height * scale) / 2, z);
            this.sprite.renderOrder = Math.floor(z * 100);
        }
    }

    public destroy(scene: THREE.Scene) {
        scene.remove(this.sprite);
        this.sprite.material.dispose();
    }
}

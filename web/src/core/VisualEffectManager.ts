import * as THREE from 'three';
import { AudioManager } from './AudioManager';

export class VisualEffectManager {
    private static shadowTexture: THREE.Texture | null = null;

    public static getShadowTexture(): THREE.Texture {
        if (this.shadowTexture) return this.shadowTexture;
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, 'rgba(0,0,0,0.4)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        this.shadowTexture = new THREE.CanvasTexture(canvas);
        return this.shadowTexture;
    }

    private rainParticles: THREE.Points | null = null;
    private snowParticles: THREE.Points | null = null;
    private lightningPlane: THREE.Mesh | null = null;
    private lastLightning: number = 0;
    private weatherType: 'none' | 'rain' | 'snow' | 'storm' = 'none';

    constructor(private scene: THREE.Scene) {}

    public update(time: number, camera: THREE.Camera, audioManager?: AudioManager) {
        if (this.rainParticles) {
            const positions = this.rainParticles.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] -= 1.5;
                if (positions[i + 1] < 0) positions[i + 1] = 100;
            }
            this.rainParticles.geometry.attributes.position.needsUpdate = true;
            this.rainParticles.position.set(camera.position.x, 0, camera.position.z);
        }

        if (this.snowParticles) {
            const positions = this.snowParticles.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] -= 0.5;
                positions[i] += Math.sin(time * 0.001 + i) * 0.1; // Drift
                if (positions[i + 1] < 0) positions[i + 1] = 100;
            }
            this.snowParticles.geometry.attributes.position.needsUpdate = true;
            this.snowParticles.position.set(camera.position.x, 0, camera.position.z);
        }

        if (this.weatherType === 'storm') {
            if (time - this.lastLightning > 5000 + Math.random() * 10000) {
                this.triggerLightning(time, audioManager);
            }
            if (this.lightningPlane && time - this.lastLightning < 100) {
                (this.lightningPlane.material as THREE.MeshBasicMaterial).opacity = 0.5;
            } else if (this.lightningPlane) {
                (this.lightningPlane.material as THREE.MeshBasicMaterial).opacity = 0;
            }
        }
    }

    private triggerLightning(time: number, audioManager?: AudioManager) {
        this.lastLightning = time;
        if (audioManager) {
            // Placeholder for thunder sound
            audioManager.playSfx('place'); // Low frequency place sound can mimic thunder for now
        }
    }

    public setWeather(type: 'none' | 'rain' | 'snow' | 'storm') {
        this.weatherType = type;
        if (this.rainParticles) this.scene.remove(this.rainParticles);
        if (this.snowParticles) this.scene.remove(this.snowParticles);
        if (this.lightningPlane) this.scene.remove(this.lightningPlane);
        this.rainParticles = null;
        this.snowParticles = null;
        this.lightningPlane = null;

        if (type === 'rain' || type === 'storm') {
            const geometry = new THREE.BufferGeometry();
            const count = 5000;
            const positions = new Float32Array(count * 3);
            for (let i = 0; i < count * 3; i += 3) {
                positions[i] = Math.random() * 200 - 100;
                positions[i + 1] = Math.random() * 100;
                positions[i + 2] = Math.random() * 200 - 100;
            }
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const material = new THREE.PointsMaterial({ color: 0xaaaaaf, size: 0.2, transparent: true, opacity: 0.6 });
            this.rainParticles = new THREE.Points(geometry, material);
            this.scene.add(this.rainParticles);

            if (type === 'storm') {
                const lGeo = new THREE.PlaneGeometry(1000, 1000);
                const lMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
                this.lightningPlane = new THREE.Mesh(lGeo, lMat);
                this.lightningPlane.position.y = 50;
                this.lightningPlane.rotation.x = Math.PI / 2;
                this.scene.add(this.lightningPlane);
            }
        } else if (type === 'snow') {
            const geometry = new THREE.BufferGeometry();
            const count = 3000;
            const positions = new Float32Array(count * 3);
            for (let i = 0; i < count * 3; i += 3) {
                positions[i] = Math.random() * 200 - 100;
                positions[i + 1] = Math.random() * 100;
                positions[i + 2] = Math.random() * 200 - 100;
            }
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.4, transparent: true, opacity: 0.8 });
            this.snowParticles = new THREE.Points(geometry, material);
            this.scene.add(this.snowParticles);
        }
    }
}

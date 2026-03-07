import * as THREE from 'three';

export class CameraControls {
    private keys: Record<string, boolean> = {};
    private panSpeed: number = 0.5;
    private zoomSpeed: number = 0.1;
    private minZoom: number = 0.5;
    private maxZoom: number = 5;

    constructor(
        private camera: THREE.OrthographicCamera,
        private domElement: HTMLElement
    ) {
        window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);
        window.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    }

    private onWheel(e: WheelEvent) {
        e.preventDefault();
        const zoomDelta = e.deltaY > 0 ? (1 - this.zoomSpeed) : (1 + this.zoomSpeed);
        this.camera.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.camera.zoom * zoomDelta));
        this.camera.updateProjectionMatrix();
    }

    public update() {
        // Simple WASD pan
        const direction = new THREE.Vector3();
        
        if (this.keys['w'] || this.keys['arrowup']) direction.z -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) direction.z += 1;
        if (this.keys['a'] || this.keys['arrowleft']) direction.x -= 1;
        if (this.keys['d'] || this.keys['arrowright']) direction.x += 1;

        if (direction.length() > 0) {
            direction.normalize().multiplyScalar(this.panSpeed / (this.camera.zoom * 0.5));
            // Rotate the direction to match our isometric view (45 degrees)
            // But for simple top-down/ortho, we just move on the XZ plane
            this.camera.position.add(direction);
        }
    }
}

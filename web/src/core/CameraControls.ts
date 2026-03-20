import * as THREE from 'three';

export class CameraControls {
    private keys: Record<string, boolean> = {};
    private panSpeed: number = 0.5;
    private zoomSpeed: number = 0.1;
    private minZoom: number = 0.5;
    private maxZoom: number = 5;
    
    // Memory leak fix: Store bound handlers for cleanup
    private keydownHandler = (e: KeyboardEvent) => this.keys[e.key.toLowerCase()] = true;
    private keyupHandler = (e: KeyboardEvent) => this.keys[e.key.toLowerCase()] = false;
    private wheelHandler = (e: WheelEvent) => this.onWheel(e);

    constructor(
        private camera: THREE.OrthographicCamera,
        private domElement: HTMLElement
    ) {
        window.addEventListener('keydown', this.keydownHandler);
        window.addEventListener('keyup', this.keyupHandler);
        window.addEventListener('wheel', this.wheelHandler, { passive: false });
    }
    
    /**
     * Cleanup method to prevent memory leaks
     * Call this when destroying the camera controls
     */
    public destroy() {
        window.removeEventListener('keydown', this.keydownHandler);
        window.removeEventListener('keyup', this.keyupHandler);
        window.removeEventListener('wheel', this.wheelHandler);
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

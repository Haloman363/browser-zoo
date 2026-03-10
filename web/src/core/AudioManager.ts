import * as THREE from 'three';

export class AudioManager {
    private listener: THREE.AudioListener;
    private ambientSounds: Map<string, THREE.Audio> = new Map();
    private music: THREE.Audio | null = null;
    private sfxBuffers: Map<string, THREE.AudioBuffer> = new Map();
    private musicBuffers: Map<string, THREE.AudioBuffer> = new Map();
    private animalBuffers: Map<string, THREE.AudioBuffer[]> = new Map();
    private loader: THREE.AudioLoader = new THREE.AudioLoader();

    private volumes = {
        music: 0.5,
        sfx: 0.5,
        ambient: 0.2
    };

    constructor(private camera: THREE.Camera) {
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);
    }

    public async init() {
        console.log('[AudioManager] Initializing...');
        
        // 1. UI & Basic SFX
        const sfx = [
            { name: 'click', url: './assets/sounds/uiclick.wav' },
            { name: 'place', url: './assets/sounds/place.wav' }
        ];

        for (const s of sfx) {
            try {
                const buffer = await this.loader.loadAsync(s.url);
                this.sfxBuffers.set(s.name, buffer);
            } catch (err) {
                console.error(`[AudioManager] Failed to load SFX ${s.name}:`, err);
            }
        }

        // 2. Music
        const music = [
            { name: 'mainmenu', url: './assets/sounds/mainmenu.wav' }
        ];

        for (const m of music) {
            try {
                const buffer = await this.loader.loadAsync(m.url);
                this.musicBuffers.set(m.name, buffer);
            } catch (err) {
                console.error(`[AudioManager] Failed to load Music ${m.name}:`, err);
            }
        }

        // 3. Ambient Loops
        const ambients = [
            { name: 'crowd', url: './assets/sounds/crwdloop.wav' },
            { name: 'birds', url: './assets/sounds/zbirds.wav' },
            { name: 'forest', url: './assets/sounds/Forest1.wav' },
            { name: 'sea', url: './assets/sounds/Sea1.wav' },
            { name: 'leaves', url: './assets/sounds/zleaves.wav' },
            { name: 'wind', url: './assets/sounds/zwind.wav' }
        ];

        for (const a of ambients) {
            try {
                const buffer = await this.loader.loadAsync(a.url);
                const sound = new THREE.Audio(this.listener);
                sound.setBuffer(buffer);
                sound.setLoop(true);
                sound.setVolume(this.volumes.ambient);
                this.ambientSounds.set(a.name, sound);
            } catch (err) {
                console.error(`[AudioManager] Failed to load ambient ${a.name}:`, err);
            }
        }
    }

    public playMusic(name: string, loop: boolean = true) {
        const buffer = this.musicBuffers.get(name);
        if (!buffer) return;

        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }

        if (!this.music) {
            this.music = new THREE.Audio(this.listener);
        }

        this.music.setBuffer(buffer);
        this.music.setLoop(loop);
        this.music.setVolume(this.volumes.music);
        this.music.play();
    }

    public stopMusic() {
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }
    }

    public playAmbient(name?: string) {
        if (name) {
            const s = this.ambientSounds.get(name);
            if (s && !s.isPlaying) s.play();
        } else {
            // Play default crowd/birds
            ['crowd', 'birds'].forEach(n => {
                const s = this.ambientSounds.get(n);
                if (s && !s.isPlaying) s.play();
            });
        }
    }

    public stopAmbient(name?: string) {
        if (name) {
            const s = this.ambientSounds.get(name);
            if (s && s.isPlaying) s.stop();
        } else {
            this.ambientSounds.forEach(s => {
                if (s.isPlaying) s.stop();
            });
        }
    }

    public setVolume(type: 'music' | 'sfx' | 'ambient', value: number) {
        this.volumes[type] = THREE.MathUtils.clamp(value, 0, 1);
        
        if (type === 'music' && this.music) {
            this.music.setVolume(this.volumes.music);
        } else if (type === 'ambient') {
            this.ambientSounds.forEach(s => s.setVolume(this.volumes.ambient));
        }
    }

    public getVolume(type: 'music' | 'sfx' | 'ambient'): number {
        return this.volumes[type];
    }

    public async loadAnimalSounds(animalId: string, filenames: string[]) {
        if (this.animalBuffers.has(animalId)) return;

        const buffers: THREE.AudioBuffer[] = [];
        for (const filename of filenames) {
            try {
                const buffer = await this.loader.loadAsync(`./assets/sounds/${animalId}/${filename}`);
                buffers.push(buffer);
            } catch (e) {
                console.warn(`[AudioManager] Could not load animal sound ${filename} for ${animalId}`);
            }
        }
        if (buffers.length > 0) {
            this.animalBuffers.set(animalId, buffers);
        }
    }

    public playAnimalSound(animalId: string, position: THREE.Vector3) {
        const buffers = this.animalBuffers.get(animalId);
        if (!buffers || buffers.length === 0) return;

        // Pick random sound from buffers
        const buffer = buffers[Math.floor(Math.random() * buffers.length)];
        
        const sound = new THREE.PositionalAudio(this.listener);
        sound.setBuffer(buffer);
        sound.setRefDistance(10);
        sound.setVolume(this.volumes.sfx * 1.2); // Relative boost for animal sounds
        
        const dummy = new THREE.Object3D();
        dummy.position.copy(position);
        this.camera.parent?.add(dummy);
        
        dummy.add(sound);
        sound.play();
        
        sound.onEnded = () => {
            dummy.remove(sound);
            dummy.parent?.remove(dummy);
        };
    }

    public playSfx(name: string) {
        const buffer = this.sfxBuffers.get(name);
        if (!buffer) return;

        const sound = new THREE.Audio(this.listener);
        sound.setBuffer(buffer);
        sound.setVolume(this.volumes.sfx);
        sound.play();
    }

    public playPlacementSound() {
        this.playSfx('place');
    }

    public playClickSound() {
        this.playSfx('click');
    }
}


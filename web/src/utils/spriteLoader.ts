import * as THREE from 'three';

// World units per source-art pixel. ZT1 sprites assume a 64px-wide tile diamond;
// our tiles are 2 world units square (~2.83 units across the diamond on screen).
export const PX_TO_WORLD = 0.045;

export interface AnimationState {
    materials: THREE.SpriteMaterial[];
    frameDuration: number;
}

const texLoader = new THREE.TextureLoader();

// The current asset extraction wrote BGR channel order — every sprite renders blue-shifted.
// Swap R/B at load time. Set to false after re-running the extractor with correct channels.
const ASSETS_ARE_BGR = true;

export function fixSpriteTexture(tex: THREE.Texture): THREE.Texture {
    if (!ASSETS_ARE_BGR) return tex;
    const img = tex.image as HTMLImageElement;
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
        const r = px[i];
        px[i] = px[i + 2];
        px[i + 2] = r;
    }
    ctx.putImageData(data, 0, 0);
    const fixed = new THREE.CanvasTexture(canvas);
    fixed.magFilter = tex.magFilter;
    fixed.minFilter = tex.minFilter;
    tex.dispose();
    return fixed;
}

async function loadFrames(base: string, dir: string, maxFrames: number): Promise<THREE.SpriteMaterial[]> {
    const urls = Array.from({ length: maxFrames }, (_, i) => `${base}/${dir}_${String(i).padStart(3, '0')}.png`);
    // Probe all candidate frames in parallel, then load the contiguous run that exists.
    // Content-type check matters: the dev server returns 200 + HTML for missing files (SPA fallback).
    const oks = await Promise.all(urls.map(u => fetch(u, { method: 'HEAD' })
        .then(r => r.ok && (r.headers.get('content-type') || '').includes('image'))
        .catch(() => false)));
    const miss = oks.indexOf(false);
    const count = miss === -1 ? maxFrames : miss;

    // Load in bounded batches — hundreds of parallel Image() loads can fail in Chromium.
    // A single bad frame degrades to a shorter animation instead of failing the whole load.
    const mats: THREE.SpriteMaterial[] = [];
    const batchSize = 8;
    for (let i = 0; i < count; i += batchSize) {
        const batch = await Promise.all(urls.slice(i, i + batchSize).map(async u => {
            try {
                let tex = await texLoader.loadAsync(u);
                tex.magFilter = THREE.NearestFilter;
                tex.minFilter = THREE.NearestFilter;
                tex = fixSpriteTexture(tex);
                return new THREE.SpriteMaterial({ map: tex, transparent: true });
            } catch (e) {
                console.warn(`[spriteLoader] Failed to load frame ${u}`, e);
                return null;
            }
        }));
        for (const m of batch) {
            if (!m) return mats;
            mats.push(m);
        }
    }
    return mats;
}

// Loads n/ne/e/se/s frame sets from `${base}/${dir}_NNN.png` and mirrors them for w/nw/sw.
export async function loadDirectionalAnims(base: string, maxFrames: number = 64): Promise<Record<string, AnimationState>> {
    const dirs = ['n', 'ne', 'e', 'se', 's'];
    const anims: Record<string, AnimationState> = {};
    await Promise.all(dirs.map(async d => {
        const mats = await loadFrames(base, d, maxFrames);
        if (mats.length > 0) anims[d.toUpperCase()] = { materials: mats, frameDuration: 1000 / 12 };
    }));

    const mirrors: Record<string, string> = { SW: 'SE', W: 'E', NW: 'NE' };
    for (const [target, source] of Object.entries(mirrors)) {
        const src = anims[source];
        if (!src) continue;
        anims[target] = {
            frameDuration: src.frameDuration,
            materials: src.materials.map(m => {
                const t = m.map!.clone();
                t.wrapS = THREE.RepeatWrapping;
                t.repeat.x = -1;
                t.offset.x = 1;
                t.needsUpdate = true; // cloned textures render black without this
                return new THREE.SpriteMaterial({ map: t, transparent: true });
            })
        };
    }
    return anims;
}

import { StatusMeter } from './StatusMeter';

export type HUDButtonID =
    'BuyAnimal' | 'BuyHabitat' | 'BuyObject' | 'BuyStaff' |
    'Undo' | 'Bulldoze' | 'Messages' | 'Research' | 'Options' |
    'ZoomIn' | 'ZoomOut' | 'RotL' | 'RotR' |
    'ZooStatus' | 'AnimalStatus' | 'GuestStatus' | 'HabitatStatus' | 'StaffStatus' |
    'Pause' | 'Play' | 'Snapshot';

export class HUD {
    private container: HTMLElement;
    private leftBar: HTMLElement;
    private bottomBar: HTMLElement;
    private moneyDisplay: HTMLElement | null = null;
    private dateDisplay: HTMLElement | null = null;
    private onButtonClickCallback: (id: HUDButtonID) => void = () => {};
    private onResizeCallback: ((leftW: number, bottomH: number) => void) | null = null;
    private minimapCanvas: HTMLCanvasElement | null = null;

    private zooMeter: StatusMeter | null = null;
    private animalMeter: StatusMeter | null = null;
    private guestMeter: StatusMeter | null = null;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'hud-container';
        this.applyStyles();

        this.leftBar = this.createLeftBar();
        this.bottomBar = this.createBottomBar();

        this.container.appendChild(this.leftBar);
        this.container.appendChild(this.bottomBar);
        document.body.appendChild(this.container);

        this.scaleToViewport();
        window.addEventListener('resize', () => this.scaleToViewport());
    }

    private scaleToViewport() {
        const scale = Math.min(window.innerWidth / 800, window.innerHeight / 600);
        const barH  = Math.round(114 * scale);
        const leftW = Math.round(33  * scale);

        // Left bar: uniform scale from top-left (position:absolute top:0, so transform works fine)
        this.leftBar.style.transform       = `scale(${scale})`;
        this.leftBar.style.transformOrigin = 'top left';

        // Bottom bar: set real height so it occupies the right amount of space
        this.bottomBar.style.height = `${barH}px`;

        const leftPanel   = this.bottomBar.children[0] as HTMLElement;
        const centerPanel = this.bottomBar.children[1] as HTMLElement;
        const rightPanel  = this.bottomBar.children[2] as HTMLElement;

        // Left panel (304x114) — set real scaled dimensions
        const lW = Math.round(304 * scale);
        leftPanel.style.width  = `${lW}px`;
        leftPanel.style.height = `${barH}px`;
        leftPanel.style.backgroundSize = `${lW}px ${barH}px`;
        leftPanel.style.transform = '';

        // Center panel (330x35) — set real scaled dimensions, flush to bottom
        const cW = Math.round(330 * scale);
        const cH = Math.round(35  * scale);
        centerPanel.style.width  = `${cW}px`;
        centerPanel.style.height = `${cH}px`;
        centerPanel.style.backgroundSize = `${cW}px ${cH}px`;
        centerPanel.style.transform = '';

        // Right panel (245x35) — set real scaled dimensions, flush to bottom
        const rW = Math.round(245 * scale);
        const rH = Math.round(35  * scale);
        rightPanel.style.width  = `${rW}px`;
        rightPanel.style.height = `${rH}px`;
        rightPanel.style.backgroundSize = `${rW}px ${rH}px`;
        rightPanel.style.transform = '';

        // Scale all buttons and meters inside bottom panels
        this.scaleButtonsIn(leftPanel,   scale);
        this.scaleButtonsIn(centerPanel, scale);
        this.scaleButtonsIn(rightPanel,  scale);

        if (this.zooMeter)    this.zooMeter.setScale(scale);
        if (this.animalMeter) this.animalMeter.setScale(scale);
        if (this.guestMeter)  this.guestMeter.setScale(scale);

        if (this.moneyDisplay) {
            this.moneyDisplay.style.left     = `${Math.round(170 * scale)}px`;
            this.moneyDisplay.style.top      = `${Math.round(9   * scale)}px`;
            this.moneyDisplay.style.fontSize = `${Math.round(14  * scale)}px`;
        }
        if (this.dateDisplay) {
            this.dateDisplay.style.left     = `${Math.round(90 * scale)}px`;
            this.dateDisplay.style.top      = `${Math.round(9  * scale)}px`;
            this.dateDisplay.style.fontSize = `${Math.round(12 * scale)}px`;
        }

        if (this.onResizeCallback) this.onResizeCallback(leftW, barH);
    }

    public onResize(callback: (leftW: number, bottomH: number) => void) {
        this.onResizeCallback = callback;
    }

    private scaleButtonsIn(parent: HTMLElement, scale: number) {
        for (const child of Array.from(parent.children) as HTMLElement[]) {
            if (!child.dataset.origW) continue;
            const w = Math.round(Number(child.dataset.origW) * scale);
            const h = Math.round(Number(child.dataset.origH) * scale);
            const x = Math.round(Number(child.dataset.origX) * scale);
            const y = Math.round(Number(child.dataset.origY) * scale);
            child.style.left   = `${x}px`;
            child.style.top    = `${y}px`;
            child.style.width  = `${w}px`;
            child.style.height = `${h}px`;
            if (!(child instanceof HTMLCanvasElement)) {
                child.style.backgroundSize = `${w}px ${h}px`;
            }
        }
    }

    private applyStyles() {
        Object.assign(this.container.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: '2000'
        });
    }

    private createLeftBar(): HTMLElement {
        // backgnd1: 33x478, backgnd2: 33x122 — total left bar is 33px wide
        const bar = document.createElement('div');
        Object.assign(bar.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '33px',
            height: '100vh',
            background: "url('./assets/ui/bg2/N_000.png') repeat-y",
            pointerEvents: 'auto'
        });

        const top = document.createElement('div');
        Object.assign(top.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '33px',
            height: '478px',
            background: "url('./assets/ui/backgnd1/N_000.png') no-repeat",
            backgroundSize: '33px 478px'
        });

        const bottom = document.createElement('div');
        Object.assign(bottom.style, {
            position: 'absolute',
            bottom: '114px', // sit above the bottom bar
            left: '0',
            width: '33px',
            height: '122px',
            background: "url('./assets/ui/backgnd2/N_000.png') no-repeat",
            backgroundSize: '33px 122px'
        });

        bar.appendChild(top);
        bar.appendChild(bottom);

        // Buy buttons: 43x43, centered in 33px bar → x = (33-43)/2 = -5, but clip so use x=0 or just left-align
        // The original .lyt placed them overlapping the bar edge. Center them at x=-5 (they hang left into padding)
        const buyX = -5;
        this.addButton(top, 'BuyAnimal',  './assets/ui/buyanim', 43, 43, buyX, 14);
        this.addButton(top, 'BuyHabitat', './assets/ui/habitat',  43, 43, buyX, 62);
        this.addButton(top, 'BuyObject',  './assets/ui/buyobj',   43, 43, buyX, 110);
        this.addButton(top, 'BuyStaff',   './assets/ui/person',   43, 43, buyX, 158);

        // Tool buttons: 35x31, centered → x = (33-35)/2 = -1
        const toolX = -1;
        this.addButton(top, 'Undo',     './assets/ui/undo',    35, 31, toolX, 258);
        this.addButton(top, 'Bulldoze', './assets/ui/bdoz',    35, 31, toolX, 293);
        this.addButton(top, 'Messages', './assets/ui/msgs',    35, 31, toolX, 328);
        this.addButton(top, 'Research', './assets/ui/resr',    35, 31, toolX, 363);
        this.addButton(top, 'Options',  './assets/ui/gameopt', 35, 31, toolX, 433);

        return bar;
    }

    private createBottomBar(): HTMLElement {
        // backgnd3: 304x114, backgnd4: 330x35, backgnd5: 245x35
        const bar = document.createElement('div');
        Object.assign(bar.style, {
            position: 'absolute',
            bottom: '0',
            left: '0',
            width: '100vw',
            height: '114px',
            background: "url('./assets/ui/bg3/N_000.png') repeat-x bottom",
            pointerEvents: 'auto'
        });

        const left = document.createElement('div');
        Object.assign(left.style, {
            position: 'absolute',
            bottom: '0',
            left: '0',
            width: '304px',
            height: '114px',
            background: "url('./assets/ui/backgnd3/N_000.png') no-repeat",
            backgroundSize: '304px 114px'
        });

        const center = document.createElement('div');
        Object.assign(center.style, {
            position: 'absolute',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '330px',
            height: '35px',
            background: "url('./assets/ui/backgnd4/N_000.png') no-repeat",
            backgroundSize: '330px 35px'
        });

        const right = document.createElement('div');
        Object.assign(right.style, {
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '245px',
            height: '35px',
            background: "url('./assets/ui/backgnd5/N_000.png') no-repeat",
            backgroundSize: '245px 35px'
        });

        bar.appendChild(left);
        bar.appendChild(center);
        bar.appendChild(right);

        // Minimap canvas — positioned per main.lyt (anchor=backgnd2, x=10 y=44 dx=139 dy=69)
        this.minimapCanvas = document.createElement('canvas');
        this.minimapCanvas.width  = 139;
        this.minimapCanvas.height = 69;
        this.minimapCanvas.dataset.origW = '139';
        this.minimapCanvas.dataset.origH = '69';
        this.minimapCanvas.dataset.origX = '10';
        this.minimapCanvas.dataset.origY = '44';
        Object.assign(this.minimapCanvas.style, {
            position: 'absolute',
            left: '10px',
            top: '44px',
            width: '139px',
            height: '69px',
            imageRendering: 'pixelated'
        });
        left.appendChild(this.minimapCanvas);

        // Controls per main.lyt coordinates (all anchored to backgnd2/left panel origin)
        this.addButton(left, 'ZoomIn',   './assets/ui/zoomin',  36, 22, 14, 17);
        this.addButton(left, 'ZoomOut',  './assets/ui/zoomout', 21, 25,  5, 24);
        this.addButton(left, 'RotR',     './assets/ui/rotr',    31, 32,  6, 40);
        this.addButton(left, 'RotL',     './assets/ui/rotl',    46, 30, 26, 27);
        this.addButton(left, 'Snapshot', './assets/ui/snap',    51, 31,  5, 86);
        this.addButton(left, 'Pause',    './assets/ui/pause',   35, 31, 150, 80);
        this.addButton(left, 'Play',     './assets/ui/play',    35, 31, 150, 80);

        // Center: date + money + zoo status meter
        // zstat: 32x32
        this.addButton(center, 'ZooStatus', './assets/ui/zstat', 32, 32, 2, 2);
        this.zooMeter = new StatusMeter(center, 36, 11);

        this.moneyDisplay = document.createElement('div');
        Object.assign(this.moneyDisplay.style, {
            position: 'absolute',
            left: '170px',
            top: '9px',
            width: '120px',
            textAlign: 'center',
            color: '#FFD43C',
            fontSize: '14px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            textShadow: '1px 1px 1px black'
        });
        this.moneyDisplay.innerText = '$0';
        center.appendChild(this.moneyDisplay);

        this.dateDisplay = document.createElement('div');
        Object.assign(this.dateDisplay.style, {
            position: 'absolute',
            left: '90px',
            top: '9px',
            width: '80px',
            textAlign: 'center',
            color: '#FFD43C',
            fontSize: '12px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            textShadow: '1px 1px 1px black'
        });
        this.dateDisplay.innerText = 'January Year 1';
        center.appendChild(this.dateDisplay);

        // Right: astat, gstat, hstat, staff — all 32x32, spaced evenly in 245px
        this.addButton(right, 'AnimalStatus',  './assets/ui/astat', 32, 32,   2, 2);
        this.animalMeter = new StatusMeter(right, 36, 11);

        this.addButton(right, 'GuestStatus',   './assets/ui/gstat', 32, 32,  65, 2);
        this.guestMeter = new StatusMeter(right, 99, 11);

        this.addButton(right, 'HabitatStatus', './assets/ui/hstat', 32, 32, 130, 2);
        this.addButton(right, 'StaffStatus',   './assets/ui/staff', 32, 32, 195, 2);

        return bar;
    }

    private addButton(parent: HTMLElement, id: HUDButtonID, assetPath: string, w: number, h: number, x: number, y: number): HTMLElement {
        const btn = document.createElement('div');
        btn.id = id;
        btn.dataset.origW = String(w);
        btn.dataset.origH = String(h);
        btn.dataset.origX = String(x);
        btn.dataset.origY = String(y);
        btn.dataset.assetPath = assetPath;
        Object.assign(btn.style, {
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: `${w}px`,
            height: `${h}px`,
            background: `url('${assetPath}/N_000.png') no-repeat`,
            backgroundSize: `${w}px ${h}px`,
            cursor: 'pointer'
        });

        btn.onmouseover = () => { btn.style.background = `url('${assetPath}/H_000.png') no-repeat`; btn.style.backgroundSize = `${w}px ${h}px`; };
        btn.onmouseout  = () => { btn.style.background = `url('${assetPath}/N_000.png') no-repeat`; btn.style.backgroundSize = `${w}px ${h}px`; };
        btn.onmousedown = () => { btn.style.background = `url('${assetPath}/S_000.png') no-repeat`; btn.style.backgroundSize = `${w}px ${h}px`; };
        btn.onmouseup   = () => { btn.style.background = `url('${assetPath}/H_000.png') no-repeat`; btn.style.backgroundSize = `${w}px ${h}px`; };

        btn.onclick = (e) => {
            e.stopPropagation();
            this.onButtonClickCallback(id);
        };

        parent.appendChild(btn);
        return btn;
    }

    public updateStatus(type: 'zoo' | 'animal' | 'guest', value: number) {
        if (type === 'zoo' && this.zooMeter) this.zooMeter.setValue(value);
        if (type === 'animal' && this.animalMeter) this.animalMeter.setValue(value);
        if (type === 'guest' && this.guestMeter) this.guestMeter.setValue(value);
    }

    public onButtonClick(callback: (id: HUDButtonID) => void) {
        this.onButtonClickCallback = callback;
    }

    public setMoney(amount: number) {
        if (this.moneyDisplay) {
            this.moneyDisplay.innerText = `$${amount.toLocaleString()}`;
        }
    }

    public setDate(date: string) {
        if (this.dateDisplay) {
            this.dateDisplay.innerText = date;
        }
    }

    public updateMinimap(terrainData: Uint8Array, gridW: number, gridH: number) {
        if (!this.minimapCanvas) return;
        const ctx = this.minimapCanvas.getContext('2d');
        if (!ctx) return;

        const mW = this.minimapCanvas.width;
        const mH = this.minimapCanvas.height;
        ctx.clearRect(0, 0, mW, mH);

        // Terrain colours matching the game's colour map
        const colours: Record<number, string> = { 0: '#4a7c3f', 1: '#c8b560', 2: '#8b6340', 3: '#2060a0' };

        // Draw isometric diamond: each tile maps to a pixel in iso projection
        const tileW = mW / gridW;
        const tileH = mH / gridH;

        for (let gz = 0; gz < gridH; gz++) {
            for (let gx = 0; gx < gridW; gx++) {
                const type = terrainData[gz * gridW + gx];
                ctx.fillStyle = colours[type] ?? '#4a7c3f';
                // Iso projection: x = (gx - gz + gridH) * mW/(gridW+gridH), y = (gx + gz) * mH/(gridW+gridH)*0.5
                const ix = ((gx - gz + gridH) / (gridW + gridH)) * mW;
                const iy = ((gx + gz) / (gridW + gridH)) * mH;
                ctx.fillRect(Math.round(ix), Math.round(iy), Math.ceil(tileW + 1), Math.ceil(tileH + 1));
            }
        }
    }

    public hide() {
        this.container.style.display = 'none';
    }

    public show() {
        this.container.style.display = 'block';
    }
}

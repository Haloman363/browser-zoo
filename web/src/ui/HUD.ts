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
    private moneyDisplay: HTMLElement;
    private dateDisplay: HTMLElement;
    private minimapCanvas: HTMLCanvasElement;
    private onButtonClickCallback: (id: HUDButtonID) => void = () => {};
    private onResizeCallback: ((leftW: number, bottomH: number) => void) | null = null;

    private zooMeter: StatusMeter;
    private animalMeter: StatusMeter;
    private guestMeter: StatusMeter;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'hud-container';
        // The container itself is a passthrough layer; the fixed bars inside catch events.
        Object.assign(this.container.style, { position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: '2000' });

        this.leftBar = document.createElement('div');
        this.leftBar.id = 'zt-left-bar';

        this.bottomBar = document.createElement('div');
        this.bottomBar.id = 'zt-bottom-bar';
        this.bottomBar.classList.add('zt-panel');
        this.leftBar.classList.add('zt-panel');

        this.buildLeftBar();
        const built = this.buildBottomBar();
        this.moneyDisplay = built.money;
        this.dateDisplay = built.date;
        this.minimapCanvas = built.minimap;
        this.zooMeter = built.zooMeter;
        this.animalMeter = built.animalMeter;
        this.guestMeter = built.guestMeter;

        this.container.appendChild(this.leftBar);
        this.container.appendChild(this.bottomBar);
        document.body.appendChild(this.container);

        // Report bar sizes so the renderer can offset the canvas. CSS owns layout;
        // we just measure it after it settles and on every resize.
        requestAnimationFrame(() => this.reportSize());
        window.addEventListener('resize', () => this.reportSize());
    }

    private reportSize() {
        if (!this.onResizeCallback) return;
        const leftW = this.leftBar.getBoundingClientRect().width;
        const bottomH = this.bottomBar.getBoundingClientRect().height;
        this.onResizeCallback(Math.round(leftW), Math.round(bottomH));
    }

    private makeButton(id: HUDButtonID, assetPath: string): HTMLElement {
        const btn = document.createElement('div');
        btn.id = id;
        btn.className = 'zt-btn';
        // CSS drives N/hover/pressed states from these custom properties.
        btn.style.setProperty('--glyph-n', `url('${assetPath}/N_000.png')`);
        btn.style.setProperty('--glyph-h', `url('${assetPath}/h_000.png')`);
        btn.style.setProperty('--glyph-s', `url('${assetPath}/s_000.png')`);
        btn.onclick = (e) => { e.stopPropagation(); this.onButtonClickCallback(id); };
        return btn;
    }

    private buildLeftBar() {
        // Buy tools at top
        for (const [id, path] of [
            ['BuyAnimal', './assets/ui/buyanim'], ['BuyHabitat', './assets/ui/habitat'],
            ['BuyObject', './assets/ui/buyobj'], ['BuyStaff', './assets/ui/person'],
        ] as [HUDButtonID, string][]) {
            this.leftBar.appendChild(this.makeButton(id, path));
        }

        const spacer = document.createElement('div');
        spacer.className = 'zt-spacer';
        this.leftBar.appendChild(spacer);

        // Management tools at bottom
        for (const [id, path] of [
            ['Undo', './assets/ui/undo'], ['Bulldoze', './assets/ui/bdoz'],
            ['Messages', './assets/ui/msgs'], ['Research', './assets/ui/resr'],
            ['Options', './assets/ui/gameopt'],
        ] as [HUDButtonID, string][]) {
            this.leftBar.appendChild(this.makeButton(id, path));
        }
    }

    private buildBottomBar() {
        // --- Left group: minimap + camera/time controls ---
        const leftGroup = document.createElement('div');
        leftGroup.className = 'zt-group';

        const minimap = document.createElement('canvas');
        minimap.id = 'zt-minimap';
        minimap.width = 139;
        minimap.height = 69;
        leftGroup.appendChild(minimap);

        for (const [id, path] of [
            ['ZoomIn', './assets/ui/zoomin'], ['ZoomOut', './assets/ui/zoomout'],
            ['RotL', './assets/ui/rotl'], ['RotR', './assets/ui/rotr'],
            ['Snapshot', './assets/ui/snap'], ['Pause', './assets/ui/pause'], ['Play', './assets/ui/play'],
        ] as [HUDButtonID, string][]) {
            leftGroup.appendChild(this.makeButton(id, path));
        }

        // --- Center group: zoo status + date + money ---
        const centerGroup = document.createElement('div');
        centerGroup.className = 'zt-group center';
        centerGroup.appendChild(this.makeButton('ZooStatus', './assets/ui/zstat'));
        const zooMeter = new StatusMeter(centerGroup);

        const date = document.createElement('div');
        date.className = 'zt-date';
        date.textContent = 'January Year 1';
        centerGroup.appendChild(date);

        const money = document.createElement('div');
        money.className = 'zt-money';
        money.textContent = '$0';
        centerGroup.appendChild(money);

        // --- Right group: status readouts ---
        const rightGroup = document.createElement('div');
        rightGroup.className = 'zt-group';
        rightGroup.appendChild(this.makeButton('AnimalStatus', './assets/ui/astat'));
        const animalMeter = new StatusMeter(rightGroup);
        rightGroup.appendChild(this.makeButton('GuestStatus', './assets/ui/gstat'));
        const guestMeter = new StatusMeter(rightGroup);
        rightGroup.appendChild(this.makeButton('HabitatStatus', './assets/ui/hstat'));
        rightGroup.appendChild(this.makeButton('StaffStatus', './assets/ui/staff'));

        this.bottomBar.appendChild(leftGroup);
        this.bottomBar.appendChild(centerGroup);
        this.bottomBar.appendChild(rightGroup);

        return { money, date, minimap, zooMeter, animalMeter, guestMeter };
    }

    public onResize(callback: (leftW: number, bottomH: number) => void) {
        this.onResizeCallback = callback;
        this.reportSize();
    }

    public onButtonClick(callback: (id: HUDButtonID) => void) {
        this.onButtonClickCallback = callback;
    }

    public updateStatus(type: 'zoo' | 'animal' | 'guest', value: number) {
        if (type === 'zoo') this.zooMeter.setValue(value);
        else if (type === 'animal') this.animalMeter.setValue(value);
        else if (type === 'guest') this.guestMeter.setValue(value);
    }

    public setMoney(amount: number) {
        this.moneyDisplay.textContent = `$${amount.toLocaleString()}`;
    }

    public setDate(date: string) {
        this.dateDisplay.textContent = date;
    }

    public updateMinimap(terrainData: Uint8Array, gridW: number, gridH: number) {
        const ctx = this.minimapCanvas.getContext('2d');
        if (!ctx) return;

        const mW = this.minimapCanvas.width;
        const mH = this.minimapCanvas.height;
        ctx.clearRect(0, 0, mW, mH);

        const colours: Record<number, string> = {
            0: '#4a7c3f', 1: '#c8b560', 2: '#8b6340', 3: '#2060a0',
            4: '#b0a955', 5: '#3d6b28', 6: '#7a5c44', 7: '#8a8a8a',
            8: '#a09a88', 9: '#e8ecf2', 10: '#1e4e9c', 11: '#6b8f3f',
            12: '#47723c', 13: '#b6b4a8', 14: '#46464a', 15: '#8a7b52'
        };

        const tileW = mW / gridW;
        const tileH = mH / gridH;

        for (let gz = 0; gz < gridH; gz++) {
            for (let gx = 0; gx < gridW; gx++) {
                const type = terrainData[gz * gridW + gx];
                ctx.fillStyle = colours[type] ?? '#4a7c3f';
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
        requestAnimationFrame(() => this.reportSize());
    }
}

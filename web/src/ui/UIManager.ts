export type BrushType = 'animal' | 'terrain' | 'scenery' | 'fence' | 'path' | 'staff';

export class UIManager {
    private container: HTMLElement;
    private cashHud: HTMLElement;
    private animalList: HTMLElement;
    private terrainList: HTMLElement;
    private sceneryList: HTMLElement;
    private fenceList: HTMLElement;
    private pathList: HTMLElement;
    private staffList: HTMLElement;
    private currentSelectedId: string | null = null;
    private currentBrushType: BrushType = 'animal';
    private onSelectCallback: (type: BrushType, id: string) => void = () => {};

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'ui-container';
        this.applyStyles();
        document.body.appendChild(this.container);

        this.cashHud = document.createElement('div');
        this.applyHudStyles();
        document.body.appendChild(this.cashHud);

        this.container.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold; border-bottom: 1px solid #555; padding-bottom: 5px;">
                Zoo Editor
            </div>
            <div style="font-size: 12px; color: #888; margin-top: 10px;">ANIMALS ($500)</div>
            <div id="animal-list"></div>
            
            <div style="font-size: 12px; color: #888; margin-top: 15px;">SCENERY ($100)</div>
            <div id="scenery-list"></div>

            <div style="font-size: 12px; color: #888; margin-top: 15px;">FENCES ($50)</div>
            <div id="fence-list"></div>

            <div style="font-size: 12px; color: #888; margin-top: 15px;">PATHS ($20)</div>
            <div id="path-list"></div>

            <div style="font-size: 12px; color: #888; margin-top: 15px;">STAFF ($1000)</div>
            <div id="staff-list"></div>

            <div style="font-size: 12px; color: #888; margin-top: 15px;">TERRAIN ($10)</div>
            <div id="terrain-list"></div>

            <div style="margin-top: 15px; font-size: 11px; color: #666;">
                WASD to pan<br>
                Scroll to zoom
            </div>
        `;

        this.animalList = this.container.querySelector('#animal-list')!;
        this.sceneryList = this.container.querySelector('#scenery-list')!;
        this.fenceList = this.container.querySelector('#fence-list')!;
        this.pathList = this.container.querySelector('#path-list')!;
        this.staffList = this.container.querySelector('#staff-list')!;
        this.terrainList = this.container.querySelector('#terrain-list')!;
        
        this.initTerrainList();
        this.initSceneryList();
        this.initFenceList();
        this.initPathList();
        this.initStaffList();
    }

    private initTerrainList() {
        const types = ['Grass', 'Sand', 'Dirt', 'Water'];
        types.forEach(name => {
            const btn = this.createButton(name, () => {
                this.selectItem('terrain', name);
                this.onSelectCallback('terrain', name);
            });
            this.terrainList.appendChild(btn);
        });
    }

    private initSceneryList() {
        const types = ['baobob', 'acacia', 'bamboo', 'bench', 'birch', 'cherry'];
        types.forEach(name => {
            const btn = this.createButton(name, () => {
                this.selectItem('scenery', name);
                this.onSelectCallback('scenery', name);
            });
            this.sceneryList.appendChild(btn);
        });
    }

    private initFenceList() {
        const types = ['bricklow', 'castiron', 'chaincon'];
        types.forEach(name => {
            const btn = this.createButton(name, () => {
                this.selectItem('fence', name);
                this.onSelectCallback('fence', name);
            });
            this.fenceList.appendChild(btn);
        });
    }

    private initPathList() {
        const types = ['Asphalt', 'Brick', 'DirtPath'];
        types.forEach(name => {
            const btn = this.createButton(name, () => {
                this.selectItem('path', name);
                this.onSelectCallback('path', name);
            });
            this.pathList.appendChild(btn);
        });
    }

    private initStaffList() {
        const types = ['keeper'];
        types.forEach(name => {
            const btn = this.createButton(`Hire ${name}`, () => {
                this.selectItem('staff', name);
                this.onSelectCallback('staff', name);
            });
            this.staffList.appendChild(btn);
        });
    }

    private createButton(text: string, onClick: () => void): HTMLElement {
        const btn = document.createElement('div');
        btn.innerText = text;
        Object.assign(btn.style, {
            padding: '5px',
            margin: '2px 0',
            background: '#333',
            cursor: 'pointer',
            borderRadius: '3px',
            textAlign: 'center',
            fontSize: '12px'
        });
        btn.onmouseover = () => btn.style.background = '#444';
        btn.onmouseout = () => {
            if (this.currentSelectedId === text || this.currentSelectedId === text.replace('Hire ', '')) btn.style.background = '#555';
            else btn.style.background = '#333';
        };
        btn.onclick = onClick;
        return btn;
    }

    private applyStyles() {
        Object.assign(this.container.style, {
            position: 'absolute',
            right: '20px',
            top: '20px',
            width: '180px',
            maxHeight: '80vh',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '15px',
            fontFamily: 'monospace',
            borderRadius: '5px',
            border: '1px solid #444',
            zIndex: '1000'
        });
    }

    private applyHudStyles() {
        Object.assign(this.cashHud.style, {
            position: 'absolute',
            left: '20px',
            bottom: '20px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#00ff00',
            padding: '10px 20px',
            fontFamily: 'monospace',
            fontSize: '24px',
            fontWeight: 'bold',
            borderRadius: '5px',
            border: '2px solid #00aa00',
            zIndex: '1000'
        });
    }

    public setCash(amount: number) {
        this.cashHud.innerText = `$${amount.toLocaleString()}`;
    }

    public showError(msg: string) {
        const err = document.createElement('div');
        err.innerText = msg;
        Object.assign(err.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 0, 0, 0.8)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            zIndex: '2000',
            pointerEvents: 'none',
            fontFamily: 'monospace'
        });
        document.body.appendChild(err);
        setTimeout(() => err.remove(), 2000);
    }

    public onSelect(callback: (type: BrushType, id: string) => void) {
        this.onSelectCallback = callback;
    }

    public updateAnimalList(animals: string[]) {
        this.animalList.innerHTML = '';
        animals.forEach(id => {
            const btn = this.createButton(id, () => {
                this.selectItem('animal', id);
                this.onSelectCallback('animal', id);
            });
            this.animalList.appendChild(btn);
        });
    }

    private selectItem(type: BrushType, id: string) {
        this.currentSelectedId = id;
        this.currentBrushType = type;
        const allBtns = Array.from(this.container.querySelectorAll('div[style*="cursor: pointer"]')) as HTMLElement[];
        allBtns.forEach(btn => {
            const btnText = btn.innerText.replace('Hire ', '');
            if (btnText === id) {
                btn.style.background = '#555';
                btn.style.border = '1px solid #888';
            } else {
                btn.style.background = '#333';
                btn.style.border = 'none';
            }
        });
    }
}

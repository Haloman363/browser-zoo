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
            background: "url('./assets/ui/backgnd1/N_000.png') no-repeat"
        });

        const bottom = document.createElement('div');
        Object.assign(bottom.style, {
            position: 'absolute',
            bottom: '0',
            left: '0',
            width: '33px',
            height: '122px',
            background: "url('./assets/ui/backgnd2/N_000.png') no-repeat"
        });

        bar.appendChild(top);
        bar.appendChild(bottom);

        // Add buttons
        this.addButton(top, 'BuyAnimal', './assets/ui/buyanim', 4, 60);
        this.addButton(top, 'BuyHabitat', './assets/ui/habitat', 4, 13);
        this.addButton(top, 'BuyObject', './assets/ui/buyobj', 4, 108);
        this.addButton(top, 'BuyStaff', './assets/ui/person', 4, 154);
        
        this.addButton(top, 'Undo', './assets/ui/undo', 1, 258);
        this.addButton(top, 'Bulldoze', './assets/ui/bdoz', 1, 293);
        this.addButton(top, 'Messages', './assets/ui/msgs', 1, 328);
        this.addButton(top, 'Research', './assets/ui/resr', 1, 363);
        this.addButton(top, 'Options', './assets/ui/gameopt', 1, 433);

        return bar;
    }

    private createBottomBar(): HTMLElement {
        const bar = document.createElement('div');
        Object.assign(bar.style, {
            position: 'absolute',
            bottom: '0',
            left: '0',
            width: '100vw',
            height: '114px',
            background: "url('./assets/ui/bg3/N_000.png') repeat-x",
            pointerEvents: 'auto'
        });

        const left = document.createElement('div');
        Object.assign(left.style, {
            position: 'absolute',
            bottom: '0',
            left: '0',
            width: '304px',
            height: '114px',
            background: "url('./assets/ui/backgnd3/N_000.png') no-repeat"
        });

        const center = document.createElement('div');
        Object.assign(center.style, {
            position: 'absolute',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '330px',
            height: '35px',
            background: "url('./assets/ui/backgnd4/N_000.png') no-repeat"
        });

        const right = document.createElement('div');
        Object.assign(right.style, {
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '245px',
            height: '35px',
            background: "url('./assets/ui/backgnd5/N_000.png') no-repeat"
        });

        bar.appendChild(left);
        bar.appendChild(center);
        bar.appendChild(right);

        // Mini-map controls
        this.addButton(left, 'ZoomIn', './assets/ui/zoomin', 14, 17);
        this.addButton(left, 'ZoomOut', './assets/ui/zoomout', 5, 24);
        this.addButton(left, 'RotL', './assets/ui/rotl', 26, 27);
        this.addButton(left, 'RotR', './assets/ui/rotr', 6, 40);

        // Snapshot button (on left bar usually)
        this.addButton(left, 'Snapshot', './assets/ui/snap', 5, 86);

        // Status Indicators (Center)
        this.addButton(center, 'ZooStatus', './assets/ui/zstat', 231, 3);
        this.zooMeter = new StatusMeter(center, 231 + 31, 3 + 9);

        // Money Display
        this.moneyDisplay = document.createElement('div');
        Object.assign(this.moneyDisplay.style, {
            position: 'absolute',
            left: '90px',
            top: '9px',
            width: '125px',
            textAlign: 'center',
            color: '#FFD43C',
            fontSize: '14px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            textShadow: '1px 1px 1px black'
        });
        this.moneyDisplay.innerText = '$0';
        center.appendChild(this.moneyDisplay);

        // Date Display
        this.dateDisplay = document.createElement('div');
        Object.assign(this.dateDisplay.style, {
            position: 'absolute',
            left: '5px',
            top: '9px',
            width: '100px',
            textAlign: 'center',
            color: '#FFD43C',
            fontSize: '12px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            textShadow: '1px 1px 1px black'
        });
        this.dateDisplay.innerText = 'January Year 1';
        center.appendChild(this.dateDisplay);

        // Status Indicators (Right)
        this.addButton(right, 'AnimalStatus', './assets/ui/astat', 0, 3);
        this.animalMeter = new StatusMeter(right, 0 + 32, 3 + 9);

        this.addButton(right, 'GuestStatus', './assets/ui/gstat', 85, 3);
        this.guestMeter = new StatusMeter(right, 85 + 32, 3 + 9);

        this.addButton(right, 'HabitatStatus', './assets/ui/hstat', 170, 3);
        this.addButton(right, 'StaffStatus', './assets/ui/staff', 206, 3);

        return bar;
    }

    private addButton(parent: HTMLElement, id: HUDButtonID, assetPath: string, x: number, y: number): HTMLElement {
        const btn = document.createElement('div');
        btn.id = id;
        Object.assign(btn.style, {
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: '24px',
            height: '24px',
            background: `url('${assetPath}/N_000.png') no-repeat`,
            cursor: 'pointer'
        });

        btn.onmouseover = () => btn.style.background = `url('${assetPath}/H_000.png') no-repeat`;
        btn.onmouseout = () => btn.style.background = `url('${assetPath}/N_000.png') no-repeat`;
        btn.onmousedown = () => btn.style.background = `url('${assetPath}/S_000.png') no-repeat`;
        btn.onmouseup = () => btn.style.background = `url('${assetPath}/H_000.png') no-repeat`;
        
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

    public hide() {
        this.container.style.display = 'none';
    }

    public show() {
        this.container.style.display = 'block';
    }
}

import { Catalog, CatalogItem } from './Catalog';

export type BrushType = 'animal' | 'terrain' | 'scenery' | 'fence' | 'path' | 'staff';

export class UIManager {
    private catalog: Catalog;
    private cashHud: HTMLElement;
    private currentSelectedId: string | null = null;
    private currentBrushType: BrushType = 'animal';
    private onSelectCallback: (type: BrushType, id: string, cost: number) => void = () => {};

    private animalItems: CatalogItem[] = [];
    private sceneryItems: CatalogItem[] = [];
    private fenceItems: CatalogItem[] = [];
    private staffItems: CatalogItem[] = [];
    private terrainItems: CatalogItem[] = [];
    private pathItems: CatalogItem[] = [];
    private shownItems: CatalogItem[] = [];

    constructor() {
        this.catalog = new Catalog();
        this.cashHud = document.createElement('div');
        this.applyHudStyles();
        document.body.appendChild(this.cashHud);

        this.initData();

        this.catalog.onSelect((id) => {
            const item = this.shownItems.find(i => i.id === id);
            const type = (item?.type as BrushType) || this.currentBrushType;
            this.selectItem(type, id);
            this.onSelectCallback(type, id, item?.cost ?? 0);
        });
    }

    private initData() {
        this.terrainItems = [
            { id: 'Grass', name: 'Grass', cost: 10, iconUrl: '', color: '#5c8a3a', type: 'terrain' },
            { id: 'Sand', name: 'Sand', cost: 10, iconUrl: '', color: '#d2b48c', type: 'terrain' },
            { id: 'Dirt', name: 'Dirt', cost: 10, iconUrl: '', color: '#8b4513', type: 'terrain' },
            { id: 'Water', name: 'Water', cost: 10, iconUrl: '', color: '#2a5adf', type: 'terrain' }
        ];

        this.pathItems = [
            { id: 'Asphalt', name: 'Asphalt Path', cost: 20, iconUrl: '', color: '#333333', type: 'path' },
            { id: 'Brick', name: 'Brick Path', cost: 20, iconUrl: '', color: '#a52a2a', type: 'path' },
            { id: 'DirtPath', name: 'Dirt Path', cost: 20, iconUrl: '', color: '#5d4037', type: 'path' }
        ];

        this.sceneryItems = [
            { id: 'baobob', name: 'Baobab Tree', cost: 100, iconUrl: './assets/ui/icons/baobob.png' },
            { id: 'acacia', name: 'Acacia Tree', cost: 100, iconUrl: './assets/ui/icons/acacia.png' },
            { id: 'bamboo', name: 'Bamboo', cost: 80, iconUrl: './assets/ui/icons/bamboo.png' },
            { id: 'bench', name: 'Bench', cost: 50, iconUrl: './assets/ui/icons/bench.png' },
            { id: 'birch', name: 'Birch Tree', cost: 100, iconUrl: './assets/ui/icons/birch.png' },
            { id: 'cherry', name: 'Cherry Tree', cost: 100, iconUrl: './assets/ui/icons/cherry.png' },
        ];

        this.fenceItems = [
            { id: 'bricklow', name: 'Brick Fence', cost: 50, iconUrl: './assets/ui/icons/bricklow.png', type: 'fence' },
            { id: 'castiron', name: 'Cast Iron Fence', cost: 75, iconUrl: './assets/ui/icons/castiron.png', type: 'fence' },
            { id: 'chaincon', name: 'Chain Link Fence', cost: 30, iconUrl: './assets/ui/icons/chaincon.png', type: 'fence' },
        ];

        this.staffItems = [
            { id: 'keeper', name: 'Zoo Keeper', cost: 800, iconUrl: './assets/ui/icons/keeper.png' },
            { id: 'maint', name: 'Maintenance', cost: 500, iconUrl: './assets/ui/icons/maint.png' },
            { id: 'guide', name: 'Tour Guide', cost: 600, iconUrl: './assets/ui/icons/guide.png' }
        ];
    }

    private applyHudStyles() {
        // Old Hud styles (will eventually be replaced by HUD.ts logic)
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
            zIndex: '1000',
            display: 'none' // Hide by default
        });
    }

    public setCash(amount: number) {
        this.cashHud.innerText = `$${amount.toLocaleString()}`;
    }

    public showError(message: string) {
        const toast = document.createElement('div');
        toast.innerText = message;
        Object.assign(toast.style, {
            position: 'fixed',
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(120, 0, 0, 0.9)',
            color: '#fff',
            padding: '8px 16px',
            fontFamily: 'monospace',
            fontSize: '16px',
            zIndex: '4000',
            borderRadius: '4px'
        });
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }

    public setMode(mode: string) {
        this.setCursor(mode);
    }

    private setCursor(mode: string) {
        let cursor = 'pointer';
        switch (mode) {
            case 'animal':
            case 'scenery':
            case 'fence':
            case 'staff':
                cursor = `url('./assets/ui/grabber/grabber.png'), auto`;
                break;
            case 'terrain':
                cursor = `url('./assets/ui/paint/paint.png'), auto`;
                break;
            case 'bulldoze':
                cursor = `url('./assets/ui/bulldoze/bulldoze.png'), auto`;
                break;
            case 'select':
            default:
                cursor = `url('./assets/ui/hand/hand.png'), auto`;
                break;
        }
        document.body.style.cursor = cursor;
    }

    public showCategory(type: BrushType) {
        this.currentBrushType = type;
        this.setCursor(type);

        switch (type) {
            case 'animal':
                this.catalog.setTitle('animals');
                this.shownItems = this.animalItems;
                break;
            case 'scenery':
                this.catalog.setTitle('objects');
                this.shownItems = this.sceneryItems;
                break;
            case 'staff':
                this.catalog.setTitle('staff');
                this.shownItems = this.staffItems;
                break;
            case 'fence':
            case 'path':
            case 'terrain':
                // ZT1's habitat panel combines fences, terrain, and paths
                this.catalog.setTitle('habitat');
                this.shownItems = [...this.fenceItems, ...this.terrainItems, ...this.pathItems];
                break;
        }
        this.catalog.setItems(this.shownItems);
        this.catalog.show();
    }

    public hide() {
        this.catalog.hide();
        this.cashHud.style.display = 'none';
    }

    public show() {
        // Just show cash hud, catalog shown via showCategory
        this.cashHud.style.display = 'block';
    }

    public setBottomOffset(px: number) {
        this.catalog.setBottomOffset(px);
    }

    public onSelect(callback: (type: BrushType, id: string, cost: number) => void) {
        this.onSelectCallback = callback;
    }

    public updateAnimalList(animals: string[]) {
        const names: Record<string, string> = {
            afrbuf: 'African Buffalo', gorilla: 'Gorilla', lion: 'Lion', tiger: 'Bengal Tiger',
            chimpanz: 'Chimpanzee', eleph: 'African Elephant', giraffe: 'Giraffe', hippo: 'Hippo',
            ostrich: 'Ostrich', zebra: 'Zebra', gallim: 'Gallimimus', plateo: 'Plateosaurus',
            asieleph: 'Asian Elephant', bongo: 'Bongo', yeti: 'Yeti', baracuda: 'Barracuda',
            reindeer: 'Reindeer', mtnlion: 'Mountain Lion', llama: 'Llama', blckbuck: 'Blackbuck',
            bigfoot: 'Bigfoot', mexwolf: 'Mexican Wolf', lochness: 'Loch Ness Monster',
            wilddog: 'African Wild Dog', asblckbr: 'Asian Black Bear', komodo: 'Komodo Dragon',
            megath: 'Megatherium'
        };
        const costs: Record<string, number> = {
            lion: 10000, tiger: 10000, gorilla: 8000, eleph: 12000, giraffe: 6000,
            hippo: 7000, chimpanz: 5000, zebra: 4000, ostrich: 3000, afrbuf: 5000,
            gallim: 8000, plateo: 9000, asieleph: 11000, bongo: 4000, yeti: 15000,
            baracuda: 5000, reindeer: 4000, mtnlion: 8000, llama: 3000, blckbuck: 3500,
            bigfoot: 15000, mexwolf: 6000, lochness: 20000, wilddog: 5000, asblckbr: 7000,
            komodo: 6000, megath: 9000
        };
        this.animalItems = animals.map(id => ({
            id,
            name: names[id] || id,
            cost: costs[id] || 500,
            iconUrl: `./assets/ui/icons/${id}.png`
        }));
    }

    private selectItem(type: BrushType, id: string) {
        this.currentSelectedId = id;
        this.currentBrushType = type;
    }
}

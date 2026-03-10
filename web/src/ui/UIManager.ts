import { Catalog, CatalogItem } from './Catalog';

export type BrushType = 'animal' | 'terrain' | 'scenery' | 'fence' | 'path' | 'staff';

export class UIManager {
    private catalog: Catalog;
    private cashHud: HTMLElement;
    private currentSelectedId: string | null = null;
    private currentBrushType: BrushType = 'animal';
    private onSelectCallback: (type: BrushType, id: string) => void = () => {};

    private animalItems: CatalogItem[] = [];
    private sceneryItems: CatalogItem[] = [];
    private fenceItems: CatalogItem[] = [];
    private staffItems: CatalogItem[] = [];
    private terrainItems: CatalogItem[] = [];

    constructor() {
        this.catalog = new Catalog();
        this.cashHud = document.createElement('div');
        this.applyHudStyles();
        document.body.appendChild(this.cashHud);

        this.initData();
        
        this.catalog.onSelect((id) => {
            this.selectItem(this.currentBrushType, id);
            this.onSelectCallback(this.currentBrushType, id);
        });
    }

    private initData() {
        // Placeholder data initialization
        // In a real app, this would be loaded from metadata.json files
        this.terrainItems = [
            { id: 'Grass', name: 'Grass', cost: 10, iconUrl: '' },
            { id: 'Sand', name: 'Sand', cost: 10, iconUrl: '' },
            { id: 'Dirt', name: 'Dirt', cost: 10, iconUrl: '' },
            { id: 'Water', name: 'Water', cost: 10, iconUrl: '' }
        ];

        this.sceneryItems = ['baobob', 'acacia', 'bamboo', 'bench', 'birch', 'cherry'].map(id => ({
            id, name: id, cost: 100, iconUrl: ''
        }));

        this.fenceItems = ['bricklow', 'castiron', 'chaincon'].map(id => ({
            id, name: id, cost: 50, iconUrl: ''
        }));

        this.staffItems = [
            { id: 'keeper', name: 'Zoo Keeper', cost: 800, iconUrl: './assets/ui/icons/keeper.png' },
            { id: 'maint', name: 'Maintenance Worker', cost: 500, iconUrl: './assets/ui/icons/maint.png' },
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
        this.catalog.setTitle(type);
        this.setCursor(type);
        
        switch (type) {
            case 'animal':
                this.catalog.setItems(this.animalItems);
                break;
            case 'scenery':
                this.catalog.setItems(this.sceneryItems);
                break;
            case 'fence':
                this.catalog.setItems(this.fenceItems);
                break;
            case 'staff':
                this.catalog.setItems(this.staffItems);
                break;
            case 'terrain':
                this.catalog.setItems(this.terrainItems);
                break;
        }
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

    public onSelect(callback: (type: BrushType, id: string) => void) {
        this.onSelectCallback = callback;
    }

    public updateAnimalList(animals: string[]) {
        this.animalItems = animals.map(id => ({
            id,
            name: id,
            cost: 500,
            iconUrl: `./assets/ui/icons/${id}.png`
        }));
    }

    private selectItem(type: BrushType, id: string) {
        this.currentSelectedId = id;
        this.currentBrushType = type;
    }
}

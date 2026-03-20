export interface CatalogItem {
    id: string;
    name: string;
    cost: number;
    iconUrl: string;
}

export class Catalog {
    private container: HTMLElement;
    private itemsContainer: HTMLElement;
    private titleDisplay: HTMLElement;
    private onSelectCallback: (id: string) => void = () => {};

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'catalog-container';
        this.applyStyles();
        
        const background = document.createElement('div');
        Object.assign(background.style, {
            width: '171px',
            height: '439px',
            background: "url('./assets/ui/objpan/N_000.png') no-repeat",
            position: 'relative'
        });
        
        this.titleDisplay = document.createElement('div');
        Object.assign(this.titleDisplay.style, {
            position: 'absolute',
            top: '4px',
            left: '35px',
            width: '100px',
            color: '#FFE4AD',
            fontSize: '12px',
            fontFamily: 'monospace',
            textAlign: 'center',
            fontWeight: 'bold'
        });
        this.titleDisplay.innerText = 'CATALOG';
        background.appendChild(this.titleDisplay);

        const closeBtn = document.createElement('div');
        Object.assign(closeBtn.style, {
            position: 'absolute',
            top: '3px',
            right: '26px',
            width: '16px',
            height: '16px',
            background: "url('./assets/ui/close/N_000.png') no-repeat",
            cursor: 'pointer'
        });
        closeBtn.onclick = () => this.hide();
        background.appendChild(closeBtn);

        this.itemsContainer = document.createElement('div');
        Object.assign(this.itemsContainer.style, {
            position: 'absolute',
            top: '51px',
            left: '38px',
            width: '102px',
            height: '204px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 48px)',
            gap: '2px',
            padding: '2px'
        });
        background.appendChild(this.itemsContainer);

        this.container.appendChild(background);
        document.body.appendChild(this.container);
        this.hide();
    }

    private applyStyles() {
        Object.assign(this.container.style, {
            position: 'absolute',
            top: '6px',
            left: '17px', // Anchor 1032 + offset
            zIndex: '2500',
            pointerEvents: 'auto'
        });
    }

    public setTitle(title: string) {
        this.titleDisplay.innerText = title.toUpperCase();
    }

    public setItems(items: CatalogItem[]) {
        this.itemsContainer.textContent = '';
        items.forEach(item => {
            const btn = document.createElement('div');
            Object.assign(btn.style, {
                width: '48px',
                height: '48px',
                background: "url('./assets/ui/border/N_000.png') no-repeat",
                cursor: 'pointer',
                position: 'relative'
            });
            
            const icon = document.createElement('img');
            icon.src = item.iconUrl;
            Object.assign(icon.style, {
                width: '32px',
                height: '32px',
                position: 'absolute',
                top: '8px',
                left: '8px'
            });
            btn.appendChild(icon);

            btn.onclick = () => this.onSelectCallback(item.id);
            btn.title = `${item.name} ($${item.cost})`;
            
            this.itemsContainer.appendChild(btn);
        });
    }

    public onSelect(callback: (id: string) => void) {
        this.onSelectCallback = callback;
    }

    public show() {
        this.container.style.display = 'block';
    }

    public hide() {
        this.container.style.display = 'none';
    }
}

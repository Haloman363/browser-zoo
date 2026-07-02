export interface CatalogItem {
    id: string;
    name: string;
    cost: number;
    iconUrl: string;
    color?: string;   // fallback swatch when there is no icon image
    type?: string;    // brush type override (lets one panel mix terrain/paths/fences)
}

export class Catalog {
    private container: HTMLElement;
    private itemsContainer: HTMLElement;
    private titleDisplay: HTMLElement;
    private onSelectCallback: (id: string) => void = () => {};

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'catalog-container';
        this.container.classList.add('zt-panel');
        // Docked at the left edge, above the bottom bar; sits beside the toolbar.
        Object.assign(this.container.style, {
            position: 'fixed',
            left: 'calc(var(--bar-left-w) + 8px)',
            bottom: 'calc(var(--bar-bottom-h) + 8px)',
            width: 'min(40vw, 220px)',
            maxHeight: 'calc(100vh - var(--bar-bottom-h) - 24px)',
            padding: '10px',
            borderRadius: 'var(--panel-radius)',
            display: 'none',
            flexDirection: 'column',
            gap: '8px',
            zIndex: '2500',
            pointerEvents: 'auto'
        });

        const header = document.createElement('div');
        Object.assign(header.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center' });

        this.titleDisplay = document.createElement('b');
        this.titleDisplay.style.color = 'var(--zt-gold)';
        this.titleDisplay.textContent = 'CATALOG';
        header.appendChild(this.titleDisplay);

        const close = document.createElement('div');
        close.textContent = '✕';
        Object.assign(close.style, { cursor: 'pointer', color: 'var(--zt-text)', padding: '0 4px' });
        close.onclick = () => this.hide();
        header.appendChild(close);
        this.container.appendChild(header);

        this.itemsContainer = document.createElement('div');
        Object.assign(this.itemsContainer.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
            gap: '6px',
            overflowY: 'auto'
        });
        this.container.appendChild(this.itemsContainer);

        document.body.appendChild(this.container);
    }

    // Kept for API compatibility; CSS vars now handle offset so this is a no-op.
    public setBottomOffset(_px: number) {}

    public setTitle(title: string) {
        this.titleDisplay.textContent = title.toUpperCase();
    }

    public setItems(items: CatalogItem[]) {
        this.itemsContainer.textContent = '';
        items.forEach(item => {
            const btn = document.createElement('div');
            Object.assign(btn.style, {
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.3)', border: '1px solid var(--zt-border)', borderRadius: '4px',
                cursor: 'pointer'
            });
            btn.onmouseenter = () => { btn.style.borderColor = 'var(--zt-accent)'; };
            btn.onmouseleave = () => { btn.style.borderColor = 'var(--zt-border)'; };

            if (item.iconUrl) {
                const icon = document.createElement('img');
                icon.src = item.iconUrl;
                Object.assign(icon.style, { width: '32px', height: '32px', imageRendering: 'pixelated' });
                btn.appendChild(icon);
            } else {
                const swatch = document.createElement('div');
                Object.assign(swatch.style, { width: '28px', height: '28px', background: item.color || '#666', border: '1px solid #333' });
                btn.appendChild(swatch);
            }

            btn.onclick = () => this.onSelectCallback(item.id);
            btn.title = `${item.name} ($${item.cost})`;
            this.itemsContainer.appendChild(btn);
        });
    }

    public onSelect(callback: (id: string) => void) {
        this.onSelectCallback = callback;
    }

    public show() {
        this.container.style.display = 'flex';
    }

    public hide() {
        this.container.style.display = 'none';
    }
}

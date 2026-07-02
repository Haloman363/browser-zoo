import { StatusMeter } from './StatusMeter';

export class StatusWindow {
    private container: HTMLElement;
    private nameDisplay: HTMLElement;
    private thoughtsDisplay: HTMLElement;
    private happiness: StatusMeter;
    private hunger: StatusMeter;
    private health: StatusMeter;
    private habitat: StatusMeter;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'entity-info-panel';
        this.container.classList.add('zt-panel');
        // Docked bottom-right, above the bottom bar. Not a centred modal.
        Object.assign(this.container.style, {
            position: 'fixed',
            bottom: 'calc(var(--bar-bottom-h) + 12px)',
            right: '16px',
            width: 'min(90vw, 260px)',
            padding: '12px',
            borderRadius: 'var(--panel-radius)',
            display: 'none',
            zIndex: '3000',
            pointerEvents: 'auto'
        });

        const header = document.createElement('div');
        Object.assign(header.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' });

        this.nameDisplay = document.createElement('b');
        this.nameDisplay.style.color = 'var(--zt-gold)';
        header.appendChild(this.nameDisplay);

        const close = document.createElement('div');
        close.textContent = '✕';
        Object.assign(close.style, { cursor: 'pointer', color: 'var(--zt-text)', padding: '0 4px' });
        close.onclick = () => this.hide();
        header.appendChild(close);
        this.container.appendChild(header);

        this.thoughtsDisplay = document.createElement('div');
        Object.assign(this.thoughtsDisplay.style, { fontSize: '12px', fontStyle: 'italic', marginBottom: '10px', color: 'var(--zt-text)' });
        this.container.appendChild(this.thoughtsDisplay);

        this.happiness = this.meterRow('Happiness');
        this.hunger = this.meterRow('Food');
        this.health = this.meterRow('Health');
        this.habitat = this.meterRow('Habitat');

        document.body.appendChild(this.container);
    }

    private meterRow(label: string): StatusMeter {
        const row = document.createElement('div');
        Object.assign(row.style, { display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0', fontSize: '12px' });
        const lbl = document.createElement('span');
        lbl.textContent = label;
        Object.assign(lbl.style, { width: '70px', color: 'var(--zt-text)' });
        row.appendChild(lbl);
        const meter = new StatusMeter(row);
        // Let the meter stretch to fill the row rather than its default fixed width.
        (row.lastElementChild as HTMLElement).style.flex = '1';
        (row.lastElementChild as HTMLElement).style.width = 'auto';
        this.container.appendChild(row);
        return meter;
    }

    public show(name: string, stats: any, thoughts: string[]) {
        this.nameDisplay.textContent = name.toUpperCase();
        this.thoughtsDisplay.textContent = thoughts[0] || 'Doing fine.';
        this.happiness.setValue(stats.happiness ?? 50);
        this.hunger.setValue(stats.hunger ?? 50);
        this.health.setValue(stats.health ?? 50);
        this.habitat.setValue(stats.suitability ?? 50);
        this.container.style.display = 'block';
    }

    public hide() {
        this.container.style.display = 'none';
    }
}

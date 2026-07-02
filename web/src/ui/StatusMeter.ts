// Status meter — CSS-sized (see .zt-meter in ui.css). Fill colour swaps by value.
export class StatusMeter {
    private bar: HTMLElement;

    constructor(parent: HTMLElement) {
        const container = document.createElement('div');
        container.className = 'zt-meter';

        this.bar = document.createElement('div');
        container.appendChild(this.bar);
        parent.appendChild(container);
        this.setValue(50);
    }

    public setValue(percent: number) {
        percent = Math.max(0, Math.min(100, percent));
        this.bar.style.width = `${percent}%`;

        const asset = percent < 25 ? 'statr' : percent < 50 ? 'staty' : 'statg';
        this.bar.style.backgroundImage = `url('./assets/ui/${asset}/N_000.png')`;
    }
}

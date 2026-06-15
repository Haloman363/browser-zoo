export class StatusMeter {
    private container: HTMLElement;
    private progressBar: HTMLElement;
    private origX: number;
    private origY: number;

    constructor(parent: HTMLElement, x: number, y: number) {
        this.origX = x;
        this.origY = y;

        this.container = document.createElement('div');
        Object.assign(this.container.style, {
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: '45px',
            height: '12px',
            background: "url('./assets/ui/progbck/N_000.png') no-repeat",
            backgroundSize: '45px 12px',
            overflow: 'hidden'
        });

        this.progressBar = document.createElement('div');
        Object.assign(this.progressBar.style, {
            height: '100%',
            width: '100%',
            transition: 'width 0.3s, background-image 0.3s'
        });

        this.container.appendChild(this.progressBar);
        parent.appendChild(this.container);
        this.setValue(50);
    }

    public setValue(percent: number) {
        percent = Math.max(0, Math.min(100, percent));
        this.progressBar.style.width = `${percent}%`;

        let asset = 'statg';
        if (percent < 25) asset = 'statr';
        else if (percent < 50) asset = 'staty';

        this.progressBar.style.backgroundImage = `url('./assets/ui/${asset}/N_000.png')`;
    }

    public setScale(scale: number) {
        const w = Math.round(45 * scale);
        const h = Math.round(12 * scale);
        this.container.style.left = `${Math.round(this.origX * scale)}px`;
        this.container.style.top = `${Math.round(this.origY * scale)}px`;
        this.container.style.width = `${w}px`;
        this.container.style.height = `${h}px`;
        this.container.style.backgroundSize = `${w}px ${h}px`;
    }
}

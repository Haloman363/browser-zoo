export class StatusMeter {
    private container: HTMLElement;
    private progressBar: HTMLElement;

    constructor(parent: HTMLElement, x: number, y: number) {
        this.container = document.createElement('div');
        Object.assign(this.container.style, {
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: '45px',
            height: '12px',
            background: "url('./assets/ui/progbck/N_000.png') no-repeat",
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
        this.setValue(50); // Default to middle
    }

    public setValue(percent: number) {
        percent = Math.max(0, Math.min(100, percent));
        this.progressBar.style.width = `${percent}%`;
        
        let asset = 'statg'; // Green
        if (percent < 25) asset = 'statr'; // Red
        else if (percent < 50) asset = 'staty'; // Yellow
        
        this.progressBar.style.backgroundImage = `url('./assets/ui/${asset}/N_000.png')`;
    }
}

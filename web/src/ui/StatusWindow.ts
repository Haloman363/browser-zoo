export class StatusWindow {
    private container: HTMLElement;
    private nameDisplay: HTMLElement;
    private thoughtsDisplay: HTMLElement;
    
    private happinessMeter: HTMLElement;
    private hungerMeter: HTMLElement;
    private healthMeter: HTMLElement;
    private habitatMeter: HTMLElement;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'entity-info-panel';
        this.applyStyles();
        
        const background = document.createElement('div');
        Object.assign(background.style, {
            width: '226px',
            height: '212px',
            background: "url('./assets/ui/ainfopan/N_000.png') no-repeat",
            position: 'relative'
        });

        // Title
        const title = document.createElement('div');
        Object.assign(title.style, {
            position: 'absolute',
            top: '3px',
            left: '75px',
            width: '125px',
            color: '#FFE4AD',
            fontSize: '12px',
            fontWeight: 'bold',
            fontFamily: 'monospace'
        });
        title.innerText = 'ANIMAL INFO';
        background.appendChild(title);

        // Name
        this.nameDisplay = document.createElement('div');
        Object.assign(this.nameDisplay.style, {
            position: 'absolute',
            top: '27px',
            left: '71px',
            width: '141px',
            color: '#FFDA5A',
            fontSize: '14px',
            fontWeight: 'bold',
            textAlign: 'center',
            fontFamily: 'monospace'
        });
        background.appendChild(this.nameDisplay);

        // Close Button
        const closeBtn = document.createElement('div');
        Object.assign(closeBtn.style, {
            position: 'absolute',
            top: '1px',
            right: '13px',
            width: '16px',
            height: '16px',
            background: "url('./assets/ui/close/N_000.png') no-repeat",
            cursor: 'pointer'
        });
        closeBtn.onclick = () => this.hide();
        background.appendChild(closeBtn);

        // Meters
        this.happinessMeter = this.createMeter(background, 91, 'ichappy');
        this.hungerMeter = this.createMeter(background, 121, 'icfood');
        this.healthMeter = this.createMeter(background, 154, 'ichealth');
        this.habitatMeter = this.createMeter(background, 183, 'ichabtat');

        // Thoughts (simplified for now)
        this.thoughtsDisplay = document.createElement('div');
        Object.assign(this.thoughtsDisplay.style, {
            position: 'absolute',
            top: '55px',
            left: '20px',
            width: '180px',
            height: '30px',
            color: '#fff',
            fontSize: '11px',
            fontFamily: 'monospace',
            overflowY: 'auto'
        });
        background.appendChild(this.thoughtsDisplay);

        this.container.appendChild(background);
        document.body.appendChild(this.container);
        this.hide();
    }

    private createMeter(parent: HTMLElement, y: number, icon: string): HTMLElement {
        const iconEl = document.createElement('div');
        Object.assign(iconEl.style, {
            position: 'absolute',
            left: '25px',
            top: `${y - 9}px`, // Adjusted based on .lyt
            width: '32px',
            height: '32px',
            background: `url('./assets/ui/${icon}/N_000.png') no-repeat`
        });
        parent.appendChild(iconEl);

        const bg = document.createElement('div');
        Object.assign(bg.style, {
            position: 'absolute',
            left: '68px',
            top: `${y}px`,
            width: '114px',
            height: '14px',
            background: "url('./assets/ui/blankmtr/N_000.png') no-repeat"
        });

        const fill = document.createElement('div');
        Object.assign(fill.style, {
            height: '100%',
            width: '50%',
            transition: 'width 0.3s, background-image 0.3s'
        });
        bg.appendChild(fill);
        parent.appendChild(bg);
        return fill;
    }

    private updateMeter(fill: HTMLElement, percent: number) {
        percent = Math.max(0, Math.min(100, percent));
        fill.style.width = `${percent}%`;
        let asset = 'statg';
        if (percent < 25) asset = 'statr';
        else if (percent < 50) asset = 'staty';
        fill.style.backgroundImage = `url('./assets/ui/${asset}/N_000.png')`;
    }

    private applyStyles() {
        Object.assign(this.container.style, {
            position: 'absolute',
            bottom: '120px', // Above bottom bar
            right: '20px',
            zIndex: '3000',
            pointerEvents: 'auto'
        });
    }

    public show(name: string, stats: any, thoughts: string[]) {
        this.nameDisplay.innerText = name.toUpperCase();
        this.thoughtsDisplay.innerText = thoughts[0] || "Doing fine.";
        
        this.updateMeter(this.happinessMeter, stats.happiness || 50);
        this.updateMeter(this.hungerMeter, stats.hunger || 50);
        this.updateMeter(this.healthMeter, stats.health || 50);
        this.updateMeter(this.habitatMeter, stats.suitability || 50);
        
        this.container.style.display = 'block';
    }

    public hide() {
        this.container.style.display = 'none';
    }
}

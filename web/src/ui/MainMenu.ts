export class MainMenu {
    private container: HTMLElement;
    private onPlayCallback: (mode: 'scenario' | 'freeform') => void = () => {};

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'main-menu';
        this.applyStyles();
        this.render();
        document.body.appendChild(this.container);
    }

    private applyStyles() {
        Object.assign(this.container.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            backgroundImage: "url('./assets/ui/mainbck/N_000.png')",
            backgroundSize: '800px 600px',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: 'black',
            zIndex: '5000',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'Tahoma, Verdana, sans-serif'
        });
    }

    private render() {
        const menuWrapper = document.createElement('div');
        Object.assign(menuWrapper.style, {
            position: 'relative',
            width: '800px',
            height: '600px',
            // border: '1px solid #444' // Debug border
        });

        // Coordinates from startup.lyt
        const buttons = [
            { id: 'PlayScenario', text: 'New Scenario Game', y: 260, dx: 350, mode: 'scenario' as const },
            { id: 'PlayFreeform', text: 'New Freeform Game', y: 300, dx: 268, mode: 'freeform' as const },
            { id: 'LoadGame', text: 'Load Game', y: 340, dx: 268 },
            { id: 'ContinueGame', text: 'Continue Game', y: 380, dx: 268 },
            { id: 'ZooItems', text: 'Zoo Items', y: 430, dx: 320 },
            { id: 'Credits', text: 'Credits', y: 470, dx: 236 },
            { id: 'Exit', text: 'Exit', y: 510, dx: 236 }
        ];

        buttons.forEach(btnInfo => {
            const btn = document.createElement('div');
            btn.innerText = btnInfo.text;
            Object.assign(btn.style, {
                position: 'absolute',
                top: `${btnInfo.y}px`,
                left: '50%',
                transform: 'translateX(-50%)',
                width: `${btnInfo.dx}px`,
                padding: '10px',
                textAlign: 'center',
                color: '#FFBA10',
                background: 'rgba(131, 125, 53, 0.5)', // Placeholder background
                border: '2px solid #837D35',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '18px',
                textShadow: '2px 2px 2px black',
                transition: 'all 0.1s'
            });

            btn.onmouseover = () => {
                btn.style.color = '#FFDF29';
                btn.style.background = 'rgba(131, 125, 53, 0.8)';
            };
            btn.onmouseout = () => {
                btn.style.color = '#FFBA10';
                btn.style.background = 'rgba(131, 125, 53, 0.5)';
            };

            btn.onclick = () => {
                if (btnInfo.mode) {
                    this.onPlayCallback(btnInfo.mode);
                } else if (btnInfo.id === 'Exit') {
                    window.close();
                }
            };

            menuWrapper.appendChild(btn);
        });

        this.container.appendChild(menuWrapper);
    }

    public onPlay(callback: (mode: 'scenario' | 'freeform') => void) {
        this.onPlayCallback = callback;
    }

    public hide() {
        this.container.style.display = 'none';
    }

    public show() {
        this.container.style.display = 'flex';
    }
}

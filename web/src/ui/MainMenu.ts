export class MainMenu {
    private container: HTMLElement;
    private menuWrapper: HTMLElement;
    private scenarioWrapper: HTMLElement | null = null;
    private onPlayCallback: (mode: 'scenario' | 'freeform', scenarioId?: string) => void = () => {};
    private onNetworkCallback: (action: 'host' | 'join') => void = () => {};
    private onLoadCallback: () => void = () => {};
    private onContinueCallback: () => void = () => {};

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'main-menu';
        this.applyStyles();
        
        this.menuWrapper = document.createElement('div');
        this.renderMain();
        this.container.appendChild(this.menuWrapper);
        
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

    private renderMain() {
        this.menuWrapper.textContent = '';
        Object.assign(this.menuWrapper.style, {
            position: 'relative',
            width: 'min(800px, 100vw)',
            height: 'min(600px, 100vh)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingBottom: '40px',
            boxSizing: 'border-box',
            overflowY: 'auto'
        });

        const buttons = [
            { id: 'PlayScenario', text: 'New Scenario Game', action: () => this.showScenarios() },
            { id: 'PlayFreeform', text: 'New Freeform Game', mode: 'freeform' as const },
            { id: 'Multiplayer', text: 'Multiplayer', action: () => this.showMultiplayerSubmenu() },
            { id: 'LoadGame', text: 'Load Game', action: () => this.onLoadCallback() },
            { id: 'ContinueGame', text: 'Continue Game', action: () => this.onContinueCallback() },
        ];

        buttons.forEach(btnInfo => {
            const btn = document.createElement('div');
            btn.innerText = btnInfo.text;
            Object.assign(btn.style, {
                width: '320px',
                maxWidth: '90%',
                padding: '10px',
                margin: '4px 0',
                textAlign: 'center',
                color: '#FFBA10',
                background: 'rgba(131, 125, 53, 0.5)',
                border: '2px solid #837D35',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '18px',
                textShadow: '2px 2px 2px black',
                transition: 'all 0.1s',
                flexShrink: '0'
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
                if (btnInfo.action) {
                    btnInfo.action();
                } else if (btnInfo.mode) {
                    this.onPlayCallback(btnInfo.mode);
                }
            };

            this.menuWrapper.appendChild(btn);
        });
    }

    private showMultiplayerSubmenu() {
        this.menuWrapper.style.display = 'none';
        const submenuWrapper = document.createElement('div');
        Object.assign(submenuWrapper.style, {
            position: 'relative',
            width: 'min(800px, 100vw)',
            height: 'min(600px, 100vh)',
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflowY: 'auto',
            color: 'white',
            fontFamily: 'Tahoma, Verdana, sans-serif',
            boxSizing: 'border-box',
            padding: '20px 10px'
        });

        const title = document.createElement('h2');
        title.innerText = 'MULTIPLAYER';
        Object.assign(title.style, { color: '#FFBA10', marginBottom: '30px', textShadow: '2px 2px 2px black' });
        submenuWrapper.appendChild(title);

        const subButtons = [
            { text: 'Host Game', action: () => this.onNetworkCallback('host') },
            { text: 'Join Game', action: () => this.onNetworkCallback('join') },
        ];

        subButtons.forEach(btnInfo => {
            const btn = document.createElement('div');
            btn.innerText = btnInfo.text;
            Object.assign(btn.style, {
                width: '268px',
                padding: '10px',
                margin: '8px',
                textAlign: 'center',
                color: '#FFBA10',
                background: 'rgba(131, 125, 53, 0.5)',
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
            btn.onclick = () => btnInfo.action();
            submenuWrapper.appendChild(btn);
        });

        const back = document.createElement('div');
        back.innerText = 'BACK';
        Object.assign(back.style, { marginTop: '24px', cursor: 'pointer', color: '#888', fontSize: '16px' });
        back.onmouseover = () => { back.style.color = '#ccc'; };
        back.onmouseout = () => { back.style.color = '#888'; };
        back.onclick = () => {
            submenuWrapper.remove();
            this.menuWrapper.style.display = 'block';
        };
        submenuWrapper.appendChild(back);

        this.container.appendChild(submenuWrapper);
    }

    private showScenarios() {
        this.menuWrapper.style.display = 'none';
        if (this.scenarioWrapper) this.scenarioWrapper.remove();

        this.scenarioWrapper = document.createElement('div');
        Object.assign(this.scenarioWrapper.style, {
            position: 'relative',
            width: 'min(800px, 100vw)',
            height: 'min(600px, 100vh)',
            background: "rgba(0,0,0,0.8)",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            overflowY: 'auto',
            color: 'white',
            fontFamily: 'monospace',
            boxSizing: 'border-box',
            padding: '20px 10px'
        });

        const title = document.createElement('h1');
        title.innerText = 'SELECT SCENARIO';
        this.scenarioWrapper.appendChild(title);

        const scenarios = [
            { id: 'scn01', name: 'Tutorial 1: The Basics' },
            { id: 'scn02', name: 'Tutorial 2: Animal Care' },
            { id: 'scn05', name: 'Small Village Zoo' },
            { id: 'beach', name: 'Beach Zoo' },
            { id: 'lagoon', name: 'Lagoon' },
            { id: 'svalley', name: 'Scenic Valley' },
            { id: 'tundra', name: 'Tundra' },
            { id: 'cratlake', name: 'Crater Lake' },
            { id: 'highland', name: 'Highlands' },
            { id: 'jungriv', name: 'Jungle River' },
            { id: 'nile', name: 'River Nile' },
            { id: 'med_bch', name: 'Island Resort' },
            { id: 'dinolrg', name: 'Dino Park (Large)' },
            { id: 'lunar', name: 'Lunar Zoo' }
        ];

        scenarios.forEach(s => {
            const btn = document.createElement('div');
            btn.innerText = s.name;
            Object.assign(btn.style, {
                padding: '10px',
                margin: '5px',
                border: '1px solid #837D35',
                cursor: 'pointer',
                width: '300px',
                textAlign: 'center'
            });
            btn.onclick = () => this.onPlayCallback('scenario', s.id);
            this.scenarioWrapper.appendChild(btn);
        });

        const back = document.createElement('div');
        back.innerText = 'BACK';
        Object.assign(back.style, { marginTop: '20px', cursor: 'pointer', color: '#888' });
        back.onclick = () => {
            this.scenarioWrapper?.remove();
            this.menuWrapper.style.display = 'block';
        };
        this.scenarioWrapper.appendChild(back);

        this.container.appendChild(this.scenarioWrapper);
    }

    public onPlay(callback: (mode: 'scenario' | 'freeform', scenarioId?: string) => void) {
        this.onPlayCallback = callback;
    }

    public onNetworkAction(callback: (action: 'host' | 'join') => void) {
        this.onNetworkCallback = callback;
    }

    public onLoad(callback: () => void) {
        this.onLoadCallback = callback;
    }

    public onContinue(callback: () => void) {
        this.onContinueCallback = callback;
    }

    public hide() {
        this.container.style.display = 'none';
    }

    public show() {
        this.container.style.display = 'flex';
    }
}

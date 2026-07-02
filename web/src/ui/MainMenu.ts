export class MainMenu {
    private container: HTMLElement;
    private wrap: HTMLElement;
    private onPlayCallback: (mode: 'scenario' | 'freeform', scenarioId?: string) => void = () => {};
    private onNetworkCallback: (action: 'host' | 'join') => void = () => {};
    private onLoadCallback: () => void = () => {};
    private onContinueCallback: () => void = () => {};

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'zt-menu';
        // background-size: cover fills any viewport — no more 4:3 letterbox.
        this.container.style.backgroundImage = "url('./assets/ui/mainbck/N_000.png')";

        this.wrap = document.createElement('div');
        this.wrap.className = 'zt-menu-wrap';
        this.container.appendChild(this.wrap);

        this.renderMain();
        document.body.appendChild(this.container);
    }

    /** Build a menu button with the shared skin. */
    private button(text: string, onClick: () => void): HTMLElement {
        const btn = document.createElement('div');
        btn.className = 'zt-menu-btn';
        btn.textContent = text;
        btn.onclick = onClick;
        return btn;
    }

    /** Swap the wrap's contents for a new screen. */
    private setScreen(children: HTMLElement[], heading?: string) {
        this.wrap.textContent = '';
        if (heading) {
            const h = document.createElement('h1');
            h.textContent = heading;
            h.style.textAlign = 'center';
            h.style.color = 'var(--zt-gold)';
            this.wrap.appendChild(h);
        }
        children.forEach(c => this.wrap.appendChild(c));
    }

    private renderMain() {
        this.setScreen([
            this.button('New Scenario Game', () => this.showScenarios()),
            this.button('New Freeform Game', () => this.onPlayCallback('freeform')),
            this.button('Multiplayer', () => this.showMultiplayer()),
            this.button('Load Game', () => this.onLoadCallback()),
            this.button('Continue Game', () => this.onContinueCallback()),
        ]);
    }

    private showMultiplayer() {
        this.setScreen([
            this.button('Host Game', () => this.onNetworkCallback('host')),
            this.button('Join Game', () => this.onNetworkCallback('join')),
            this.button('Back', () => this.renderMain()),
        ], 'Multiplayer');
    }

    private showScenarios() {
        const scenarios: [string, string][] = [
            ['scn01', 'Tutorial 1: The Basics'], ['scn02', 'Tutorial 2: Animal Care'],
            ['scn05', 'Small Village Zoo'], ['beach', 'Beach Zoo'], ['lagoon', 'Lagoon'],
            ['svalley', 'Scenic Valley'], ['tundra', 'Tundra'], ['cratlake', 'Crater Lake'],
            ['highland', 'Highlands'], ['jungriv', 'Jungle River'], ['nile', 'River Nile'],
            ['med_bch', 'Island Resort'], ['dinolrg', 'Dino Park (Large)'], ['lunar', 'Lunar Zoo'],
        ];
        const btns = scenarios.map(([id, name]) => this.button(name, () => this.onPlayCallback('scenario', id)));
        btns.push(this.button('Back', () => this.renderMain()));
        this.setScreen(btns, 'Select Scenario');
    }

    public onPlay(cb: (mode: 'scenario' | 'freeform', scenarioId?: string) => void) { this.onPlayCallback = cb; }
    public onNetworkAction(cb: (action: 'host' | 'join') => void) { this.onNetworkCallback = cb; }
    public onLoad(cb: () => void) { this.onLoadCallback = cb; }
    public onContinue(cb: () => void) { this.onContinueCallback = cb; }

    public hide() { this.container.style.display = 'none'; }
    public show() { this.container.style.display = 'flex'; this.renderMain(); }
}

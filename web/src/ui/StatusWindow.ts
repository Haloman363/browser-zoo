export class StatusWindow {
    private container: HTMLElement;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'status-window';
        this.applyStyles();
        document.body.appendChild(this.container);
        this.hide();
    }

    private applyStyles() {
        Object.assign(this.container.style, {
            position: 'absolute',
            left: '20px',
            top: '20px',
            width: '250px',
            background: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            padding: '20px',
            fontFamily: 'monospace',
            borderRadius: '10px',
            border: '2px solid #555',
            zIndex: '1500',
            pointerEvents: 'auto',
            display: 'none',
            boxShadow: '0 0 15px rgba(0,0,0,0.5)'
        });
    }

    public show(title: string, stats: Record<string, any>, thoughts: string[]) {
        let statsHtml = '';
        for (const [key, val] of Object.entries(stats)) {
            statsHtml += `<div style="margin-bottom: 5px;"><span style="color: #aaa;">${key}:</span> ${val}</div>`;
        }

        let thoughtsHtml = thoughts.length > 0 
            ? thoughts.map(t => `<div style="font-style: italic; margin-top: 5px; color: #00ff00;">"${t}"</div>`).join('')
            : '<div style="color: #666; margin-top: 5px;">No thoughts...</div>';

        this.container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; padding-bottom: 10px; margin-bottom: 10px;">
                <span style="font-weight: bold; font-size: 18px;">${title}</span>
                <span id="close-status" style="cursor: pointer; color: #ff4444;">[X]</span>
            </div>
            <div id="stats-area">${statsHtml}</div>
            <div style="margin-top: 15px; border-top: 1px solid #444; padding-top: 10px;">
                <div style="font-size: 12px; color: #888; margin-bottom: 5px;">THOUGHTS</div>
                ${thoughtsHtml}
            </div>
        `;

        this.container.style.display = 'block';
        this.container.querySelector('#close-status')!.addEventListener('click', () => this.hide());
    }

    public hide() {
        this.container.style.display = 'none';
    }
}

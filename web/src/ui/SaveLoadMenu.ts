import { PersistenceManager, ZooSaveData } from '../core/PersistenceManager';
import { AudioManager } from '../core/AudioManager';

export class SaveLoadMenu {
    private backdrop: HTMLElement;
    private saveListContainer: HTMLElement;
    private nameInput: HTMLInputElement;
    private onSaveCallback: (name: string) => void = () => {};
    private onLoadCallback: (data: ZooSaveData) => void = () => {};

    constructor(private persistenceManager: PersistenceManager, private audioManager: AudioManager) {
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'zt-modal-backdrop';
        this.backdrop.style.display = 'none';
        this.backdrop.onclick = (e) => { if (e.target === this.backdrop) this.hide(); };

        const modal = document.createElement('div');
        modal.className = 'zt-modal zt-panel';
        modal.style.minWidth = 'min(90vw, 340px)';

        const title = document.createElement('h2');
        title.textContent = 'Options / Save';
        modal.appendChild(title);

        // --- Volume sliders ---
        const volHeading = document.createElement('div');
        volHeading.textContent = 'Volume';
        volHeading.style.color = 'var(--zt-gold)';
        volHeading.style.fontWeight = 'bold';
        modal.appendChild(volHeading);

        for (const [label, type] of [['Music', 'music'], ['SFX', 'sfx'], ['Ambient', 'ambient']] as [string, 'music' | 'sfx' | 'ambient'][]) {
            modal.appendChild(this.slider(label, type));
        }

        const hr = document.createElement('div');
        Object.assign(hr.style, { height: '1px', background: 'rgba(255,255,255,0.18)', margin: '8px 0' });
        modal.appendChild(hr);

        // --- Save new ---
        const saveRow = document.createElement('div');
        Object.assign(saveRow.style, { display: 'flex', gap: '8px' });

        this.nameInput = document.createElement('input');
        this.nameInput.placeholder = 'Zoo Name';
        Object.assign(this.nameInput.style, {
            flex: '1', background: '#000', color: 'var(--zt-gold)', border: '1px solid var(--zt-border)',
            borderRadius: '4px', fontFamily: 'monospace', padding: '6px'
        });
        saveRow.appendChild(this.nameInput);

        const saveBtn = document.createElement('div');
        saveBtn.className = 'zt-menu-btn';
        saveBtn.textContent = 'Save';
        saveBtn.style.padding = '6px 16px';
        saveBtn.onclick = () => {
            if (this.nameInput.value) this.onSaveCallback(this.nameInput.value);
            this.refreshList();
        };
        saveRow.appendChild(saveBtn);
        modal.appendChild(saveRow);

        // --- Save list ---
        this.saveListContainer = document.createElement('div');
        Object.assign(this.saveListContainer.style, { display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '40vh', overflowY: 'auto' });
        modal.appendChild(this.saveListContainer);

        const close = document.createElement('div');
        close.className = 'zt-menu-btn';
        close.textContent = 'Close';
        close.onclick = () => this.hide();
        modal.appendChild(close);

        this.backdrop.appendChild(modal);
        document.body.appendChild(this.backdrop);
    }

    private slider(label: string, type: 'music' | 'sfx' | 'ambient'): HTMLElement {
        const row = document.createElement('div');
        Object.assign(row.style, { display: 'flex', alignItems: 'center', gap: '10px' });

        const l = document.createElement('label');
        l.textContent = label;
        Object.assign(l.style, { width: '70px', color: 'var(--zt-text)', fontSize: '13px' });

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0'; slider.max = '1'; slider.step = '0.05';
        slider.value = this.audioManager.getVolume(type).toString();
        Object.assign(slider.style, { flex: '1', accentColor: 'var(--zt-accent)' });
        slider.oninput = () => this.audioManager.setVolume(type, parseFloat(slider.value));

        row.appendChild(l);
        row.appendChild(slider);
        return row;
    }

    public refreshList() {
        this.saveListContainer.textContent = '';
        for (const name of this.persistenceManager.listSaves()) {
            const row = document.createElement('div');
            Object.assign(row.style, {
                padding: '8px 10px', background: 'rgba(60,74,63,0.6)', border: '1px solid var(--zt-border)',
                borderRadius: '4px', color: 'var(--zt-text)', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            });

            const nameLabel = document.createElement('span');
            nameLabel.textContent = name;
            nameLabel.style.flex = '1';
            nameLabel.onclick = () => {
                const data = this.persistenceManager.load(name);
                if (data) this.onLoadCallback(data);
                this.hide();
            };
            row.appendChild(nameLabel);

            const del = document.createElement('span');
            del.textContent = '✕';
            Object.assign(del.style, { color: '#ff5d5d', padding: '0 4px' });
            del.onclick = (e) => {
                e.stopPropagation();
                this.persistenceManager.deleteSave(name);
                this.refreshList();
            };
            row.appendChild(del);

            this.saveListContainer.appendChild(row);
        }
    }

    public onSave(cb: (name: string) => void) { this.onSaveCallback = cb; }
    public onLoad(cb: (data: ZooSaveData) => void) { this.onLoadCallback = cb; }

    public show() {
        this.refreshList();
        this.backdrop.style.display = 'flex';
    }

    public hide() { this.backdrop.style.display = 'none'; }
}

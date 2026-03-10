import { PersistenceManager, ZooSaveData } from '../core/PersistenceManager';
import { AudioManager } from '../core/AudioManager';

export class SaveLoadMenu {
    private container: HTMLElement;
    private saveListContainer: HTMLElement;
    private nameInput: HTMLInputElement;
    private onSaveCallback: (name: string) => void = () => {};
    private onLoadCallback: (data: ZooSaveData) => void = () => {};

    constructor(private persistenceManager: PersistenceManager, private audioManager: AudioManager) {
        this.container = document.createElement('div');
        this.container.id = 'save-load-menu';
        this.applyStyles();
        
        const background = document.createElement('div');
        Object.assign(background.style, {
            width: '171px',
            height: '439px',
            background: "url('./assets/ui/objpan/N_000.png') no-repeat",
            position: 'relative',
            pointerEvents: 'auto'
        });

        // Title
        const title = document.createElement('div');
        Object.assign(title.style, {
            position: 'absolute', top: '4px', left: '35px', width: '100px',
            color: '#FFE4AD', fontSize: '12px', fontFamily: 'monospace', textAlign: 'center', fontWeight: 'bold'
        });
        title.innerText = 'OPTIONS / SAVE';
        background.appendChild(title);

        // Volume Section
        const volumeTitle = document.createElement('div');
        Object.assign(volumeTitle.style, {
            position: 'absolute', top: '25px', left: '20px', width: '130px',
            color: '#FFDA5A', fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold'
        });
        volumeTitle.innerText = '--- VOLUME ---';
        background.appendChild(volumeTitle);

        const createSlider = (label: string, top: number, type: 'music' | 'sfx' | 'ambient') => {
            const row = document.createElement('div');
            Object.assign(row.style, {
                position: 'absolute', top: `${top}px`, left: '20px', width: '130px',
                display: 'flex', flexDirection: 'column', gap: '2px'
            });

            const l = document.createElement('label');
            l.innerText = label;
            l.style.fontSize = '9px';
            l.style.color = '#fff';

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '0';
            slider.max = '1';
            slider.step = '0.05';
            slider.value = this.audioManager.getVolume(type).toString();
            slider.style.width = '100%';
            slider.style.accentColor = '#837D35';
            
            slider.oninput = () => {
                this.audioManager.setVolume(type, parseFloat(slider.value));
            };

            row.appendChild(l);
            row.appendChild(slider);
            background.appendChild(row);
        };

        createSlider('MUSIC', 40, 'music');
        createSlider('SFX', 70, 'sfx');
        createSlider('AMBIENT', 100, 'ambient');

        // Divider
        const divider = document.createElement('div');
        Object.assign(divider.style, {
            position: 'absolute', top: '135px', left: '20px', width: '130px',
            height: '1px', background: 'rgba(255,255,255,0.2)'
        });
        background.appendChild(divider);

        // Name Input
        this.nameInput = document.createElement('input');
        this.nameInput.placeholder = 'Zoo Name';
        Object.assign(this.nameInput.style, {
            position: 'absolute', top: '145px', left: '20px', width: '130px',
            background: '#000', color: '#FFDA5A', border: '1px solid #837D35',
            fontSize: '11px', fontFamily: 'monospace', padding: '2px'
        });
        background.appendChild(this.nameInput);

        const saveBtn = document.createElement('div');
        saveBtn.innerText = 'SAVE NEW';
        Object.assign(saveBtn.style, {
            position: 'absolute', top: '170px', left: '20px', width: '130px',
            background: '#837D35', color: '#000', fontSize: '10px', fontWeight: 'bold',
            textAlign: 'center', cursor: 'pointer', padding: '2px'
        });
        saveBtn.onclick = () => {
            if (this.nameInput.value) this.onSaveCallback(this.nameInput.value);
            this.refreshList();
        };
        background.appendChild(saveBtn);

        // List Container
        this.saveListContainer = document.createElement('div');
        Object.assign(this.saveListContainer.style, {
            position: 'absolute', top: '200px', left: '20px', width: '130px', height: '215px',
            overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px'
        });
        background.appendChild(this.saveListContainer);

        // Close Button
        const closeBtn = document.createElement('div');
        Object.assign(closeBtn.style, {
            position: 'absolute', top: '3px', right: '26px', width: '16px', height: '16px',
            background: "url('./assets/ui/close/N_000.png') no-repeat", cursor: 'pointer'
        });
        closeBtn.onclick = () => this.hide();
        background.appendChild(closeBtn);

        this.container.appendChild(background);
        document.body.appendChild(this.container);
        this.hide();
    }

    private applyStyles() {
        Object.assign(this.container.style, {
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: '4500', display: 'none'
        });
    }

    public refreshList() {
        this.saveListContainer.innerHTML = '';
        const saves = this.persistenceManager.listSaves();
        saves.forEach(name => {
            const row = document.createElement('div');
            Object.assign(row.style, {
                padding: '5px', background: 'rgba(131, 125, 53, 0.3)', border: '1px solid #837D35',
                fontSize: '10px', color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between'
            });
            
            const nameLabel = document.createElement('span');
            nameLabel.innerText = name;
            nameLabel.onclick = () => {
                const data = this.persistenceManager.load(name);
                if (data) this.onLoadCallback(data);
                this.hide();
            };
            row.appendChild(nameLabel);

            const del = document.createElement('span');
            del.innerText = 'X';
            del.style.color = '#ff0000';
            del.onclick = (e) => {
                e.stopPropagation();
                this.persistenceManager.deleteSave(name);
                this.refreshList();
            };
            row.appendChild(del);

            this.saveListContainer.appendChild(row);
        });
    }

    public onSave(cb: (name: string) => void) { this.onSaveCallback = cb; }
    public onLoad(cb: (data: ZooSaveData) => void) { this.onLoadCallback = cb; }

    public show() {
        this.refreshList();
        this.container.style.display = 'block';
    }

    public hide() { this.container.style.display = 'none'; }
}

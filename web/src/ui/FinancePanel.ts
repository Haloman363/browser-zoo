import { EconomyManager } from '../core/EconomyManager';

export class FinancePanel {
    private container: HTMLElement;
    private content: HTMLElement;

    constructor(private economyManager: EconomyManager) {
        this.container = document.createElement('div');
        this.container.id = 'finance-panel';
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
            position: 'absolute',
            top: '4px',
            left: '35px',
            width: '100px',
            color: '#FFE4AD',
            fontSize: '12px',
            fontFamily: 'monospace',
            textAlign: 'center',
            fontWeight: 'bold'
        });
        title.innerText = 'FINANCES';
        background.appendChild(title);

        // Close Button
        const closeBtn = document.createElement('div');
        Object.assign(closeBtn.style, {
            position: 'absolute',
            top: '3px',
            right: '26px',
            width: '16px',
            height: '16px',
            background: "url('./assets/ui/close/N_000.png') no-repeat",
            cursor: 'pointer'
        });
        closeBtn.onclick = () => this.hide();
        background.appendChild(closeBtn);

        // Content Area
        this.content = document.createElement('div');
        Object.assign(this.content.style, {
            position: 'absolute',
            top: '55px',
            left: '20px',
            width: '130px',
            color: '#FFDA5A',
            fontSize: '11px',
            fontFamily: 'monospace',
            lineHeight: '1.5'
        });
        background.appendChild(this.content);

        // Pricing Controls
        const pricing = document.createElement('div');
        Object.assign(pricing.style, {
            position: 'absolute',
            bottom: '100px',
            left: '20px',
            width: '130px',
            color: '#FFE4AD',
            fontFamily: 'monospace',
            fontSize: '10px'
        });
        pricing.innerHTML = 'ADMISSION FEE:';
        
        const feeRow = document.createElement('div');
        Object.assign(feeRow.style, { display: 'flex', alignItems: 'center', marginTop: '5px' });
        
        const minus = this.createButton('-', () => {
            this.economyManager.setAdmissionFee(this.economyManager.getAdmissionFee() - 5);
            this.updateContent();
        });
        
        this.feeValue = document.createElement('span');
        Object.assign(this.feeValue.style, { width: '40px', textAlign: 'center', color: '#fff' });
        
        const plus = this.createButton('+', () => {
            this.economyManager.setAdmissionFee(this.economyManager.getAdmissionFee() + 5);
            this.updateContent();
        });

        feeRow.appendChild(minus);
        feeRow.appendChild(this.feeValue);
        feeRow.appendChild(plus);
        pricing.appendChild(feeRow);

        const concessionLabel = document.createElement('div');
        Object.assign(concessionLabel.style, { marginTop: '10px' });
        concessionLabel.innerHTML = 'CONCESSION PRICE:';
        pricing.appendChild(concessionLabel);

        const concessionRow = document.createElement('div');
        Object.assign(concessionRow.style, { display: 'flex', alignItems: 'center', marginTop: '5px' });
        
        const cMinus = this.createButton('-', () => {
            this.economyManager.setConcessionPrice(this.economyManager.getConcessionPrice() - 2);
            this.updateContent();
        });
        
        this.concessionValue = document.createElement('span');
        Object.assign(this.concessionValue.style, { width: '40px', textAlign: 'center', color: '#fff' });
        
        const cPlus = this.createButton('+', () => {
            this.economyManager.setConcessionPrice(this.economyManager.getConcessionPrice() + 2);
            this.updateContent();
        });

        concessionRow.appendChild(cMinus);
        concessionRow.appendChild(this.concessionValue);
        concessionRow.appendChild(cPlus);
        pricing.appendChild(concessionRow);

        background.appendChild(pricing);

        this.container.appendChild(background);
        document.body.appendChild(this.container);
        this.hide();
    }

    private feeValue: HTMLElement | null = null;
    private concessionValue: HTMLElement | null = null;

    private createButton(text: string, onClick: () => void): HTMLElement {
        const btn = document.createElement('div');
        btn.innerText = text;
        Object.assign(btn.style, {
            width: '20px',
            height: '20px',
            background: '#837D35',
            color: '#000',
            textAlign: 'center',
            lineHeight: '20px',
            cursor: 'pointer',
            fontWeight: 'bold',
            borderRadius: '2px'
        });
        btn.onclick = onClick;
        return btn;
    }

    private applyStyles() {
        Object.assign(this.container.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: '4000',
            display: 'none'
        });
    }

    public show() {
        this.updateContent();
        this.container.style.display = 'block';
    }

    public hide() {
        this.container.style.display = 'none';
    }

    private updateContent() {
        const profit = this.economyManager.getMonthlyProfit();
        const cash = this.economyManager.getCash();
        const fee = this.economyManager.getAdmissionFee();
        const cPrice = this.economyManager.getConcessionPrice();
        
        if (this.feeValue) this.feeValue.innerText = `$${fee}`;
        if (this.concessionValue) this.concessionValue.innerText = `$${cPrice}`;

        this.content.innerHTML = `
            <div style="border-bottom: 1px solid #837D35; margin-bottom: 10px; padding-bottom: 5px;">
                TOTAL CASH:<br/>
                <span style="color: #fff">$${cash.toLocaleString()}</span>
            </div>
            <div>
                MONTHLY PROFIT:<br/>
                <span style="color: ${profit >= 0 ? '#00ff00' : '#ff0000'}">
                    $${profit.toLocaleString()}
                </span>
            </div>
        `;
    }
}

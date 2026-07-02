import { EconomyManager } from '../core/EconomyManager';

export class FinancePanel {
    private backdrop: HTMLElement;
    private content: HTMLElement;
    private feeValue: HTMLElement;
    private concessionValue: HTMLElement;

    constructor(private economyManager: EconomyManager) {
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'zt-modal-backdrop';
        this.backdrop.style.display = 'none';
        // Click outside the panel closes it.
        this.backdrop.onclick = (e) => { if (e.target === this.backdrop) this.hide(); };

        const modal = document.createElement('div');
        modal.className = 'zt-modal zt-panel';

        const title = document.createElement('h2');
        title.textContent = 'Finances';
        modal.appendChild(title);

        this.content = document.createElement('div');
        this.content.style.fontFamily = 'monospace';
        this.content.style.lineHeight = '1.6';
        modal.appendChild(this.content);

        // Pricing controls
        const feeRow = this.priceRow('Admission Fee', () => this.stepFee(-5), () => this.stepFee(5));
        this.feeValue = feeRow.value;
        modal.appendChild(feeRow.row);

        const concRow = this.priceRow('Concession Price', () => this.stepConcession(-2), () => this.stepConcession(2));
        this.concessionValue = concRow.value;
        modal.appendChild(concRow.row);

        const close = document.createElement('div');
        close.className = 'zt-menu-btn';
        close.textContent = 'Close';
        close.onclick = () => this.hide();
        modal.appendChild(close);

        this.backdrop.appendChild(modal);
        document.body.appendChild(this.backdrop);
    }

    private stepFee(d: number) {
        this.economyManager.setAdmissionFee(this.economyManager.getAdmissionFee() + d);
        this.updateContent();
    }
    private stepConcession(d: number) {
        this.economyManager.setConcessionPrice(this.economyManager.getConcessionPrice() + d);
        this.updateContent();
    }

    private priceRow(label: string, onMinus: () => void, onPlus: () => void) {
        const row = document.createElement('div');
        Object.assign(row.style, { display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0' });

        const lbl = document.createElement('span');
        lbl.textContent = label;
        lbl.style.flex = '1';
        row.appendChild(lbl);

        const value = document.createElement('span');
        Object.assign(value.style, { minWidth: '48px', textAlign: 'center', color: 'var(--zt-gold)', fontWeight: 'bold' });

        row.appendChild(this.stepButton('−', onMinus));
        row.appendChild(value);
        row.appendChild(this.stepButton('+', onPlus));
        return { row, value };
    }

    private stepButton(text: string, onClick: () => void): HTMLElement {
        const btn = document.createElement('div');
        btn.textContent = text;
        Object.assign(btn.style, {
            width: '28px', height: '28px', lineHeight: '28px', textAlign: 'center',
            background: 'var(--zt-accent)', color: '#000', fontWeight: 'bold',
            borderRadius: '4px', cursor: 'pointer', userSelect: 'none'
        });
        btn.onclick = onClick;
        return btn;
    }

    public show() {
        this.updateContent();
        this.backdrop.style.display = 'flex';
    }

    public hide() {
        this.backdrop.style.display = 'none';
    }

    private updateContent() {
        const profit = this.economyManager.getMonthlyProfit();
        const cash = this.economyManager.getCash();
        this.feeValue.textContent = `$${this.economyManager.getAdmissionFee()}`;
        this.concessionValue.textContent = `$${this.economyManager.getConcessionPrice()}`;

        this.content.textContent = '';

        const cashRow = document.createElement('div');
        cashRow.style.marginBottom = '6px';
        cashRow.append('Total Cash: ');
        const cashAmt = document.createElement('b');
        cashAmt.style.color = 'var(--zt-gold)';
        cashAmt.textContent = `$${cash.toLocaleString()}`;
        cashRow.appendChild(cashAmt);
        this.content.appendChild(cashRow);

        const profitRow = document.createElement('div');
        profitRow.style.marginBottom = '10px';
        profitRow.append('Monthly Profit: ');
        const profitAmt = document.createElement('b');
        profitAmt.style.color = profit >= 0 ? '#5dd35d' : '#ff5d5d';
        profitAmt.textContent = `$${profit.toLocaleString()}`;
        profitRow.appendChild(profitAmt);
        this.content.appendChild(profitRow);
    }
}

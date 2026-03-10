export type TransactionCategory = 
    'admission' | 'concessions' | 'construction' | 'salaries' | 'maintenance' | 'animals';

export interface FinancialRecord {
    income: number;
    expenses: number;
}

export class EconomyManager {
    private cash: number = 5000;
    private admissionFee: number = 20;
    private concessionPrice: number = 10;
    private monthlyStats: Map<string, FinancialRecord> = new Map();
    private onUpdateCallback: (cash: number) => void = () => {};

    public getCash(): number {
        return this.cash;
    }

    public getAdmissionFee(): number {
        return this.admissionFee;
    }

    public getConcessionPrice(): number {
        return this.concessionPrice;
    }

    public setConcessionPrice(amount: number) {
        this.concessionPrice = Math.max(0, amount);
    }

    public setAdmissionFee(amount: number) {
        this.admissionFee = Math.max(0, amount);
    }

    public setCash(amount: number) {
        this.cash = amount;
        this.onUpdateCallback(this.cash);
    }

    public addCash(amount: number, category: TransactionCategory = 'concessions') {
        this.cash += amount;
        this.recordTransaction(amount, 0, category);
        this.onUpdateCallback(this.cash);
    }

    public subtractCash(amount: number, category: TransactionCategory = 'construction'): boolean {
        if (this.cash >= amount) {
            this.cash -= amount;
            this.recordTransaction(0, amount, category);
            this.onUpdateCallback(this.cash);
            return true;
        }
        return false;
    }

    private recordTransaction(income: number, expenses: number, category: TransactionCategory) {
        // For simplicity, we just track current month totals
        const key = 'current';
        const record = this.monthlyStats.get(key) || { income: 0, expenses: 0 };
        record.income += income;
        record.expenses += expenses;
        this.monthlyStats.set(key, record);
    }

    public getMonthlyProfit(): number {
        const record = this.monthlyStats.get('current') || { income: 0, expenses: 0 };
        return record.income - record.expenses;
    }

    public resetMonthlyStats() {
        this.monthlyStats.set('current', { income: 0, expenses: 0 });
    }

    public onUpdate(callback: (cash: number) => void) {
        this.onUpdateCallback = callback;
        callback(this.cash);
    }

    public getCosts() {
        return {
            animal: 500,
            fence: 50,
            path: 20,
            scenery: 100,
            terrain: 10,
            keeper_salary: 800 // Monthly
        };
    }
}

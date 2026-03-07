export class EconomyManager {
    private cash: number = 5000; // Starting cash
    private onUpdateCallback: (cash: number) => void = () => {};

    public getCash(): number {
        return this.cash;
    }

    public addCash(amount: number) {
        this.cash += amount;
        this.onUpdateCallback(this.cash);
    }

    public subtractCash(amount: number): boolean {
        if (this.cash >= amount) {
            this.cash -= amount;
            this.onUpdateCallback(this.cash);
            return true;
        }
        return false;
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
            terrain: 10
        };
    }
}

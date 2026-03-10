export class TimeManager {
    private year: number = 1;
    private month: number = 1; // 1 to 12
    private day: number = 1;   // 1 to 30 (simplified months)
    
    private lastTick: number = 0;
    private dayDuration: number = 2000; // 2 seconds per day
    
    private onDayEnd: (day: number, month: number, year: number) => void = () => {};
    private onMonthEnd: (month: number, year: number) => void = () => {};

    public update(time: number) {
        if (this.lastTick === 0) {
            this.lastTick = time;
            return;
        }

        if (time - this.lastTick > this.dayDuration) {
            this.lastTick = time;
            this.nextDay();
        }
    }

    private nextDay() {
        this.day++;
        if (this.day > 30) {
            this.day = 1;
            this.nextMonth();
        }
        this.onDayEnd(this.day, this.month, this.year);
    }

    private nextMonth() {
        this.month++;
        if (this.month > 12) {
            this.month = 1;
            this.year++;
        }
        this.onMonthEnd(this.month, this.year);
    }

    public getDateString(): string {
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        return `${months[this.month - 1]} Year ${this.year}`;
    }

    public setOnDayEnd(callback: (day: number, month: number, year: number) => void) {
        this.onDayEnd = callback;
    }

    public setOnMonthEnd(callback: (month: number, year: number) => void) {
        this.onMonthEnd = callback;
    }
}

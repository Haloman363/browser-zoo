export interface ScenarioGoal {
    id: string;
    description: string;
    completed: boolean;
    check: (state: any) => boolean;
}

export class ScenarioManager {
    private currentScenarioId: string | null = null;
    private goals: ScenarioGoal[] = [];
    private onGoalUpdate: () => void = () => {};

    constructor() {}

    public loadScenario(id: string) {
        this.currentScenarioId = id;
        this.goals = [];

        if (id === 'scn01') {
            this.goals = [
                {
                    id: 'BUY_TIGER',
                    description: 'Place a Bengal Tiger in an exhibit.',
                    completed: false,
                    check: (state) => state.animals.some((a: any) => a.id === 'tiger')
                },
                {
                    id: 'HIRE_KEEPER',
                    description: 'Hire a Zookeeper.',
                    completed: false,
                    check: (state) => state.staff.some((s: any) => s.id === 'keeper')
                }
            ];
        } else if (id === 'scn02') {
            this.goals = [
                {
                    id: 'REACH_CASH',
                    description: 'Reach $30,000 in cash.',
                    completed: false,
                    check: (state) => state.cash >= 30000
                },
                {
                    id: 'BUY_LION',
                    description: 'Place a Lion in an exhibit.',
                    completed: false,
                    check: (state) => state.animals.some((a: any) => a.id === 'lion')
                }
            ];
        } else {
            // Generic goals for other scenarios
            this.goals = [
                {
                    id: 'GENERIC_GROW',
                    description: 'Build a thriving zoo (Reach $40,000).',
                    completed: false,
                    check: (state) => state.cash >= 40000
                }
            ];
        }
    }

    public update(state: any) {
        let changed = false;
        this.goals.forEach(g => {
            if (!g.completed && g.check(state)) {
                g.completed = true;
                changed = true;
                console.log(`[ScenarioManager] Goal Completed: ${g.description}`);
            }
        });
        if (changed) this.onGoalUpdate();
    }

    public getGoals() {
        return this.goals;
    }

    public isWin() {
        return this.goals.length > 0 && this.goals.every(g => g.completed);
    }

    public onUpdate(callback: () => void) {
        this.onGoalUpdate = callback;
    }
}

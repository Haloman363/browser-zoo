export enum GameState {
    MainMenu,
    Loading,
    Playing,
    Paused
}

export class StateManager {
    private currentState: GameState = GameState.MainMenu;
    private onStateChange: (state: GameState) => void = () => {};

    public setState(state: GameState) {
        if (this.currentState === state) return;
        this.currentState = state;
        this.onStateChange(state);
    }

    public getState(): GameState {
        return this.currentState;
    }

    public onChange(callback: (state: GameState) => void) {
        this.onStateChange = callback;
    }
}

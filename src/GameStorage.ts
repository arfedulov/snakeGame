interface GameResultRecord {
  date: Date;
  result: GameResult;
}

export interface GameResult {
  minutes: number;
  seconds: number;
  milliseconds: number;
}

const GAME_RESULTS_STORAGE_ID = 'snakeGame:gameResults';

class GameStorage {
  private data: GameResultRecord[] = [];

  constructor() {
    const savedData = localStorage.getItem(GAME_RESULTS_STORAGE_ID);
    if (savedData) {
      this.data = JSON.parse(savedData);
    }
  }

  public saveResult(result: GameResult): void {
    const record: GameResultRecord = {
      date: new Date(),
      result,
    };
    this.data.push(record);
    const data = JSON.stringify(this.data);
    localStorage.setItem(GAME_RESULTS_STORAGE_ID, data);
  }

  public getResults(limit?: number): GameResultRecord[] {
    return this.data.slice(0, limit ? limit : this.data.length - 1);
  }
}

export default GameStorage;

// prey.js
class Prey {
  constructor(x, y, grid) {
    this.x = x;
    this.y = y;
    this.grid = grid;
    this.qTable = {};
    this.stepCount = 0;
  }

  setPosition(x, y) {
    if (this.grid.isValidMove(x, y)) {
      this.x = x;
      this.y = y;
    } else {
      throw new Error('Invalid move');
    }
  }

  move(action) {
    switch (action) {
      case 'up':
        this.y = Math.max(0, this.y - 1);
        break;
      case 'down':
        this.y = Math.min(this.grid.size - 1, this.y + 1);
        break;
      case 'left':
        this.x = Math.max(0, this.x - 1);
        break;
      case 'right':
        this.x = Math.min(this.grid.size - 1, this.x + 1);
        break;
    }
  }

  getState() {
    return { x: this.x, y: this.y };
  }

  getActions() {
    return ['up', 'down', 'left', 'right'];
  }

  getReward(predatorState) {
    const distance = Math.sqrt(
      Math.pow(this.x - predatorState.x, 2) +
        Math.pow(this.y - predatorState.y, 2)
    );
    return distance;
  }

  stateToString(state) {
    return `${state.x},${state.y}`;
  }

  chooseAction(state) {
    const stateStr = this.stateToString(state);
    const temp = 1.4;
    const actions = this.getActions();

    if (!this.qTable[stateStr]) {
      // Choose a random action with 10% probability, or if we haven't seen this state before
      return actions[Math.floor(Math.random() * actions.length)];
    } else {
      const probabilities = actions.map((action) => {
        const qValue = this.qTable[stateStr][action] || 0;
        return Math.exp(qValue / temp);
      });

      const sumProbabilities = probabilities.reduce((a, b) => a + b, 0);
      const randomValue = Math.random() * sumProbabilities;

      let cumulativeProb = 0;
      for (let i = 0; i < probabilities.length; i++) {
        cumulativeProb += probabilities[i];
        if (randomValue < cumulativeProb) {
          return actions[i];
        }
      }
    }
  }

  updateQTable(state, action, reward, nextState) {
    const stateStr = this.stateToString(state);
    const nextStateStr = this.stateToString(nextState);
    if (!this.qTable[stateStr]) {
      this.qTable[stateStr] = {};
    }
    const oldQ = this.qTable[stateStr][action] || 0;
    const nextMaxQ = Math.max(
      ...Object.values(this.qTable[nextStateStr] || {})
    );
    const learningRate = 1 / (1 + this.stepCount / 1000);

    this.qTable[stateStr][action] =
      oldQ + learningRate * (reward + 0.9 * nextMaxQ - oldQ);
    this.stepCount++;
  }
}

module.exports = Prey;

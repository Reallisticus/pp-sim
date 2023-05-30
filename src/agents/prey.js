// prey.js
class Prey {
  constructor(x, y, gridSize) {
    this.x = x;
    this.y = y;
    this.gridSize = gridSize;
    this.qTable = {};
  }

  move(action) {
    switch (action) {
      case 'up':
        this.y = Math.max(0, this.y - 1);
        break;
      case 'down':
        this.y = Math.min(this.gridSize - 1, this.y + 1);
        break;
      case 'left':
        this.x = Math.max(0, this.x - 1);
        break;
      case 'right':
        this.x = Math.min(this.gridSize - 1, this.x + 1);
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
    if (Math.random() < 0.1 || !this.qTable[stateStr]) {
      // Choose a random action with 10% probability, or if we haven't seen this state before
      const actions = this.getActions();
      return actions[Math.floor(Math.random() * actions.length)];
    } else {
      // Otherwise, choose the action with the highest expected reward
      return Object.keys(this.qTable[stateStr]).reduce((a, b) =>
        this.qTable[stateStr][a] > this.qTable[stateStr][b] ? a : b
      );
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
    this.qTable[stateStr][action] =
      oldQ + 0.1 * (reward + 0.9 * nextMaxQ - oldQ);
  }
}

module.exports = Prey;

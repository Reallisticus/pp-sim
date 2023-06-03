//agent.js

class Agent {
  constructor(x, y, grid) {
    this.grid = grid;
    if (x !== undefined && y !== undefined) {
      this.setPosition(x, y);
    }
    this.qTable = {};
    this.stepCount = 0;
  }

  setPosition(x, y) {
    const newX = x % this.grid.size;
    const newY = y % this.grid.size;

    if (this.grid.isValidMove(newX, newY)) {
      this.x = newX;
      this.y = newY;
    } else {
      // Find the nearest valid position
      const validPositions = this.getValidNeighborPositions();
      if (validPositions.length > 0) {
        const nearestValidPosition = validPositions.reduce((prev, curr) => {
          const prevDistance = this.calculateDistance(x, y, prev.x, prev.y);
          const currDistance = this.calculateDistance(x, y, curr.x, curr.y);
          return prevDistance < currDistance ? prev : curr;
        });

        this.x = nearestValidPosition.x;
        this.y = nearestValidPosition.y;
      } else {
        throw new Error('Invalid move', x, y);
      }
    }
  }

  getValidNeighborPositions() {
    const neighbors = [
      { x: (this.x - 1 + this.grid.size) % this.grid.size, y: this.y },
      { x: (this.x + 1) % this.grid.size, y: this.y },
      { x: this.x, y: (this.y - 1 + this.grid.size) % this.grid.size },
      { x: this.x, y: (this.y + 1) % this.grid.size },
    ];

    return neighbors.filter((neighbor) =>
      this.grid.isValidMove(neighbor.x, neighbor.y)
    );
  }

  calculateDistance(x1, y1, x2, y2) {
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    const wrappedDx = Math.min(dx, this.grid.size - dx);
    const wrappedDy = Math.min(dy, this.grid.size - dy);
    return Math.sqrt(Math.pow(wrappedDx, 2) + Math.pow(wrappedDy, 2));
  }

  move(action) {
    let newX = this.x;
    let newY = this.y;

    switch (action) {
      case 'up':
        newY = (this.y - 1 + this.grid.size) % this.grid.size;
        break;
      case 'down':
        newY = (this.y + 1) % this.grid.size;
        break;
      case 'left':
        newX = (this.x - 1 + this.grid.size) % this.grid.size;
        break;
      case 'right':
        newX = (this.x + 1) % this.grid.size;
        break;
    }

    if (this.grid.isValidMove(newX, newY)) {
      this.x = newX;
      this.y = newY;
    }
  }

  getState() {
    return { x: this.x, y: this.y };
  }

  getActions() {
    return ['up', 'down', 'left', 'right'];
  }

  stateToString(state) {
    return `${state.x},${state.y}`;
  }

  chooseAction(state, temp) {
    const stateStr = this.stateToString(state);
    const actions = this.getActions();

    if (!this.qTable[stateStr]) {
      // Initialize the qTable for all possible actions with 0 values
      this.qTable[stateStr] = {};
      actions.forEach((action) => {
        this.qTable[stateStr][action] = 0;
      });
    }

    const actionProbabilities = this.calculateActionProbabilities(
      stateStr,
      actions,
      temp
    );
    return this.selectActionBasedOnProbabilities(actions, actionProbabilities);
  }

  calculateActionProbabilities(stateStr, actions, temp) {
    return actions.map((action) => {
      const qValue = this.qTable[stateStr][action] || 0;
      return Math.exp(qValue / temp);
    });
  }

  selectActionBasedOnProbabilities(actions, probabilities) {
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

module.exports = Agent;

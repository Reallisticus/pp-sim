//agent.js

const bresenhamLine = require('../helpers/bresenhamLine');

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
      {
        x: (this.x - 1 + this.grid.size) % this.grid.size,
        y: (this.y - 1 + this.grid.size) % this.grid.size,
      },
      {
        x: (this.x + 1) % this.grid.size,
        y: (this.y - 1 + this.grid.size) % this.grid.size,
      },
      {
        x: (this.x - 1 + this.grid.size) % this.grid.size,
        y: (this.y + 1) % this.grid.size,
      },
      { x: (this.x + 1) % this.grid.size, y: (this.y + 1) % this.grid.size },
    ];

    return neighbors.filter((neighbor) =>
      this.grid.isValidMove(neighbor.x, neighbor.y)
    );
  }

  getActions() {
    return [
      'up',
      'down',
      'left',
      'right',
      'up-left',
      'up-right',
      'down-left',
      'down-right',
    ];
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
      case 'up-left':
        newX = (this.x - 1 + this.grid.size) % this.grid.size;
        newY = (this.y - 1 + this.grid.size) % this.grid.size;
        break;
      case 'up-right':
        newX = (this.x + 1) % this.grid.size;
        newY = (this.y - 1 + this.grid.size) % this.grid.size;
        break;
      case 'down-left':
        newX = (this.x - 1 + this.grid.size) % this.grid.size;
        newY = (this.y + 1) % this.grid.size;
        break;
      case 'down-right':
        newX = (this.x + 1) % this.grid.size;
        newY = (this.y + 1) % this.grid.size;
        break;
    }

    if (this.grid.isValidMove(newX, newY)) {
      this.x = newX;
      this.y = newY;
    }
  }

  canSee(otherAgent) {
    const distance = this.calculateDistance(
      this.x,
      this.y,
      otherAgent.x,
      otherAgent.y
    );

    // Calculate the angle between predator and prey
    const angle =
      Math.atan2(otherAgent.y - this.y, otherAgent.x - this.x) *
      (180 / Math.PI);

    // Normalize the angle to be between 0 and 360
    const normalizedAngle = (angle + 360) % 360;

    // Check if the angle is within the field of view
    const halfFOV = this.fieldOfView / 2;
    const lowerBound = (this.direction - halfFOV + 360) % 360;
    const upperBound = (this.direction + halfFOV) % 360;

    const isWithinFOV =
      (lowerBound < upperBound &&
        normalizedAngle >= lowerBound &&
        normalizedAngle <= upperBound) ||
      (lowerBound > upperBound &&
        (normalizedAngle >= lowerBound || normalizedAngle <= upperBound));

    if (distance <= this.visionRange && isWithinFOV) {
      const linePoints = bresenhamLine(
        this.x,
        this.y,
        otherAgent.x,
        otherAgent.y
      );

      // Check if there's a direct line of sight without any obstacles
      return !linePoints.some((point) =>
        this.grid.isObstacle(point.x, point.y)
      );
    }

    return false;
  }

  getState() {
    return { x: this.x, y: this.y };
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
    const rawProbabilities = actions.map((action) => {
      const qValue = this.qTable[stateStr][action] || 0;
      return Math.exp(qValue / temp);
    });

    // Calculate the sum of raw probabilities
    const sumProbabilities = rawProbabilities.reduce((a, b) => a + b, 0);

    // Normalize the probabilities by dividing each probability by the sum of all probabilities
    const normalizedProbabilities = rawProbabilities.map((probability) => {
      return probability / sumProbabilities;
    });

    return normalizedProbabilities;
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

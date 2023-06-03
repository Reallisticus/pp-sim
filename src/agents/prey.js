const Agent = require('./agent');

// prey.js
class Prey extends Agent {
  constructor(x, y, grid) {
    super(x, y, grid);
    this.fieldOfView = 270;
    this.qTable = {};
  }

  chooseAction(state) {
    const temp = Math.max(1.4 - this.stepCount / 10000, 0.1);
    return super.chooseAction(state, temp);
  }

  getReward(predatorState) {
    const dx = Math.abs(this.x - predatorState.x);
    const dy = Math.abs(this.y - predatorState.y);
    const wrappedDx = Math.min(dx, this.grid.size - dx);
    const wrappedDy = Math.min(dy, this.grid.size - dy);
    const distance = Math.sqrt(Math.pow(wrappedDx, 2) + Math.pow(wrappedDy, 2));
    return distance;
  }
}

module.exports = Prey;

const Agent = require('./agent');

// prey.js
class Prey extends Agent {
  constructor(x, y, grid) {
    super(x, y, grid);
    this.fieldOfView = 270;
    this.qTable = {};
  }

  chooseAction(state) {
    return super.chooseAction(state, 1.4);
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

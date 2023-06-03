//predator.js

const Agent = require('./agent');
class Predator extends Agent {
  constructor(x, y, grid) {
    super(x, y, grid);
    this.fieldOfView = 90;
    this.qTable = {};
    this.history = [];
  }

  move(action) {
    const oldX = this.x;
    const oldY = this.y;

    super.move(action);

    // Record the action and new position in history
    this.history.push({ action, oldX, oldY, newX: this.x, newY: this.y });
  }

  chooseAction(state) {
    const temp = Math.max(1.4 - this.stepCount / 10000, 0.1);

    return super.chooseAction(state, temp);
  }

  getReward(preyState) {
    const dx = Math.abs(this.x - preyState.x);
    const dy = Math.abs(this.y - preyState.y);
    const wrappedDx = Math.min(dx, this.grid.size - dx);
    const wrappedDy = Math.min(dy, this.grid.size - dy);
    const distance = Math.sqrt(Math.pow(wrappedDx, 2) + Math.pow(wrappedDy, 2));
    return -distance;
  }
}

module.exports = Predator;

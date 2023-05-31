// grid.js
class Grid {
  constructor(size) {
    this.size = size;
  }

  isValidMove(x, y) {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  randomPosition() {
    return {
      x: Math.floor(Math.random() * this.size),
      y: Math.floor(Math.random() * this.size),
    };
  }

  isCollision(predatorX, predatorY, preyX, preyY) {
    return predatorX === preyX && predatorY === preyY;
  }

  placePredators(predators) {
    predators.forEach((predator) => {
      const newPos = this.randomPosition();
      predator.setPosition(newPos.x, newPos.y);
    });
  }

  placePreys(preys) {
    preys.forEach((prey) => {
      const newPos = this.randomPosition();
      prey.setPosition(newPos.x, newPos.y);
    });
  }

  printGrid() {
    this.grid.forEach((row) => console.log(row.join(' | ')));
  }
}

module.exports = Grid;

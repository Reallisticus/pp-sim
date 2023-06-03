// grid.js
class Grid {
  constructor(size) {
    this.size = size;
    this.obstacles = [];
  }

  setPredatorsAndPreys(predators, preys) {
    this.predators = predators;
    this.preys = preys;
  }

  addObstacle(x, y) {
    this.obstacles.push({ x, y });
  }

  isObstacle(x, y) {
    return this.obstacles.some(
      (obstacle) => obstacle.x === x && obstacle.y === y
    );
  }

  isValidMove(x, y) {
    return !this.isObstacle(x, y);
  }

  randomPosition() {
    let position;
    let isOccupied;

    while (true) {
      position = {
        x: Math.floor(Math.random() * this.size),
        y: Math.floor(Math.random() * this.size),
      };

      isOccupied =
        this.isObstacle(position.x, position.y) ||
        this.predators.some((p) => p.x === position.x && p.y === position.y) ||
        this.preys.some((p) => p.x === position.x && p.y === position.y);

      if (!isOccupied) {
        break;
      }
    }

    return position;
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

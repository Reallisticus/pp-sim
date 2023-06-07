//grid.js

const shuffleArray = require('../helpers/fisherYates');

class Grid {
  constructor(size, cellSize = 10) {
    this.size = size;
    this.cellSize = cellSize;
    this.obstacles = new Map();
    this.cells = Array.from({ length: Math.ceil(size / cellSize) }, () =>
      Array.from({ length: Math.ceil(size / cellSize) }, () => ({
        predators: [],
        preys: [],
      }))
    );
    this.grass = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => false)
    );
    this.availablePositions = this.generateAvailablePositions();
  }

  generateObstacleKey(x, y) {
    return `${x},${y}`;
  }

  setPredatorsAndPreys(predators, preys) {
    this.predators = predators;
    this.preys = preys;

    predators.forEach((predator) => {
      const cellX = Math.floor(predator.x / this.cellSize);
      const cellY = Math.floor(predator.y / this.cellSize);
      this.cells[cellX][cellY].predators.push(predator);
    });

    preys.forEach((prey) => {
      const cellX = Math.floor(prey.x / this.cellSize);
      const cellY = Math.floor(prey.y / this.cellSize);
      this.cells[cellX][cellY].preys.push(prey);
    });
  }

  addObstacle(x, y) {
    this.obstacles.set(this.generateObstacleKey(x, y), true);
  }

  isObstacle(x, y) {
    return this.obstacles.get(this.generateObstacleKey(x, y)) || false;
  }

  isValidMove(x, y) {
    return !this.isObstacle(x, y);
  }

  generateAvailablePositions() {
    const positions = [];

    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        if (!this.isObstacle(x, y)) {
          positions.push({ x, y });
        }
      }
    }

    return shuffleArray(positions);
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

  addGrass(x, y) {
    this.grass[x][y] = true;
  }

  removeGrass(x, y) {
    this.grass[x][y] = false;
    this.availablePositions.push({ x, y });
    shuffleArray(this.availablePositions);
  }

  isGrass(x, y) {
    return this.grass[x][y];
  }

  spawnGrass() {
    if (this.availablePositions.length === 0) {
      console.warn('No available positions left to spawn grass.');
      return;
    }

    const position = this.availablePositions.pop();
    this.addGrass(position.x, position.y);
  }

  isCollision(predatorX, predatorY) {
    const predatorCellX = Math.floor(predatorX / this.cellSize);
    const predatorCellY = Math.floor(predatorY / this.cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cellX = predatorCellX + dx;
        const cellY = predatorCellY + dy;

        if (
          cellX >= 0 &&
          cellY >= 0 &&
          cellX < this.cells.length &&
          cellY < this.cells[0].length
        ) {
          const cellPreys = this.cells[cellX][cellY].preys;

          for (let i = 0; i < cellPreys.length; i++) {
            if (predatorX === cellPreys[i].x && predatorY === cellPreys[i].y) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  getVisibleObstacles(agent) {
    const visibleObstacles = [];

    for (const [key, value] of this.obstacles.entries()) {
      if (value) {
        const [x, y] = key.split(',').map(Number);
        if (agent.canSee({ x, y })) {
          visibleObstacles.push({ x, y });
        }
      }
    }

    return visibleObstacles;
  }

  placePredators(predators) {
    predators.forEach((predator) => {
      const newPos = this.randomPosition();
      predator.setPosition(newPos.x, newPos.y);

      const cellX = Math.floor(newPos.x / this.cellSize);
      const cellY = Math.floor(newPos.y / this.cellSize);
      this.cells[cellX][cellY].predators.push(predator);
    });
  }

  placePreys(preys) {
    preys.forEach((prey) => {
      const newPos = this.randomPosition();
      prey.setPosition(newPos.x, newPos.y);

      const cellX = Math.floor(newPos.x / this.cellSize);
      const cellY = Math.floor(newPos.y / this.cellSize);
      this.cells[cellX][cellY].preys.push(prey);
    });
  }

  printGrid() {
    this.grid.forEach((row) => console.log(row.join(' | ')));
  }
}

module.exports = Grid;

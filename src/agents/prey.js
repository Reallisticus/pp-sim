const Agent = require('./agent');
const config = require('../simulation/config');
// prey.js
class Prey extends Agent {
  constructor(x, y, grid, predators) {
    super(x, y, grid);
    this.fieldOfView = 270;
    this.qTable = {};
    this.predators = predators;
    this.visionRange = 3;
    this.id = Prey.nextId++;
    this.lastGrassEatenStep = 0;
  }

  static nextId = 1;

  spawn() {
    const newPrey = new Prey(null, null, this.grid, this.predators);
    this.grid.placePreys([newPrey]);
    console.log(`[Prey]: ${this.id} spawned at [${newPrey.x},${newPrey.y}]`);
    return newPrey;
  }

  chooseAction(state) {
    const visiblePredators = this.predators.filter((predator) =>
      this.canSee(predator)
    );
    const visibleObstacles = this.grid.getVisibleObstacles(this);

    const visibleGrass = this.grid.grass
      .map((row, x) =>
        row.map((cell, y) => (cell ? { x, y } : null)).filter((cell) => cell)
      )
      .flat()
      .filter((grass) => this.canSee(grass));

    // We can log this later...
    // visibleGrass.map((g) => {
    //   console.log(
    //     `Prey ${this.id} at position [${this.x}, ${this.y}] can see grass at [${g.x},${g.y}]`
    //   );
    // });

    const actions = this.getActions();

    // Calculate heuristic values for each action
    const PredatorHeuristicValues = actions.map((action) => {
      const { x: newX, y: newY } = this.getNewPositionAfterAction(action);

      const distanceToClosestPredator =
        Math.min(
          ...visiblePredators.map((predator) =>
            this.calculateDistance(newX, newY, predator.x, predator.y)
          )
        ) + 0.001;
      const distanceToClosestObstacle =
        Math.min(
          ...visibleObstacles.map((obstacle) =>
            this.calculateDistance(newX, newY, obstacle.x, obstacle.y)
          )
        ) + 0.001;

      const predatorHeuristicFactor = 1.5; // Adjust this value to change the predator heuristic scaling
      const obstacleHeuristicFactor = -0.5; // Adjust this value to change the obstacle heuristic scaling
      const minObstacleDistance = 1; // Adjust this value to set the minimum allowed distance to an obstacle

      const predatorHeuristic =
        predatorHeuristicFactor * distanceToClosestPredator;
      const obstacleHeuristic =
        distanceToClosestObstacle < minObstacleDistance
          ? obstacleHeuristicFactor * distanceToClosestObstacle
          : 0;

      return predatorHeuristic + obstacleHeuristic;
    });

    const grassHeuristicValues = actions.map((action) => {
      const { x: newX, y: newY } = this.getNewPositionAfterAction(action);

      const distanceToClosestGrass =
        Math.min(
          ...visibleGrass.map((grass) =>
            this.calculateDistance(newX, newY, grass.x, grass.y)
          )
        ) + 0.001;

      const grassHeuristicFactor = 2; // Adjust this value to change the grass heuristic scaling

      const grassHeuristic =
        grassHeuristicFactor * (1 / distanceToClosestGrass);

      return grassHeuristic;
    });

    const heuristicValues = PredatorHeuristicValues.map(
      (value, index) => value + grassHeuristicValues[index]
    );

    const stateStr = this.stateToString(state);
    const temp = Math.max(1.4 - this.stepCount / 10000, 0.1);
    const actionProbabilities = this.calculateActionProbabilities(
      stateStr,
      actions,
      temp,
      heuristicValues
    );

    const selectedAction = this.selectActionBasedOnProbabilities(
      actions,
      actionProbabilities
    );

    return selectedAction;
  }

  getNewPositionAfterAction(action) {
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

    return { x: newX, y: newY };
  }

  getReward(predatorState, obstacleStates) {
    const dx = Math.abs(this.x - predatorState.x);
    const dy = Math.abs(this.y - predatorState.y);
    const wrappedDx = Math.min(dx, this.grid.size - dx);
    const wrappedDy = Math.min(dy, this.grid.size - dy);
    const distanceToPredator =
      Math.sqrt(Math.pow(wrappedDx, 2) + Math.pow(wrappedDy, 2)) + 0.001;

    // Calculate the distance to the closest obstacle
    const distanceToClosestObstacle = obstacleStates.length
      ? Math.min(
          ...obstacleStates.map((obstacle) =>
            this.calculateDistance(this.x, this.y, obstacle.x, obstacle.y)
          )
        ) + 0.001
      : Infinity;

    const visibleGrass = this.grid.grass
      .map((row, x) =>
        row.map((cell, y) => (cell ? { x, y } : null)).filter((cell) => cell)
      )
      .flat()
      .filter((grass) => this.canSee(grass));

    const distanceToClosestGrass = visibleGrass.length
      ? Math.min(
          ...visibleGrass.map((grass) =>
            this.calculateDistance(this.x, this.y, grass.x, grass.y)
          )
        ) + 0.001
      : Infinity;

    const grassRewardFactor = 10; // Adjust this value to change the grass reward scaling

    const grassReward = grassRewardFactor * (1 / distanceToClosestGrass);

    const directionFactor = this.getDirectionFactor(predatorState);
    const reproductionReward = this.getReproductionReward();

    const rewardFactor = 1.5; // Adjust this value to change the reward scaling
    const obstaclePenaltyFactor = 0.5; // Adjust this value to change the obstacle penalty scaling
    const minObstacleDistance = 1; // Adjust this value to set the minimum allowed distance to an obstacle

    const predatorReward = Math.pow(distanceToPredator, rewardFactor);
    const obstaclePenalty =
      distanceToClosestObstacle < minObstacleDistance
        ? -Math.pow(distanceToClosestObstacle, obstaclePenaltyFactor)
        : 0;

    return (
      predatorReward +
      obstaclePenalty +
      directionFactor +
      reproductionReward +
      grassReward
    );
  }

  getDirectionFactor(predatorState) {
    // Calculate the direction factor based on the angle between the prey's movement and the line connecting the prey and predator
    const angleBetweenMovementAndPredator =
      this.calculateAngleBetweenMovementAndPredator(predatorState);
    const directionFactor = Math.cos(angleBetweenMovementAndPredator);
    return directionFactor;
  }

  getReproductionReward() {
    // Add a reward for successful reproduction
    if (this.stepCount >= config.preyReproductionThreshold) {
      return config.preyReproductionReward;
    }
    return 0;
  }

  calculateAngleBetweenMovementAndPredator(predatorState) {
    const dx = this.x - predatorState.x;
    const dy = this.y - predatorState.y;
    const distanceToPredator = Math.sqrt(dx * dx + dy * dy);

    const movementVector = {
      x: this.x - this.previousX,
      y: this.y - this.previousY,
    };
    const predatorVector = {
      x: dx / distanceToPredator,
      y: dy / distanceToPredator,
    };

    const dotProduct =
      movementVector.x * predatorVector.x + movementVector.y * predatorVector.y;
    const movementMagnitude = Math.sqrt(
      movementVector.x * movementVector.x + movementVector.y * movementVector.y
    );

    const angleBetweenVectors = Math.acos(
      dotProduct / (movementMagnitude * distanceToPredator)
    );

    return angleBetweenVectors;
  }
}

module.exports = Prey;

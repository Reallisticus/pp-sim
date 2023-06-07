//predator.js

const Agent = require('./agent');
const config = require('../simulation/config');

class Predator extends Agent {
  constructor(x, y, grid, preys) {
    super(x, y, grid);
    this.fieldOfView = 90;
    this.qTable = {};
    this.preys = preys;
    this.visionRange = 5;
    this.lastCatchStep = 0;
    this.id = Predator.nextId++;
  }

  static nextId = 1;

  spawn() {
    const newPredator = new Predator(null, null, this.grid, this.preys);
    this.grid.placePredators([newPredator]);
    console.log(
      `[Predator]: ${this.id} spawned at [${newPredator.x},${newPredator.y}]`
    );

    return newPredator;
  }

  chooseAction(state) {
    const visiblePreys = this.preys.filter((prey) => this.canSee(prey));
    const visibleObstacles = this.grid.getVisibleObstacles(this);

    const actions = this.getActions();

    // If no visible preys, choose a random action
    if (visiblePreys.length === 0) {
      const temp = Math.max(1.4 - this.stepCount / 10000, 0.1);
      return super.chooseAction(state, temp);
    }

    const closestPrey = visiblePreys.reduce((closest, current) => {
      const closestDistance = this.calculateDistance(
        this.x,
        this.y,
        closest.x,
        closest.y
      );

      const currentDistance = this.calculateDistance(
        this.x,
        this.y,
        current.x,
        current.y
      );
      return currentDistance < closestDistance ? current : closest;
    });

    // Calculate heuristic values for each action
    const heuristicValues = actions.map((action) => {
      const { x: newX, y: newY } = this.getNewPositionAfterAction(action);

      const distanceToPrey =
        this.calculateDistance(newX, newY, closestPrey.x, closestPrey.y) +
        0.001;

      const distanceToClosestObstacle =
        Math.min(
          ...visibleObstacles.map((obstacle) =>
            this.calculateDistance(newX, newY, obstacle.x, obstacle.y)
          )
        ) + 0.001;

      const preyHeuristicFactor = -0.1; // Adjust this value to change the prey heuristic scaling
      const obstacleHeuristicFactor = 0.1; // Adjust this value to change the obstacle heuristic scaling
      const minObstacleDistance = 1; // Adjust this value to set the minimum allowed distance to an obstacle

      const preyHeuristic = preyHeuristicFactor * distanceToPrey;
      const obstacleHeuristic =
        distanceToClosestObstacle < minObstacleDistance
          ? obstacleHeuristicFactor * distanceToClosestObstacle
          : 0;

      return preyHeuristic + obstacleHeuristic;
    });

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

  // ...

  getReward(preyState, obstacleStates) {
    const dx = Math.abs(this.x - preyState.x);
    const dy = Math.abs(this.y - preyState.y);
    const wrappedDx = Math.min(dx, this.grid.size - dx);
    const wrappedDy = Math.min(dy, this.grid.size - dy);
    const distanceToPrey =
      Math.sqrt(Math.pow(wrappedDx, 2) + Math.pow(wrappedDy, 2)) + 0.001;

    // Calculate the distance to the closest obstacle
    const distanceToClosestObstacle = obstacleStates.length
      ? Math.min(
          ...obstacleStates.map((obstacle) =>
            this.calculateDistance(this.x, this.y, obstacle.x, obstacle.y)
          )
        ) + 0.001
      : Infinity;

    const directionFactor = this.getDirectionFactor(preyState);
    const reproductionReward = this.getReproductionReward();

    const rewardFactor = config.rewardFactor; // Adjust this value to change the reward scaling
    const obstaclePenaltyFactor = config.obstaclePenaltyFactor; // Adjust this value to change the obstacle penalty scaling
    const minObstacleDistance = config.minObstacleDistance; // Adjust this value to set the minimum allowed distance to an obstacle

    const preyReward = Math.pow(distanceToPrey, rewardFactor);
    const obstaclePenalty =
      distanceToClosestObstacle < minObstacleDistance
        ? -Math.pow(distanceToClosestObstacle, obstaclePenaltyFactor)
        : 0;

    return preyReward + obstaclePenalty + directionFactor + reproductionReward;
  }

  getDirectionFactor(preyState) {
    // Calculate the direction factor based on the angle between the predator's movement and the line connecting the predator and prey
    const angleBetweenMovementAndPrey =
      this.calculateAngleBetweenMovementAndPrey(preyState);
    const directionFactor = Math.cos(angleBetweenMovementAndPrey);
    return directionFactor;
  }

  getReproductionReward() {
    // Add a reward for successful reproduction
    if (
      this.stepCount - this.lastCatchStep >=
      config.predatorReproductionThreshold
    ) {
      return config.predatorReproductionReward;
    }
    return 0;
  }

  calculateAngleBetweenMovementAndPrey(preyState) {
    const dx = preyState.x - this.x;
    const dy = preyState.y - this.y;
    const distanceToPrey = Math.sqrt(dx * dx + dy * dy);

    const movementVector = {
      x: this.x - this.previousX,
      y: this.y - this.previousY,
    };
    const preyVector = { x: dx / distanceToPrey, y: dy / distanceToPrey };

    const dotProduct =
      movementVector.x * preyVector.x + movementVector.y * preyVector.y;
    const movementMagnitude = Math.sqrt(
      movementVector.x * movementVector.x + movementVector.y * movementVector.y
    );

    const angleBetweenVectors = Math.acos(
      dotProduct / (movementMagnitude * distanceToPrey)
    );

    return angleBetweenVectors;
  }
}

module.exports = Predator;

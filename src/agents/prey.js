const Agent = require('./agent');

// prey.js
class Prey extends Agent {
  constructor(x, y, grid, predators) {
    super(x, y, grid);
    this.fieldOfView = 270;
    this.qTable = {};
    this.predators = predators;
    this.visionRange = 3;
  }

  chooseAction(state) {
    const visiblePredators = this.predators.filter((predator) =>
      this.canSee(predator)
    );
    const visibleObstacles = this.grid.obstacles.filter((obstacle) =>
      this.canSee({ x: obstacle.x, y: obstacle.y })
    );

    const actions = this.getActions();

    // Calculate heuristic values for each action
    const heuristicValues = actions.map((action) => {
      const { x: newX, y: newY } = this.getNewPositionAfterAction(action);

      const distanceToClosestPredator = Math.min(
        ...visiblePredators.map((predator) =>
          this.calculateDistance(newX, newY, predator.x, predator.y)
        )
      );
      const distanceToClosestObstacle = Math.min(
        ...visibleObstacles.map((obstacle) =>
          this.calculateDistance(newX, newY, obstacle.x, obstacle.y)
        )
      );

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

    const stateStr = this.stateToString(state);
    const temp = Math.max(1.4 - this.stepCount / 10000, 0.1);
    const actionProbabilities = this.calculateActionProbabilities(
      stateStr,
      actions,
      temp,
      heuristicValues
    );

    return this.selectActionBasedOnProbabilities(actions, actionProbabilities);
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
    const distanceToPredator = Math.sqrt(
      Math.pow(wrappedDx, 2) + Math.pow(wrappedDy, 2)
    );

    // Calculate the distance to the closest obstacle
    const distanceToClosestObstacle = Math.min(
      ...obstacleStates.map((obstacle) =>
        this.calculateDistance(this.x, this.y, obstacle.x, obstacle.y)
      )
    );

    const rewardFactor = 1.5; // Adjust this value to change the reward scaling
    const obstaclePenaltyFactor = 0.5; // Adjust this value to change the obstacle penalty scaling
    const minObstacleDistance = 1; // Adjust this value to set the minimum allowed distance to an obstacle

    const predatorReward = Math.pow(distanceToPredator, rewardFactor);
    const obstaclePenalty =
      distanceToClosestObstacle < minObstacleDistance
        ? -Math.pow(distanceToClosestObstacle, obstaclePenaltyFactor)
        : 0;

    return predatorReward + obstaclePenalty;
  }
}

module.exports = Prey;

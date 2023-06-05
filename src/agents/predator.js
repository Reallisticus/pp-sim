//predator.js

const Agent = require('./agent');
class Predator extends Agent {
  constructor(x, y, grid, preys) {
    super(x, y, grid);
    this.fieldOfView = 90;
    this.qTable = {};
    this.history = [];
    this.preys = preys;
    this.visionRange = 5;
  }

  chooseAction(state) {
    const visiblePreys = this.preys.filter((prey) => this.canSee(prey));
    const visibleObstacles = this.grid.obstacles.filter((obstacle) =>
      this.canSee({ x: obstacle.x, y: obstacle.y })
    );

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

      const distanceToPrey = this.calculateDistance(
        newX,
        newY,
        closestPrey.x,
        closestPrey.y
      );
      const distanceToClosestObstacle = Math.min(
        ...visibleObstacles.map((obstacle) =>
          this.calculateDistance(newX, newY, obstacle.x, obstacle.y)
        )
      );

      const preyHeuristicFactor = -1.5; // Adjust this value to change the prey heuristic scaling
      const obstacleHeuristicFactor = 0.5; // Adjust this value to change the obstacle heuristic scaling
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

  // ...

  getReward(preyState, obstacleStates) {
    const dx = Math.abs(this.x - preyState.x);
    const dy = Math.abs(this.y - preyState.y);
    const wrappedDx = Math.min(dx, this.grid.size - dx);
    const wrappedDy = Math.min(dy, this.grid.size - dy);
    const distanceToPrey = Math.sqrt(
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

    const preyReward = -Math.pow(distanceToPrey, rewardFactor);
    const obstaclePenalty =
      distanceToClosestObstacle < minObstacleDistance
        ? -Math.pow(distanceToClosestObstacle, obstaclePenaltyFactor)
        : 0;

    return preyReward + obstaclePenalty;
  }
}

module.exports = Predator;

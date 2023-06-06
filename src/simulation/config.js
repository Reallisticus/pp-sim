//config.js

const config = {
  gridSize: 20,
  nrOfPredators: 5,
  nrOfPreys: 5,
  nrOfObstacles: 10,
  MAX_STEPS_PER_EPISODE: 1000,
  predatorReproductionThreshold: 100,
  predatorReproductionReward: 100,
  preyReproductionThreshold: 100,
  preyReproductionReward: 100,
  predatorStarvationThreshold: 200,
  preySurvivalThreshold: 200,
  collisionRewardPredator: -1000,
  collisionRewardPrey: -1000,
  rewardFactor: 1.5,
  obstaclePenaltyFactor: 0.001,
  minObstacleDistance: 1,
};

module.exports = config;

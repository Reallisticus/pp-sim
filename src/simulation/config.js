//config.js

const config = {
  MAX_STEPS_PER_EPISODE: 1000,
  collisionRewardPredator: 100,
  collisionRewardPrey: -100,
  nrOfObstacles: 3,
  nrOfPredators: 3,
  nrOfPreys: 3,
  gridSize: 10,
};

module.exports = config;

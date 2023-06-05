//config.js

const config = {
  MAX_STEPS_PER_EPISODE: 1000,
  collisionRewardPredator: 100,
  collisionRewardPrey: -100,
  nrOfObstacles: 25,
  nrOfPredators: 25,
  nrOfPreys: 25,
  gridSize: 50,
};

module.exports = config;

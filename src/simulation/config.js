//config.js

const config = {
  MAX_STEPS_PER_EPISODE: 1000,
  collisionRewardPredator: 100,
  collisionRewardPrey: -100,
  nrOfObstacles: 25,
  nrOfPredators: 50,
  nrOfPreys: 50,
  gridSize: 50,
};

module.exports = config;

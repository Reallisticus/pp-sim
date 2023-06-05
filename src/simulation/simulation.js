//simulation.js

const Predator = require('../agents/predator');
const Prey = require('../agents/prey');
const Grid = require('../environment/grid');
const Monitoring = require('../monitoring/monitoring');
const config = require('./config');

const MAX_STEPS_PER_EPISODE = config.MAX_STEPS_PER_EPISODE;

// Create a new grid
const grid = new Grid(config.gridSize);
const monitoring = new Monitoring();

let predatorTotalReward = 0;
let preyTotalReward = 0;
let stepCount = 0;
let episodeCount = 0;

let collisionRewardPredator = config.collisionRewardPredator;
let collisionRewardPrey = config.collisionRewardPrey;

const nrOfObstacles = config.nrOfObstacles;

const predators = [];
const preys = [];

for (let i = 0; i < config.nrOfPredators; i++) {
  predators.push(new Predator(null, null, grid, preys));
  preys.push(new Prey(null, null, grid));
}

// Rely on placePredators and placePreys methods to set positions
grid.setPredatorsAndPreys(predators, preys);
grid.placePredators(predators);
grid.placePreys(preys);

//Knuth algortihm, ensuring that each permutation of the array elements has an equal probability of appearance.
//Not needed currently, but might be useful in the future

// function shuffleArray(array) {
//   for (let i = array.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [array[i], array[j]] = [array[j], array[i]];
//   }
// }

function resetPositions() {
  monitoring.logEpisodeResults(predatorTotalReward, preyTotalReward, stepCount);
  // monitoring.logQValues(testingPredator.qTable);
  predatorTotalReward = 0;
  preyTotalReward = 0;
  stepCount = 0;

  grid.placePredators(predators);
  grid.placePreys(preys);
}

for (let i = 0; i < nrOfObstacles; i++) {
  let obstaclePos = grid.randomPosition();
  while (
    predators.some((p) => p.x === obstaclePos.x && p.y === obstaclePos.y) ||
    preys.some((p) => p.x === obstaclePos.x && p.y === obstaclePos.y)
  ) {
    obstaclePos = grid.randomPosition();
  }
  grid.addObstacle(obstaclePos.x, obstaclePos.y);
}

function runStep(predator, prey) {
  const predatorAction = predator.chooseAction(predator.getState());
  predator.move(predatorAction);

  const preyAction = prey.chooseAction(prey.getState());
  prey.move(preyAction);

  const predatorReward = predator.getReward(prey.getState());
  const preyReward = prey.getReward(predator.getState());

  const isCaught = grid.isCollision(predator.x, predator.y, prey.x, prey.y);

  if (isCaught || stepCount >= MAX_STEPS_PER_EPISODE) {
    episodeCount++;

    predatorTotalReward += predatorReward;
    preyTotalReward += preyReward;

    if (isCaught) {
      predatorTotalReward += collisionRewardPredator;
      preyTotalReward += collisionRewardPrey;
    }

    resetPositions();
  } else {
    predatorTotalReward += predatorReward;
    preyTotalReward += preyReward;
  }

  predator.updateQTable(
    predator.getState(),
    predatorAction,
    predatorReward,
    predator.getState()
  );
  prey.updateQTable(prey.getState(), preyAction, preyReward, prey.getState());
}

async function startSimulation(io, socket) {
  socket.emit('data', {
    predators: predators.map(({ x, y }) => ({ x, y })),
    preys: preys.map(({ x, y }) => ({ x, y })),
    obstacles: grid.obstacles,
    monitoring: {
      episodeResults: monitoring.episodeResults,
      qValues: monitoring.qValues,
    },
  });

  while (true) {
    predators.forEach((predator) => {
      preys.forEach((prey) => {
        runStep(predator, prey);
      });
    });

    stepCount++;

    socket.emit('data', {
      predators: predators.map(({ x, y }) => ({ x, y })),
      preys: preys.map(({ x, y }) => ({ x, y })),
      obstacles: grid.obstacles,
      monitoring: {
        episodeResults: monitoring.episodeResults,
        qValues: monitoring.qValues,
      },
    });

    // Wait for 2000 milliseconds before running the next iteration
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

module.exports = { startSimulation };

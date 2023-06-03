//simulation.js

const Predator = require('./agents/predator');
const Prey = require('./agents/prey');
const Grid = require('./environment/grid');
const Monitoring = require('./utils/monitoring');

const MAX_STEPS_PER_EPISODE = 10000;

// Create a new grid
const grid = new Grid(50);
const monitoring = new Monitoring();

let predatorTotalReward = 0;
let preyTotalReward = 0;
let predatorStepCount = 0;
let preyStepCount = 0;
let stepCount = 0;
let episodeCount = 0;
let collisionRewardPredator = 100;
let collisionRewardPrey = -100;

const nrOfObstacles = 25;

const predators = [];
const preys = [];

for (let i = 0; i < 50; i++) {
  predators.push(new Predator(null, null, grid));
  preys.push(new Prey(null, null, grid));
}

const testingPredator = new Predator(null, null, grid);
predators.push(testingPredator);

// Rely on placePredators and placePreys methods to set positions
grid.setPredatorsAndPreys(predators, preys);
grid.placePredators(predators);
grid.placePreys(preys);

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function resetPositions() {
  monitoring.logEpisodeResults(predatorTotalReward, preyTotalReward, stepCount);
  predatorTotalReward = 0;
  preyTotalReward = 0;
  stepCount = 0;
  shuffleArray(predators);
  shuffleArray(preys);

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

  // console.log(`Prey Reward: ${preyReward}`);
  // console.log(`Prey Step Count: ${preyStepCount}`);

  predatorStepCount++;
  preyStepCount++;

  predatorTotalReward += predatorReward;
  preyTotalReward += preyReward;

  if (isCaught) {
    predatorTotalReward += collisionRewardPredator;
    preyTotalReward += collisionRewardPrey;
  }

  if (isCaught || stepCount >= MAX_STEPS_PER_EPISODE) {
    episodeCount++;
    const totalCount = predatorStepCount + preyStepCount;
    const totalPredatorAvgReward = predatorTotalReward / predatorStepCount;
    const totalPreyAvgReward = preyTotalReward / preyStepCount;

    // console.log(`Episode: ${episodeCount}`);
    // console.log(`Predator: { x: ${predator.x}, y: ${predator.y} }`);
    // console.log(`Prey: { x: ${prey.x}, y: ${prey.y} }`);
    // console.log(
    //   `Predator - Total Reward: ${predatorTotalReward}, Average Reward per Step: ${totalPredatorAvgReward}`
    // );
    // console.log(
    //   `Prey - Total Reward: ${preyTotalReward}, Average Reward per Step: ${totalPreyAvgReward}`
    // );
    // console.log(`Total Steps: ${totalCount}`);

    predatorTotalReward = 0;
    preyTotalReward = 0;
    predatorStepCount = 0;
    preyStepCount = 0;
    stepCount = 0;
    resetPositions();
  }

  predator.updateQTable(
    predator.getState(),
    predatorAction,
    predatorReward,
    predator.getState()
  );
  prey.updateQTable(prey.getState(), preyAction, preyReward, prey.getState());

  return { predatorReward, preyReward };
}

function startSimulation(io, socket) {
  socket.emit('data', {
    predators: predators.map(({ x, y }) => ({ x, y })),
    preys: preys.map(({ x, y }) => ({ x, y })),
    obstacles: grid.obstacles,
    monitoring: {
      episodeResults: monitoring.episodeResults,
      qValues: monitoring.qValues,
    },
  });

  setInterval(() => {
    console.log(`Episode: ${episodeCount}`);

    predators.forEach((predator) => {
      preys.forEach((prey) => {
        const { predatorReward, preyReward } = runStep(predator, prey);
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
  }, 2000);
}

module.exports = { startSimulation };

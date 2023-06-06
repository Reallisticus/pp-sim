//simulation.js

const Predator = require('../agents/predator');
const Prey = require('../agents/prey');
const Grid = require('../environment/grid');
const config = require('./config');

const MAX_STEPS_PER_EPISODE = config.MAX_STEPS_PER_EPISODE;

// Create a new grid
const grid = new Grid(config.gridSize);

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
  preys.push(new Prey(null, null, grid, predators));
}

// Rely on placePredators and placePreys methods to set positions
grid.setPredatorsAndPreys(predators, preys);
grid.placePredators(predators);
grid.placePreys(preys);

function resetPositions() {
  predatorTotalReward = 0;
  preyTotalReward = 0;
  stepCount = 0;

  grid.placePredators(predators);
  grid.placePreys(preys);

  preys.forEach((prey) => {
    if (prey.stepCount >= config.preySurvivalThreshold) {
      const newPrey = prey.spawn();
      preys.push(newPrey);
    }
  });
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

async function runStep(predator, prey) {
  const predatorAction = predator.chooseAction(predator.getState());
  predator.move(predatorAction);

  const preyAction = prey.chooseAction(prey.getState());
  prey.move(preyAction);

  const predatorVisibleObstacles = grid.obstacles.filter((obstacle) => {
    predator.canSee({ x: obstacle.x, y: obstacle.y });
  });

  const predatorReward = predator.getReward(
    prey.getState(),
    predatorVisibleObstacles
  );

  const preyVisibleObstacles = grid.obstacles.filter((obstacle) => {
    prey.canSee({ x: obstacle.x, y: obstacle.y });
  });

  const preyReward = prey.getReward(predator.getState(), preyVisibleObstacles);

  const isCaught = grid.isCollision(predator.x, predator.y, prey.x, prey.y);

  if (isCaught || stepCount >= MAX_STEPS_PER_EPISODE) {
    episodeCount++;

    predatorTotalReward += predatorReward;
    preyTotalReward += preyReward;

    if (isCaught) {
      predatorTotalReward += collisionRewardPredator;
      preyTotalReward += collisionRewardPrey;

      const newPredator = predator.spawn();
      predators.push(newPredator);

      const preyIndex = preys.indexOf(prey);
      if (preyIndex !== -1) {
        preys.splice(preyIndex, 1);
      }
      stepCount++;
      predator.lastCatchStep = stepCount;
    }

    resetPositions();
  } else {
    predatorTotalReward += predatorReward;
    preyTotalReward += preyReward;
  }

  if (
    stepCount - predator.lastCatchStep >=
    config.predatorStarvationThreshold
  ) {
    // Remove the starving predator from the predators array
    const predatorIndex = predators.indexOf(predator);
    if (predatorIndex !== -1) {
      predators.splice(predatorIndex, 1);
    }
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
    visiblePreysForPredators: predators.map((predator) =>
      preys.map((prey) => predator.canSee(prey))
    ),
    visiblePredatorsForPreys: preys.map((prey) =>
      predators.map((predator) => prey.canSee(predator))
    ),
  });

  while (true) {
    predators.forEach((predator) => {
      preys.forEach((prey) => {
        runStep(predator, prey);
      });
    });

    socket.emit('data', {
      predators: predators.map(({ x, y }) => ({ x, y })),
      preys: preys.map(({ x, y }) => ({ x, y })),
      obstacles: grid.obstacles,
      visiblePreysForPredators: predators.map((predator) =>
        preys.map((prey) => predator.canSee(prey))
      ),
      visiblePredatorsForPreys: preys.map((prey) =>
        predators.map((predator) => prey.canSee(predator))
      ),
    });

    // Wait for 2000 milliseconds before running the next iteration
    await new Promise((resolve) => setTimeout(resolve, 2000));
    stepCount++;
  }
}

module.exports = { startSimulation };

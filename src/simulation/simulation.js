//simulation.js

const Predator = require('../agents/predator');
const Prey = require('../agents/prey');
const Grid = require('../environment/grid');
const config = require('./config');

const MAX_STEPS_PER_EPISODE = config.MAX_STEPS_PER_EPISODE;
const nrOfGrassObjects = config.nrOfGrassObjects;

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
  console.log(` Resetting positions...`);
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

for (let i = 0; i < nrOfGrassObjects; i++) {
  grid.spawnGrass();
}

async function runStep(predator, prey) {
  const predatorAction = predator.chooseAction(predator.getState());
  predator.move(predatorAction);

  const preyAction = prey.chooseAction(prey.getState());
  prey.move(preyAction);

  const predatorVisibleObstacles = grid.getVisibleObstacles(predator);

  const predatorReward = predator.getReward(
    prey.getState(), // Call getState() after moving the agent
    predatorVisibleObstacles
  );

  const preyVisibleObstacles = grid.getVisibleObstacles(prey);

  const preyReward = prey.getReward(
    predator.getState(), // Call getState() after moving the agent
    preyVisibleObstacles
  );

  if (grid.isGrass(prey.x, prey.y)) {
    grid.removeGrass(prey.x, prey.y);
    setTimeout(() => grid.spawnGrass(), config.grassRespawnTime);
    prey.lastGrassEatenStep = stepCount;
  }

  const isCaught = grid.isCollision(predator.x, predator.y);

  if (isCaught || stepCount >= MAX_STEPS_PER_EPISODE) {
    console.log(`Episode ${episodeCount} ended after ${stepCount} steps`);
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
        console.log(`Prey ${prey.id} was caught by predator ${predator.id} `);
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

  // Check for reproduction and starvation of predators
  predators.forEach((predator, index) => {
    if (
      stepCount - predator.lastCatchStep >=
      config.predatorStarvationThreshold
    ) {
      // Remove the starving predator from the predators array
      console.log(
        `Predator ${predator.id} starved to death, it last caught a prey at step ${predator.lastCatchStep}`
      );
      predators.splice(index, 1);
    } else if (
      stepCount - predator.lastCatchStep >=
      config.predatorReproductionThreshold
    ) {
      // Spawn a new predator
      const newPredator = predator.spawn();
      predators.push(newPredator);
    }
  });

  preys.forEach((prey, index) => {
    if (stepCount - prey.lastGrassEatenStep >= config.preyStarvationThreshold) {
      // Remove the starving prey from the preys array
      console.log(
        `Prey ${prey.id} starved to death, it last ate grass at step ${prey.lastGrassEatenStep}`
      );
      preys.splice(index, 1);
    }
  });

  // Check for reproduction of preys
  preys.forEach((prey, index) => {
    if (
      stepCount - prey.lastGrassEatenStep >=
      config.preyReproductionThreshold
    ) {
      // Spawn a new prey
      const newPrey = prey.spawn();
      preys.push(newPrey);
    }
  });

  predator.updateQTable(
    predator.getState(),
    predatorAction,
    predatorReward,
    predator.getState()
  );

  prey.updateQTable(prey.getState(), preyAction, preyReward, prey.getState());
}

function emitData(socket) {
  const obstaclePositions = [];
  grid.obstacles.forEach((v, k) => {
    if (v) {
      const [x, y] = k.split(',').map(Number);
      obstaclePositions.push({ x, y });
    }
  });

  socket.emit('data', {
    predators: predators.map(({ x, y }) => ({ x, y })),
    preys: preys.map(({ x, y }) => ({ x, y })),
    obstacles: obstaclePositions,
    visiblePreysForPredators: predators.map((predator) =>
      preys.map((prey) => predator.canSee(prey))
    ),
    visiblePredatorsForPreys: preys.map((prey) =>
      predators.map((predator) => prey.canSee(predator))
    ),
    grass: grid.grass
      .map((row, x) =>
        row.map((cell, y) => (cell ? { x, y } : null)).filter((cell) => cell)
      )
      .flat(),
  });
}

async function startSimulation(io, socket) {
  emitData(socket);

  while (true) {
    predators.forEach((predator) => {
      preys.forEach((prey) => {
        runStep(predator, prey);
      });
    });

    emitData(socket);

    // Wait for 2000 milliseconds before running the next iteration
    await new Promise((resolve) => setTimeout(resolve, 2000));
    stepCount++;
    console.log(`Step ${stepCount}`);
  }
}

module.exports = { startSimulation };

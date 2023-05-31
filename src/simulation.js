const Predator = require('./agents/predator');
const Prey = require('./agents/prey');
const Grid = require('./environment/grid');

const MAX_STEPS_PER_EPISODE = 1000;

// Create a new grid
const grid = new Grid(25);

let predatorTotalReward = 0;
let preyTotalReward = 0;
let predatorStepCount = 0;
let preyStepCount = 0;
let stepCount = 0;
let episodeCount = 0;
let collisionRewardPredator = 100;
let collisionRewardPrey = -100;

const predators = [];
const preys = [];

for (let i = 0; i < 5; i++) {
  const predatorX = Math.floor(Math.random() * grid.size);
  const predatorY = Math.floor(Math.random() * grid.size);
  predators.push(new Predator(predatorX, predatorY, grid));

  const preyX = Math.floor(Math.random() * grid.size);
  const preyY = Math.floor(Math.random() * grid.size);
  preys.push(new Prey(preyX, preyY, grid));
}

grid.placePredators(predators);
grid.placePreys(preys);

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function resetPositions() {
  shuffleArray(predators);
  shuffleArray(preys);

  grid.placePredators(predators);
  grid.placePreys(preys);
}

function runStep(predator, prey) {
  const predatorAction = predator.chooseAction(predator.getState());
  predator.move(predatorAction);

  const preyAction = prey.chooseAction(prey.getState());
  prey.move(preyAction);

  const predatorReward = predator.getReward(prey.getState());
  const preyReward = prey.getReward(predator.getState());

  predatorTotalReward += predatorReward;
  preyTotalReward += preyReward;

  stepCount++;
  predatorStepCount++;
  preyStepCount++;

  const isCaught = grid.isCollision(predator.x, predator.y, prey.x, prey.y);

  if (isCaught) {
    predatorTotalReward += collisionRewardPredator;
    preyTotalReward += collisionRewardPrey;
  }

  if (isCaught || stepCount >= MAX_STEPS_PER_EPISODE) {
    episodeCount++;
    const totalCount = predatorStepCount + preyStepCount;
    const totalPredatorAvgReward = predatorTotalReward / predatorStepCount;
    const totalPreyAvgReward = preyTotalReward / preyStepCount;

    console.log(`Episode: ${episodeCount}`);
    console.log(`Predator: { x: ${predator.x}, y: ${predator.y} }`);
    console.log(`Prey: { x: ${prey.x}, y: ${prey.y} }`);
    console.log(
      `Predator - Total Reward: ${predatorTotalReward}, Average Reward per Step: ${totalPredatorAvgReward}`
    );
    console.log(
      `Prey - Total Reward: ${preyTotalReward}, Average Reward per Step: ${totalPreyAvgReward}`
    );
    console.log(`Total Steps: ${totalCount}`);

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
}

function startSimulation(io, socket) {
  setInterval(() => {
    predators.forEach((predator) => {
      preys.forEach((prey) => {
        runStep(predator, prey);
      });
    });

    socket.emit('data', {
      predators: predators.map(({ x, y }) => ({ x, y })),
      preys: preys.map(({ x, y }) => ({ x, y })),
    });
  }, 1000);
}

module.exports = { startSimulation };

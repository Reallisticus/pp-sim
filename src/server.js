const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3000;

const Predator = require('./agents/predator');
const Prey = require('./agents/prey');
const Grid = require('./environment/grid');

// Create a new grid
const grid = new Grid(10);

let predatorTotalReward = 0;
let preyTotalReward = 0;
let predatorStepCount = 0;
let preyStepCount = 0;
let stepCount = 0;
let episodeCount = 0;

const predators = [];
const preys = [];

for (let i = 0; i < 10; i++) {
  const predatorX = Math.floor(Math.random() * grid.size);
  const predatorY = Math.floor(Math.random() * grid.size);
  predators.push(new Predator(predatorX, predatorY, grid.size));

  const preyX = Math.floor(Math.random() * grid.size);
  const preyY = Math.floor(Math.random() * grid.size);
  preys.push(new Prey(preyX, preyY, grid.size));
}

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// server.js
io.on('connection', (socket) => {
  console.log('a user connected');

  setInterval(() => {
    predators.forEach((predator, predatorIndex) => {
      const predatorAction = predator.chooseAction(predator.getState());
      predator.move(predatorAction);

      preys.forEach((prey, preyIndex) => {
        const preyAction = prey.chooseAction(prey.getState());
        prey.move(preyAction);

        const predatorReward = predator.getReward(prey.getState());
        const preyReward = prey.getReward(predator.getState());

        predatorTotalReward += predatorReward;
        preyTotalReward += preyReward;

        stepCount++;
        predatorStepCount++;
        preyStepCount++;

        const distance = Math.sqrt(
          Math.pow(predator.x - prey.x, 2) + Math.pow(predator.y - prey.y, 2)
        );

        if (distance === 0) {
          episodeCount++;
          const totalCount = predatorStepCount + preyStepCount;
          const totalPredatorAvgReward =
            predatorTotalReward / predatorStepCount;
          const totalPreyAvgReward = preyTotalReward / preyStepCount;

          console.log(`Episode: ${episodeCount}`);
          console.log(
            `Predator ${predatorIndex}: { x: ${predator.x}, y: ${predator.y} }`
          );
          console.log(`Prey ${preyIndex}: { x: ${prey.x}, y: ${prey.y} }`);
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
        }

        predator.updateQTable(
          predator.getState(),
          predatorAction,
          predatorReward,
          predator.getState()
        );
        prey.updateQTable(
          prey.getState(),
          preyAction,
          preyReward,
          prey.getState()
        );
      });
    });

    socket.emit('data', {
      predators: predators.map(({ x, y }) => ({ x, y })),
      preys: preys.map(({ x, y }) => ({ x, y })),
    });
  }, 1000);
});

server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

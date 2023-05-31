// const { ActorCriticNetwork } = require('../agents/actorCriticNetwork');

// async function trainA3C() {
//   const nWorkers = 8;
//   const updateFreq = 20;
//   const maxEpisode = 200;
//   const gridSize = 25;
//   const stateSize = 2;
//   const actionSize = 4;

//   const predsGlobal = new ActorCriticNetwork(stateSize, actionSize);
//   const preysGlobal = new ActorCriticNetwork(stateSize, actionSize);

//   predsGlobal.model.summary();
//   preysGlobal.model.summary();

//   async function trainingLoop(agentGlobal, isPredator, nWorker, maxEpisode) {
//     let episodeCount = 0;

//     while (episodeCount < maxEpisode) {
//       let localAgent = new ActorCriticAgent(agentGlobal);

//       // Run single episode
//       let state = isPredator ? predatorInitialState() : preyInitialState();
//       let done = false;
//       let stepCount = 0;
//       const states = [];
//       const actions = [];
//       const rewards = [];
//       const dones = [];

//       while (!done && stepCount < updateFreq) {
//         const action = localAgent.chooseAction(state);
//         const newState = isPredator
//           ? predatorNextState(stateSize, gridSize, action)
//           : preyNextState(stateSize, gridSize, action);
//         const reward = isPredator
//           ? predatorReward(state, newState)
//           : preyReward(state, newState);
//         const collision = checkCollision(state, newState);

//         states.push(state);
//         actions.push(action);
//         rewards.push(reward);
//         dones.push(collision);

//         if (collision) {
//           done = true;
//         } else {
//           state = newState;
//           stepCount++;
//         }
//       }

//       // Update parameters
//       await localAgent.updateParameters(states, actions, rewards, dones);
//       localAgent.transferWeightsTo(agentGlobal);
//       episodeCount++;
//       console.log(
//         isPredator
//           ? `Predator worker ${nWorker}, Episode: ${episodeCount}`
//           : `Prey worker ${nWorker}, Episode: ${episodeCount}`
//       );
//     }
//   }

//   function predatorInitialState(gridSize) {
//     const predatorX = Math.floor(Math.random() * gridSize);
//     const predatorY = Math.floor(Math.random() * gridSize);
//     return [predatorX, predatorY];
//   }

//   function predatorNextState(gridSize, action) {
//     const predatorX = state[0];
//     const predatorY = state[1];
//     let newPredatorX = predatorX;
//     let newPredatorY = predatorY;
//     switch (action) {
//       case 0:
//         newPredatorX = predatorX - 1;
//         break;
//       case 1:
//         newPredatorX = predatorX + 1;
//         break;
//       case 2:
//         newPredatorY = predatorY - 1;
//         break;
//       case 3:
//         newPredatorY = predatorY + 1;
//         break;
//       default:
//         break;
//     }
//     newPredatorX = Math.min(Math.max(newPredatorX, 0), gridSize - 1);
//     newPredatorY = Math.min(Math.max(newPredatorY, 0), gridSize - 1);
//     return [newPredatorX, newPredatorY];
//   }

//   function predatorReward(state, newState, preyState) {
//     const distance = (x1, y1, x2, y2) =>
//       Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

//     const predatorX = state[0];
//     const predatorY = state[1];

//     const newPredatorX = newState[0];
//     const newPredatorY = newState[1];

//     const preyX = preyState[0];

//     const preyY = preyState[1];

//     const oldDistance = distance(predatorX, predatorY, preyX, preyY);
//     const newDistance = distance(newPredatorX, newPredatorY, preyX, preyY);

//     const scalingFactor = 1 / (gridSize * Math.sqrt(2));
//     const reward = scalingFactor * (oldDistance - newDistance);

//     if (newDistance <= 1) {
//       return 100;
//     }

//     if (oldDistance === newDistance) {
//       return -1;
//     }

//     return reward;
//   }

//   function preyInitialState() {
//     const preyX = Math.floor(Math.random() * gridSize);
//     const preyY = Math.floor(Math.random() * gridSize);
//     return [preyX, preyY];
//   }

//   function preyNextState(gridSize, action) {
//     const preyX = state[0];
//     const preyY = state[1];
//     let newPreyX = preyX;
//     let newPreyY = preyY;

//     switch (action) {
//       case 0:
//         newPreyX = preyX - 1;
//         break;
//       case 1:
//         newPreyX = preyX + 1;
//         break;
//       case 2:
//         newPreyY = preyY - 1;
//         break;
//       case 3:
//         newPreyY = preyY + 1;
//         break;
//       default:
//         break;
//     }

//     newPreyX = Math.min(Math.max(newPreyX, 0), gridSize - 1);
//     newPreyY = Math.min(Math.max(newPreyY, 0), gridSize - 1);
//     return [newPreyX, newPreyY];
//   }

//   function preyReward(state, newState, predatorState) {
//     const distance = (x1, y1, x2, y2) =>
//       Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

//     const preyX = state[0];
//     const preyY = state[1];

//     const predatorX = predatorState[0];
//     const predatorY = predatorState[1];

//     const newPreyX = newState[0];
//     const newPreyY = newState[1];

//     const preyDistance = distance(preyX, preyY, predatorX, predatorY);
//     const newPreyDistance = distance(newPreyX, newPreyY, predatorX, predatorY);

//     const scalingFactor = 1 / (gridSize * Math.sqrt(2));
//     const reward = scalingFactor * (preyDistance - newPreyDistance);

//     if (newPreyDistance <= 1) {
//       return 100;
//     }

//     if (preyDistance === newPreyDistance) {
//       return -1;
//     }

//     return reward;
//   }

//   function checkCollision(state, newState) {
//     // Check if there is a collision between predator and prey based on their states
//   }

//   const predatorsPromises = [];
//   const preyPromises = [];

//   for (let i = 0; i < nWorkers; i++) {
//     predatorsPromises.push(trainingLoop(predsGlobal, true, i, maxEpisode));
//     preyPromises.push(trainingLoop(preysGlobal, false, i, maxEpisode));
//   }

//   await Promise.all([...predatorsPromises, ...preyPromises]);

//   predsGlobal.model.summary();
//   preysGlobal.model.summary();
// }

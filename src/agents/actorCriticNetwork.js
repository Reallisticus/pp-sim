// const tf = require('@tensorflow/tfjs');
// const { Sequential, layers } = require('@tensorflow/tfjs-layers');

// class ActorCriticNetwork {
//   constructor(stateSize, actionSize) {
//     this.stateSize = stateSize;
//     this.actionSize = actionSize;
//     this.model = this._createModel();
//     this.optimizer = tf.train.adam(0.001);
//   }

//   _createModel() {
//     const model = new Sequential();
//     model.add(
//       layers.dense({
//         units: 24,
//         activation: 'relu',
//         inputShape: [this.stateSize],
//       })
//     );
//     model.add(layers.dense({ units: 24, activation: 'relu' }));
//     model.add(layers.dense({ units: this.actionSize, activation: 'linear' }));
//     return model;
//   }

//   chooseAction(state) {
//     return tf.tidy(() => {
//       const logits = this.model.predict(tf.tensor2d([state]));
//       const actionProbs = tf.softmax(logits);
//       const actions = tf.multinomial(actionProbs, 1).dataSync();
//       return actions[0];
//     });
//   }

//   computeAdvantages(values, rewards, dones) {
//     return tf.tidy(() => {
//       const returns = [];
//       let expectedFutureReward = 0.0;
//       const gamma = 0.99;
//       for (let t = rewards.length - 1; t >= 0; --t) {
//         if (!dones[t]) {
//           expectedFutureReward = gamma * expectedFutureReward + rewards[t];
//         } else {
//           expectedFutureReward = rewards[t];
//         }
//         returns[t] = expectedFutureReward - values[t];
//       }
//       return returns;
//     });
//   }
// }

// module.exports = ActorCriticNetwork;

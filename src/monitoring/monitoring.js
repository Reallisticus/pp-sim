// monitoring.js

class Monitoring {
  constructor() {
    this.episodeResults = [];
    this.qValues = [];
  }

  logEpisodeResults(predatorTotalReward, preyTotalReward, stepCount) {
    this.episodeResults.push({
      predatorTotalReward,
      preyTotalReward,
      stepCount,
    });
  }

  getAverageRewardsPerEpisode() {
    return this.episodeResults.map((result) => ({
      predatorAvgReward: result.predatorTotalReward / result.stepCount,
      preyAvgReward: result.preyTotalReward / result.stepCount,
    }));
  }

  logQValues(qTable) {
    this.qValues.push(qTable);
  }

  getMaxQValues() {
    return this.qValues.map((qTable) => {
      let maxQ = -Infinity;
      for (const state in qTable) {
        for (const action in qTable[state]) {
          maxQ = Math.max(maxQ, qTable[state][action]);
        }
      }
      return maxQ;
    });
  }

  getStepsPerEpisode() {
    return this.episodeResults.map((result) => result.stepCount);
  }

  // Add other methods for visualizing the learned policy and testing the learned policy
}

module.exports = Monitoring;

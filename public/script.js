//public/script.js

const socket = io();
const gridEl = document.getElementById('grid');

const agentSize = 10;

const updateInterval = 10; // Update the plots every 10 data points
let dataPointsReceived = 0;
let config;

socket.on('data', (data) => {
  console.log(data);
  updateDots(data.obstacles, 'obstacle');
  updateDots(data.predators, 'predator');
  updateDots(data.preys, 'prey');

  dataPointsReceived++;

  if (dataPointsReceived >= updateInterval) {
    plotAverageRewards(data.monitoring.episodeResults);
    plotStepsPerEpisode(data.monitoring.episodeResults);
    plotMaxQValues(data.monitoring.qValues);
    dataPointsReceived = 0;
  }
});

function plotAverageRewards(episodeResults) {
  const predatorAvgRewards = episodeResults.map(
    (result) => result.predatorTotalReward / result.stepCount
  );
  const preyAvgRewards = episodeResults.map(
    (result) => result.preyTotalReward / result.stepCount
  );

  const tracePredator = {
    x: Array.from({ length: episodeResults.length }, (_, i) => i + 1),
    y: predatorAvgRewards,
    mode: 'lines',
    name: 'Predator',
  };

  const tracePrey = {
    x: Array.from({ length: episodeResults.length }, (_, i) => i + 1),
    y: preyAvgRewards,
    mode: 'lines',
    name: 'Prey',
  };

  const layout = {
    title: 'Average Reward per Episode',
    xaxis: { title: 'Episode' },
    yaxis: { title: 'Average Reward' },
  };

  Plotly.newPlot('rewards-plot', [tracePredator, tracePrey], layout);
}

function plotStepsPerEpisode(episodeResults) {
  const stepsPerEpisode = episodeResults.map((result) => result.stepCount);

  const trace = {
    x: Array.from({ length: episodeResults.length }, (_, i) => i + 1),
    y: stepsPerEpisode,
    mode: 'lines',
    name: 'Steps',
  };

  const layout = {
    title: 'Number of Steps per Episode',
    xaxis: { title: 'Episode' },
    yaxis: { title: 'Steps' },
  };

  Plotly.newPlot('steps-plot', [trace], layout);
}

function plotMaxQValues(qValues) {
  const maxQValues = qValues.map((qTable) => {
    let maxQ = -Infinity;
    for (const state in qTable) {
      for (const action in qTable[state]) {
        maxQ = Math.max(maxQ, qTable[state][action]);
      }
    }
    return maxQ;
  });

  const trace = {
    x: Array.from({ length: qValues.length }, (_, i) => i + 1),
    y: maxQValues,
    mode: 'lines',
    name: 'Max Q-value',
  };

  const layout = {
    title: 'Maximum Q-value over Time',
    xaxis: { title: 'Time' },
    yaxis: { title: 'Max Q-value' },
  };

  Plotly.newPlot('qvalues-plot', [trace], layout);
}

function updateDots(agentData, type) {
  const existingDots = document.querySelectorAll(`.${type}`);

  // Remove extra dots if there are more on the DOM than in the new data
  for (let i = agentData.length; i < existingDots.length; i++) {
    existingDots[i].remove();
  }

  agentData.forEach((agent, index) => {
    let dotElement;

    if (index < existingDots.length) {
      // Update the position of an existing dot
      dotElement = existingDots[index];
      moveDot(dotElement, agent.x, agent.y);
    } else {
      // Create a new dot if there are fewer on the DOM than in the new data
      dotElement = createDot(agent.x, agent.y, type);
    }
  });
}

function createDot(x, y, type) {
  const dotElement = document.createElement('div');
  dotElement.id = `${type}-${Date.now()}`;
  dotElement.className = type;

  dotElement.style.width = `${agentSize}px`;
  dotElement.style.height = `${agentSize}px`;
  dotElement.style.borderRadius = '100%';
  dotElement.style.position = 'absolute';

  gridEl.appendChild(dotElement);

  if (type !== 'obstacle') {
    moveDot(dotElement, x, y);
  } else {
    dotElement.style.borderRadius = '20%';
    // Set obstacle position without animation
    moveDot(dotElement, x, y, false);
  }

  const cellSize =
    Math.min(window.innerWidth, window.innerHeight) / config.gridSize;
  dotElement.style.transform = `translate(${x * cellSize}px, ${
    y * cellSize
  }px)`;

  return dotElement;
}

function moveDot(dot, x, y, animate = true) {
  const cellSize =
    Math.min(window.innerWidth, window.innerHeight) / config.gridSize;

  if (animate) {
    gsap.to(dot, {
      duration: 2, // Animation duration
      x: x * cellSize, // Compute X position
      y: y * cellSize, // Compute Y position
      ease: 'sine.inOut', // Animation easing function
    });
  } else {
    dot.style.transform = `translate(${x * cellSize}px, ${y * cellSize}px)`;
  }
}

function generateEmptyCells() {
  // Clear the grid
  gridEl.innerHTML = '';

  // Generate new cells based on the gridSize from the config
  for (let i = 0; i < config.gridSize * config.gridSize; i++) {
    const gridCell = document.createElement('div');
    gridCell.className = 'grid-cell';
    gridEl.appendChild(gridCell);
  }

  // Update the grid template columns and rows
  gridEl.style.gridTemplateColumns = `repeat(${config.gridSize}, 1fr)`;
  gridEl.style.gridTemplateRows = `repeat(${config.gridSize}, 1fr)`;
}

fetch('/config')
  .then((response) => response.json())
  .then((data) => {
    config = data;
    generateEmptyCells();
  });

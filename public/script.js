//public/script.js

const socket = io();
const gridEl = document.getElementById('grid');

const agentSize = 15;

const updateInterval = 10; // Update the plots every 10 data points
let dataPointsReceived = 0;
let config;

socket.on('data', (data) => {
  updateDots(data.obstacles, 'obstacle');
  updateDots(data.predators, 'predator', data.visiblePreysForPredators);
  updateDots(data.preys, 'prey', data.visiblePredatorsForPreys);
});

function updateDots(agentData, type, visibilityData = false) {
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

    if (visibilityData) {
      dotElement.style.opacity = visibilityData[index] ? 1 : 0.3;
    } else {
      dotElement.style.opacity = 1;
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
    const rect = dot.getBoundingClientRect();
    const gridRect = gridEl.getBoundingClientRect();
    const currentX = rect.left - gridRect.left;
    const currentY = rect.top - gridRect.top;
    const newXPos = x * cellSize;
    const newYPos = y * cellSize;

    // Check if the dot is wrapping around the grid
    const isWrappingX =
      Math.abs(newXPos - currentX) > cellSize * (config.gridSize - 1);
    const isWrappingY =
      Math.abs(newYPos - currentY) > cellSize * (config.gridSize - 1);

    if (isWrappingX || isWrappingY) {
      // Calculate the intermediate position outside the grid
      const intermediateXPos = isWrappingX
        ? newXPos > currentX
          ? currentX - cellSize
          : currentX + cellSize
        : currentX;
      const intermediateYPos = isWrappingY
        ? newYPos > currentY
          ? currentY - cellSize
          : currentY + cellSize
        : currentY;

      // Animate the dot to move off the grid
      gsap.to(dot, {
        duration: 1, // Animation duration
        x: intermediateXPos,
        y: intermediateYPos,
        ease: 'sine.inOut', // Animation easing function
        onComplete: () => {
          // Animate the dot to move back onto the grid from the opposite side
          gsap.to(dot, {
            duration: 1, // Animation duration
            x: newXPos,
            y: newYPos,
            ease: 'sine.easeIn', // Animation easing function
          });
        },
      });
    } else {
      gsap.to(dot, {
        duration: 2, // Animation duration
        x: newXPos, // Compute X position
        y: newYPos, // Compute Y position
        ease: 'sine.inOut', // Animation easing function
      });
    }
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
    socket.emit('simulationStart');
  });

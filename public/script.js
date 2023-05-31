const socket = io();
const gridEl = document.getElementById('grid');

const gridSize = 25;

const gridWidth = Math.min(window.innerWidth, window.innerHeight) - 50;
const gridHeight = gridWidth;
gridEl.style.width = `${gridWidth}px`;
gridEl.style.height = `${gridHeight}px`;

// Calculate agent dimensions
const agentSize = gridWidth / gridSize - 3;

socket.on('data', (data) => {
  document.querySelectorAll('.predator, .prey').forEach((e) => e.remove());

  data.predators.forEach((predatorData) => {
    createDot(predatorData.x, predatorData.y, 'predator');
  });
  data.preys.forEach((preyData) => {
    createDot(preyData.x, preyData.y, 'prey');
  });
});

function createDot(x, y, type) {
  const dotElement = document.createElement('div');
  dotElement.id = `${type}-${Date.now()}`;
  dotElement.className = type;

  dotElement.style.width = `${agentSize}px`;
  dotElement.style.height = `${agentSize}px`;
  dotElement.style.borderRadius = '100%';
  dotElement.style.position = 'absolute';

  gridEl.appendChild(dotElement);

  moveDot(dotElement, x, y);
}

function moveDot(dot, x, y) {
  const cellSize = gridWidth / gridSize; // Calculate cell size
  const offsetX = (gridWidth - cellSize * gridSize) / 2; // Calculate possible X-axis offset
  const offsetY = (gridHeight - cellSize * gridSize) / 2; // Calculate possible Y-axis offset

  // Use GSAP to animate agent position
  gsap.to(dot, {
    duration: 1.2, // Animation duration
    x: x * cellSize + offsetX, // Compute X position
    y: y * cellSize + offsetY, // Compute Y position
    ease: 'sine.inOut', // Animation easing function
  });
}

(function generateEmptyCells() {
  for (let i = 0; i < 625; i++) {
    const gridCell = document.createElement('div');
    gridCell.className = 'grid-cell';
    gridEl.appendChild(gridCell);
  }
})();

const socket = io();
const gridEl = document.getElementById('grid');

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

  gridEl.appendChild(dotElement);

  moveDot(dotElement, x, y);
}

function moveDot(dot, x, y) {
  dot.style.gridColumnStart = x + 1;
  dot.style.gridRowStart = y + 1;
}

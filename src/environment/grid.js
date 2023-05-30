// grid.js
class Grid {
  constructor(size) {
    this.size = size;
    this.grid = Array(this.size)
      .fill()
      .map(() => Array(this.size).fill(' '));
  }

  printGrid() {
    this.grid.forEach((row) => console.log(row.join(' | ')));
  }
}

module.exports = Grid;

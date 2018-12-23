document.addEventListener('DOMContentLoaded', main);

function main() {
  // 60 x 60 Pixel board (1 pixel is 10 x 10 px)
  const board: HTMLCanvasElement = document.getElementById('board') as HTMLCanvasElement;
  const ctx = board.getContext('2d');

  ctx.fillStyle = 'green';
  ctx.fillRect(0, 0, 20, 50);
}

document.addEventListener('DOMContentLoaded', main);

const PIXEL_SIZE = 20;
const PIXEL_PADDING = 1;
const BOARD_SIZE = 600;

type PixelCoord = 0 | 20 | 40 | 60 | 80 | 100 | 120 | 140
  | 160 | 180 | 200 | 220 | 240 | 260 | 280 | 300 | 320
  | 340 | 360 | 380 | 400 | 420 | 440 | 460 | 480 | 500
  | 520 | 540 | 560 | 580;

interface Pixel {
  x: PixelCoord;
  y: PixelCoord;
}

type Snake = Pixel[];

function main() {
  // 30 x 30 Pixel board (1 pixel is 20 x 20 px)
  const board: HTMLCanvasElement = document.getElementById('board') as HTMLCanvasElement;
  const ctx = board.getContext('2d');

  const snake: Snake = [
    { x: 0, y: 0 },
    { x: 20, y: 0 },
    { x: 40, y: 0 },
    { x: 40, y: 20 },
    { x: 40, y: 40 },
    { x: 40, y: 60 },
    { x: 60, y: 60 },
    { x: 80, y: 60 },
    { x: 80, y: 80 },
  ];

  drowSnake(ctx, snake);
}

function drowPixel(ctx: CanvasRenderingContext2D, x: PixelCoord, y: PixelCoord) {
  ctx.fillStyle = 'gray';
  ctx.fillRect(x + PIXEL_PADDING / 2,
               y + PIXEL_PADDING / 2,
               PIXEL_SIZE - PIXEL_PADDING,
               PIXEL_SIZE - PIXEL_PADDING);
}

function drowSnake(ctx: CanvasRenderingContext2D, snake: Snake) {
  snake.forEach((px) => {
    drowPixel(ctx, px.x, px.y);
  });
}

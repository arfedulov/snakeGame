import contains from './utils/contains';

document.addEventListener('DOMContentLoaded', main);
document.addEventListener('keydown', handleKeyPress);

const PIXEL_SIZE = 20;
const PIXEL_PADDING = 1;
const BOARD_SIZE = 600;
const DROWING_LATENCY = 250; // ms

type PixelCoord = 0 | 20 | 40 | 60 | 80 | 100 | 120 | 140
  | 160 | 180 | 200 | 220 | 240 | 260 | 280 | 300 | 320
  | 340 | 360 | 380 | 400 | 420 | 440 | 460 | 480 | 500
  | 520 | 540 | 560 | 580;

interface Pixel {
  x: PixelCoord;
  y: PixelCoord;
}

type Snake = Pixel[];

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

let snakeDirection: Direction = 'DOWN';
// used for preventing change direction faster than drowing happens
let snakeDirectionBlocked: boolean = false;

function main() {
  // 30 x 30 Pixel board (1 pixel is 20 x 20 px)
  const board: HTMLCanvasElement = document.getElementById('board') as HTMLCanvasElement;
  const ctx = board.getContext('2d');

  const mainLoop = setInterval(() => {
    drowSnake(ctx);
    if (failingGameConditions()) {
      clearInterval(mainLoop);
      alert('Game Over');
    }
    moveSnake(snakeDirection);
  }, DROWING_LATENCY);
}

function failingGameConditions(): boolean {
  const snakeCoordsChecked: Snake = [];
  for (let i = 0, len = snake.length; i < len; i++) {
    if (contains<Pixel>(snakeCoordsChecked, (coord) => snake[i].x === coord.x && snake[i].y === coord.y)) {
      return true;
    }
    snakeCoordsChecked.push(snake[i]);
  }

  return false;
}

function handleKeyPress(e) {
  if (snakeDirectionBlocked) {
    return;
  }
  switch (e.key) {
    case 'Up':
    case 'ArrowUp':
      snakeDirection = snakeDirection !== 'DOWN' ? 'UP' : 'DOWN';
      break;
    case 'Down':
    case 'ArrowDown':
      snakeDirection = snakeDirection !== 'UP' ? 'DOWN' : 'UP';
      break;
    case 'Left':
    case 'ArrowLeft':
      snakeDirection = snakeDirection !== 'RIGHT' ? 'LEFT' : 'RIGHT';
      break;
    case 'Right':
    case 'ArrowRight':
      snakeDirection = snakeDirection !== 'LEFT' ? 'RIGHT' : 'LEFT';
      break;
    default:
      break;
  }
  snakeDirectionBlocked = true;
  setTimeout(() => {
    snakeDirectionBlocked = false;
  }, DROWING_LATENCY);
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

function moveSnake(direction: Direction) {
  switch (direction) {
    case 'UP':
      snake.unshift({ x: snake[0].x, y: subPixel(snake[0].y)});
      break;
    case 'DOWN':
      snake.unshift({ x: snake[0].x, y: addPixel(snake[0].y)});
      break;
    case 'LEFT':
      snake.unshift({ x: subPixel(snake[0].x), y: snake[0].y});
      break;
    case 'RIGHT':
      snake.unshift({ x: addPixel(snake[0].x), y: snake[0].y});
      break;
    default:
      throw Error('moveSnake(s, direction): invalid value for argument `direction`');
  }
  snake.pop();
}

function addPixel(value: PixelCoord): PixelCoord {
  if (value === BOARD_SIZE - PIXEL_SIZE) {
    return 0;
  }

  return (value + PIXEL_SIZE) as PixelCoord;
}

function subPixel(value: PixelCoord): PixelCoord {
  if (value === 0) {
    return (BOARD_SIZE - PIXEL_SIZE) as PixelCoord;
  }

  return (value - PIXEL_SIZE) as PixelCoord;
}

function drowPixel(ctx: CanvasRenderingContext2D, x: PixelCoord, y: PixelCoord) {
  ctx.fillStyle = 'gray';
  ctx.fillRect(x + PIXEL_PADDING / 2,
               y + PIXEL_PADDING / 2,
               PIXEL_SIZE - PIXEL_PADDING,
               PIXEL_SIZE - PIXEL_PADDING);
}

function drowSnake(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
  snake.forEach((px) => {
    drowPixel(ctx, px.x, px.y);
  });
}

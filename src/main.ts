import contains from './utils/contains';

document.addEventListener('DOMContentLoaded', main);
document.addEventListener('keydown', handleKeyPress);

const SNAKE_COLOR = 'rgb(100, 100, 110)';

const PIXEL_SIZE = 20;
const PIXEL_PADDING = 1;
const BOARD_SIZE = 600;
const DROWING_LATENCY = 150; // ms
const APPROACH_LIMIT = 10; // how close to snake's head may a particle respawn (in Pixel units)

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
];

type ParticleOpacity = 0.25 | 0.5 | 0.75 | 1;

const particle: Pixel = { x: 0, y: 0 };
let particleOpacity: ParticleOpacity = 0.25;

let snakeDirection: Direction = 'DOWN';
// used for preventing change direction faster than drowing happens
let snakeDirectionBlocked: boolean = false;

function main() {
  // 30 x 30 Pixel board (1 pixel is 20 x 20 px)
  const board: HTMLCanvasElement = document.getElementById('board') as HTMLCanvasElement;
  const ctx = board.getContext('2d');

  positionParticle();

  const mainLoop = setInterval(() => {
    ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
    drowParticle(ctx);
    drowSnake(ctx);
    if (failingGameConditions()) {
      clearInterval(mainLoop);
      alert('Game Over');
    }
    handleParticleCollide();

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

function drowPixel(ctx: CanvasRenderingContext2D, x: PixelCoord, y: PixelCoord, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x + PIXEL_PADDING / 2,
               y + PIXEL_PADDING / 2,
               PIXEL_SIZE - PIXEL_PADDING,
               PIXEL_SIZE - PIXEL_PADDING);
}

function drowSnake(ctx: CanvasRenderingContext2D) {
  snake.forEach((px) => {
    drowPixel(ctx, px.x, px.y, SNAKE_COLOR);
  });
}

function drowParticle(ctx: CanvasRenderingContext2D) {
  drowPixel(ctx, particle.x, particle.y, `rgba(100, 100, 110, ${particleOpacity})`);
  particleOpacity = ((particleOpacity + 0.25) % 1) as ParticleOpacity;
}

function handleParticleCollide() {
  if (snake[0].x === particle.x && snake[0].y === particle.y) {
    increaseSnakeLength();
    positionParticle();
  }
}

function increaseSnakeLength() {
  const tail = snake[snake.length - 1];
  switch (snakeDirection) {
    case 'UP':
      snake.push({ x: tail.x, y: (tail.y + PIXEL_SIZE) as PixelCoord });
      break;
    case 'DOWN':
      snake.push({ x: tail.x, y: (tail.y - PIXEL_SIZE) as PixelCoord });
      break;
    case 'LEFT':
      snake.push({ x: (tail.x + PIXEL_SIZE) as PixelCoord, y: tail.y });
      break;
    case 'RIGHT':
      snake.push({ x: (tail.x - PIXEL_SIZE) as PixelCoord, y: tail.y });
      break;
    default:
      break;
  }
}

function positionParticle() {
  let pixel = getRandomPixelPosition();

  while (!particleIsFarEnoughFromSnake(pixel)) {
    pixel = getRandomPixelPosition();
  }
  particle.x = pixel.x;
  particle.y = pixel.y;
}

function particleIsFarEnoughFromSnake(pixel: Pixel): boolean {
  const distance = Math.sqrt(((snake[0].x - pixel.x) ** 2) + ((snake[0].y - pixel.y) ** 2));
  for (let i = 0, len = snake.length; i < len; i++) {
    if (snake[i].x === pixel.x && snake[i].y === pixel.y) {
      return false;
    }
    if (distance < PIXEL_SIZE * APPROACH_LIMIT) {
      return false;
    }
  }

  return true;
}

function getRandomPixelPosition(): Pixel {
  return {
    x: (Math.floor((Math.random() * BOARD_SIZE / PIXEL_SIZE)) * PIXEL_SIZE) as PixelCoord,
    y: (Math.floor((Math.random() * BOARD_SIZE / PIXEL_SIZE)) * PIXEL_SIZE) as PixelCoord,
  };
}

// TODO:
//   * add restart button
//   * add levels

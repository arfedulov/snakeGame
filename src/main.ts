import contains from './utils/contains';

document.addEventListener('DOMContentLoaded', main);
document.addEventListener('keydown', handleKeyPress);

const SNAKE_COLOR = 'rgb(100, 100, 110)';

const PIXEL_SIZE = 20;
const PIXEL_PADDING = 1;
const BOARD_SIZE = 600;

/** Base redrawing latency for the game (in milliseconds). */
const DRAWING_LATENCY = 150;

/** How close to snake's head may a particle respawn (in Pixel units). */
const APPROACH_LIMIT = 10;

/** Particle's opacity changing latency (in milliseconds). */
const BLINKING_LATENCY = 100;

/** Coordinates for the text that displays current level. */
const LEVEL_TEXT_POSITION = { x: PIXEL_SIZE, y: PIXEL_SIZE * 2 };

/** Coordinates for the text that displays player's lives left. */
const LIVES_TEXT_POSITION = { x: BOARD_SIZE - PIXEL_SIZE, y: PIXEL_SIZE * 2 };

/** Represents x or y coordinate of a Pixel on the board. */
type PixelCoord = 0 | 20 | 40 | 60 | 80 | 100 | 120 | 140
  | 160 | 180 | 200 | 220 | 240 | 260 | 280 | 300 | 320
  | 340 | 360 | 380 | 400 | 420 | 440 | 460 | 480 | 500
  | 520 | 540 | 560 | 580;

/** Represents a fixed size pixel on game board. */
interface Pixel {
  x: PixelCoord;
  y: PixelCoord;
}

type Snake = Pixel[];

/** Game and round initialized with this snake. */
const initialSnake: Snake = [
  { x: 0, y: 0 },
  { x: 20, y: 0 },
  { x: 40, y: 0 },
];

/** Current snake's state. */
let snake: Snake = initialSnake.slice(0, initialSnake.length);

/** The particle on which a player is aiming. */
const particle: Pixel = { x: 0, y: 0 };

type ParticleOpacity = 0.25 | 0.5 | 0.75 | 1;

/** Particle's current opacity value (used for blinking). */
let particleOpacity: ParticleOpacity = 0.25;

/** Current snake's direction. */
let snakeDirection: Direction = 'DOWN';

// used for preventing change direction faster than drawing happens
let snakeDirectionBlocked: boolean = false;

type GameLevel = 0 | 1 | 2 | 3 | 4;

/** Maximum value for game level. */
const MAX_LEVEL = 4;

let gameLevel: GameLevel = 0;

/** Player's lives. */
let lives = 3;

/** Draw game's state values on the board (during the whole game). */
function drawText(ctx: CanvasRenderingContext2D) {
  ctx.font = '18px "Press Start 2P", cursive';
  ctx.fillStyle = 'rgba(50, 50, 50, .5)';
  ctx.textAlign = 'start';
  ctx.fillText(`Level: ${gameLevel}`, LEVEL_TEXT_POSITION.x, LEVEL_TEXT_POSITION.y);
  ctx.textAlign = 'end';
  ctx.fillText(`Lives: ${lives}`, LIVES_TEXT_POSITION.x, LIVES_TEXT_POSITION.y);
}

/** Draw some important text message in the midddle of board. */
function drawFinalText(ctx: CanvasRenderingContext2D, text: string) {
  ctx.font = '40px "Press Start 2P", cursive';
  ctx.fillStyle = 'rgba(50, 50, 50, .5)';
  ctx.textAlign = 'center';
  ctx.fillText(text, BOARD_SIZE / 2, BOARD_SIZE / 2);
}

/** Compute game redrawing interval depending on given game level and base redrawing interval. */
function computeDrawingLatency(level: GameLevel, baseLatency: number): number {
  return baseLatency * (1 - (0.1 * level));
}

/** Define maximum snake's length for each game level. */
const MAX_SNAKE_LENGTH_FOR_LEVEL = {
  0: 6,
  1: 8,
  2: 10,
  3: 15,
  4: 20,
};

/** Check if the game's state mean that the player win at current game level. */
function checkLevelWinningConditions(): boolean {
  if (snake.length > MAX_SNAKE_LENGTH_FOR_LEVEL[gameLevel]) {
    return true;
  }

  return false;
}

function main() {
  // 30 x 30 Pixel board (1 pixel is 20 x 20 px)
  const board: HTMLCanvasElement = document.getElementById('board') as HTMLCanvasElement;
  const ctx = board.getContext('2d');

  const restartButton = document.getElementById('restartBtn');
  if (restartButton) {
    restartButton.addEventListener('click', () => {
      document.location.reload();
    });
  }
  const startButton = document.getElementById('startBtn');
  if (startButton) {
    startButton.addEventListener('click', () => {
      playGame(ctx);
    });
  }
}

/** Draw all the game's parts, do game condition checks. Return `true` if game is continuing after current draw. */
function drawGame(ctx: CanvasRenderingContext2D): boolean {
  ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
  drawText(ctx);
  drawParticle(ctx);
  drawSnake(ctx);

  let continueRedrawing = true;

  if (checkFailingConditions()) {
    if (lives > 0) {
      lives--;
      snake = initialSnake.slice(0, initialSnake.length);
    } else {
      ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
      drawFinalText(ctx, 'Game Over :(');
      continueRedrawing = false;
    }
  }

  handleParticleCollide();

  if (checkLevelWinningConditions()) {
    if (gameLevel === MAX_LEVEL) {
      ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
      drawFinalText(ctx, 'You win :)');
      continueRedrawing = false;
    } else {
      gameLevel++;
      snake = snake.slice(0, 3);
    }
  }

  moveSnake(snakeDirection);

  return continueRedrawing;
}

function playGame(ctx: CanvasRenderingContext2D) {
  positionParticle();
  const particleBlinkingLoop = setInterval(particleBlink, BLINKING_LATENCY);

  let lastMainDrawTimestamp = performance.now();
  const mainLoop = (currentTimestamp) => {
    let continueRedrawing = true;
    if (currentTimestamp - lastMainDrawTimestamp >= computeDrawingLatency(gameLevel, DRAWING_LATENCY)) {
      continueRedrawing = drawGame(ctx);
      lastMainDrawTimestamp = performance.now();
    }
    if (continueRedrawing) {
      requestAnimationFrame(mainLoop);
    } else {
      clearInterval(particleBlinkingLoop);
    }
  };

  requestAnimationFrame(mainLoop);
}

/** Return true if current game's state means that the player failed the roud. */
function checkFailingConditions(): boolean {
  const snakeCoordsChecked: Snake = [];
  // check if snake collides with itself
  for (let i = 0, len = snake.length; i < len; i++) {
    if (contains<Pixel>(snakeCoordsChecked, (coord) => snake[i].x === coord.x && snake[i].y === coord.y)) {
      return true;
    }
    snakeCoordsChecked.push(snake[i]);
  }

  return false;
}

/** Change current global direction depending on pressed key. Prevent turning to opposite direction. */
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
  }, computeDrawingLatency(gameLevel, DRAWING_LATENCY));
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

/** Depending on current snake's direction add one Pixel to the head and remove one Pixel from tail. */
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

/** Increase value on Pixel's size. Keep value within the board. */
function addPixel(value: PixelCoord): PixelCoord {
  if (value === BOARD_SIZE - PIXEL_SIZE) {
    return 0;
  }

  return (value + PIXEL_SIZE) as PixelCoord;
}

/** Decrease value on Pixel's size. Keep value within the board. */
function subPixel(value: PixelCoord): PixelCoord {
  if (value === 0) {
    return (BOARD_SIZE - PIXEL_SIZE) as PixelCoord;
  }

  return (value - PIXEL_SIZE) as PixelCoord;
}

/** Draw the Pixel on canvas. */
function drawPixel(ctx: CanvasRenderingContext2D, x: PixelCoord, y: PixelCoord, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x + PIXEL_PADDING / 2,
               y + PIXEL_PADDING / 2,
               PIXEL_SIZE - PIXEL_PADDING,
               PIXEL_SIZE - PIXEL_PADDING);
}

/** Draw global snake on canvas. */
function drawSnake(ctx: CanvasRenderingContext2D) {
  snake.forEach((px) => {
    drawPixel(ctx, px.x, px.y, SNAKE_COLOR);
  });
}

/** Draw global particle on canvas. */
function drawParticle(ctx: CanvasRenderingContext2D) {
  drawPixel(ctx, particle.x, particle.y, `rgba(100, 100, 110, ${particleOpacity})`);
}

/** Change particle's opacity value. */
function particleBlink() {
  particleOpacity = ((particleOpacity + 0.25) % 1) as ParticleOpacity;
}

/** Checks snake & particle collision. If needed change global snake and particle accordingly. */
function handleParticleCollide() {
  if (snake[0].x === particle.x && snake[0].y === particle.y) {
    increaseSnakeLength();
    positionParticle();
  }
}

/** Adds one Pixel to the snake's tail. */
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

/** Set random position on the board for global particle. */
function positionParticle() {
  let pixel = getRandomPixelPosition();

  while (!particleIsFarEnoughFromSnake(pixel)) {
    pixel = getRandomPixelPosition();
  }
  particle.x = pixel.x;
  particle.y = pixel.y;
}

/** Checks given pixel for proximity to the snake's body and head. */
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

/** Get random Pixel inside the board. */
function getRandomPixelPosition(): Pixel {
  return {
    x: (Math.floor((Math.random() * BOARD_SIZE / PIXEL_SIZE)) * PIXEL_SIZE) as PixelCoord,
    y: (Math.floor((Math.random() * BOARD_SIZE / PIXEL_SIZE)) * PIXEL_SIZE) as PixelCoord,
  };
}

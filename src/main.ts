import GameStorage, {
  GameResult,
} from './GameStorage';
import contains from './utils/contains';
import domLib from './utils/domLib';
import formatDateTime from './utils/formatDateTime';
import formatNumber from './utils/formatNumber';

document.addEventListener('DOMContentLoaded', main);
document.addEventListener('keydown', handleKeyPress);

const SNAKE_COLOR = 'rgb(100, 100, 110)';

const PIXEL_SIZE = 20;
const PIXEL_PADDING = 1;
const BOARD_SIZE = 600;

/** Base redrawing latency for the game (in milliseconds). */
const DRAWING_LATENCY = 150;

/** Game timer drowing frequency (in milliseconds). */
const DRAW_TIME_DELAY = 5;

/** How close to snake's head may a particle respawn (in Pixel units). */
const APPROACH_LIMIT = 10;

/** Particle's opacity changing latency (in milliseconds). */
const BLINKING_LATENCY = 100;

/** Coordinates for the text that displays current level. */
const LEVEL_TEXT_POSITION = { x: PIXEL_SIZE, y: PIXEL_SIZE * 2 };

/** Coordinates for the text that displays player's lives left. */
const LIVES_TEXT_POSITION = { x: BOARD_SIZE - PIXEL_SIZE, y: PIXEL_SIZE * 2 };

/** Coordinates for the text that displays time elapsed from game start. */
const TIME_TEXT_POSITION = { x: BOARD_SIZE - PIXEL_SIZE, y: BOARD_SIZE - PIXEL_SIZE };

const START_GAME_LEVEL: GameLevel = 0;

const INITIAL_LIVES = 3;

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
  { x: 300, y: 300 },
  { x: 300, y: 320 },
  { x: 300, y: 340 },
];

type GameLevel = 0 | 1 | 2 | 3 | 4;

/** Maximum value for game level. */
const MAX_LEVEL: GameLevel = 4;

/** The particle on which a player is aiming. */
const particle: Pixel = { x: 0, y: 0 };

type ParticleOpacity = 0.25 | 0.5 | 0.75 | 1;

/** Particle's current opacity value (used for blinking). */
let particleOpacity: ParticleOpacity = 0.25;

/** Current snake's state. */
let snake: Snake = initialSnake.slice(0, initialSnake.length);

/** Current snake's direction. */
let snakeDirection: Direction = 'UP';

// used for preventing change direction faster than drawing happens
let snakeDirectionBlocked: boolean = false;

let gameLevel: GameLevel = START_GAME_LEVEL;

/** Player's lives. */
let lives = INITIAL_LIVES;

/** Game duration. */
let timeElapsed = 0;

/** Set changing globals to its initial state. */
function resetInitialGlobals() {
  gameLevel = START_GAME_LEVEL;
  lives = INITIAL_LIVES;
  snake = initialSnake.slice(0, initialSnake.length);
  snakeDirection = 'UP';
  positionParticle();
}

/** Draw game's state values on the board (during the whole game). */
function drawText(ctx: CanvasRenderingContext2D) {
  ctx.font = '18px "Press Start 2P", cursive';
  ctx.fillStyle = 'rgba(50, 50, 50, .5)';
  ctx.textAlign = 'start';
  ctx.fillText(`Level: ${gameLevel}`, LEVEL_TEXT_POSITION.x, LEVEL_TEXT_POSITION.y);
  ctx.textAlign = 'end';
  ctx.fillText(`Lives: ${lives}`, LIVES_TEXT_POSITION.x, LIVES_TEXT_POSITION.y);
}

function drawTimeText(ctx: CanvasRenderingContext2D) {
  ctx.textAlign = 'end';
  const {
    minutes,
    seconds,
    milliseconds,
  } = getTimeElements(timeElapsed);
  ctx.fillText(`Time: ${formatNumber(minutes, 2)}:${formatNumber(seconds, 2)}:${formatNumber(milliseconds, 3)}`,
                TIME_TEXT_POSITION.x,
                TIME_TEXT_POSITION.y);
}

function getTimeElements(timestamp: number): GameResult {
  return {
    minutes: Math.floor(timestamp / 1000 / 60),
    seconds: Math.floor(timestamp / 1000) % 60,
    milliseconds: Math.floor(timestamp) % 1000,
  };
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
  0: 12,
  1: 10,
  2: 10,
  3: 12,
  4: 14,
};

/** Check if the game's state mean that the player win at current game level. */
function checkLevelWinningConditions(): boolean {
  if (snake.length > MAX_SNAKE_LENGTH_FOR_LEVEL[gameLevel]) {
    return true;
  }

  return false;
}

const gameStorage = new GameStorage();

type DisplayClass = 'gameBoard' | 'stats' | 'options';

function switchOnDisplay(displayClass: DisplayClass) {
  const allDisplays = document.querySelectorAll('.displayContent');
  allDisplays.forEach((disp) => {
    disp.setAttribute('hidden', '');
  });
  const activeDisplays = document.querySelectorAll(`.displayContent.${displayClass}`);
  activeDisplays.forEach((actDisp) => {
    actDisp.removeAttribute('hidden');
  });
}

function main() {
  // 30 x 30 Pixel board (1 pixel is 20 x 20 px)
  const boardSnake: HTMLCanvasElement = document.getElementById('boardSnake') as HTMLCanvasElement;
  const snakeCtx = boardSnake.getContext('2d');

  const boardText: HTMLCanvasElement = document.getElementById('boardText') as HTMLCanvasElement;
  const textCtx = boardText.getContext('2d');

  const statisticsDisplay = document.getElementById('statsDisplay');
  if (statisticsDisplay) {
    const statsData = gameStorage.getResults(10);
    const stringifyedData = statsData.map((record) => {
      return `${formatDateTime(record.date)} - ${formatNumber(record.result.minutes, 2)}:${formatNumber(record.result.seconds, 2)}:${formatNumber(record.result.milliseconds, 3)}`;
    });
    domLib.insertElements(statisticsDisplay, stringifyedData, 'li');
  }

  const startNewGameButton = document.getElementById('startNewGameBtn');
  if (startNewGameButton) {
    startNewGameButton.addEventListener('click', () => {
      location.reload();
    });
  }
  const statisticsButton = document.getElementById('statsBtn');
  if (statisticsButton) {
    statisticsButton.addEventListener('click', () => {
      switchOnDisplay('stats');
    });
  }
  const optionsButton = document.getElementById('optionsBtn');
  if (optionsButton) {
    optionsButton.addEventListener('click', () => {
      switchOnDisplay('options');
    });
  }
  const startButton = document.getElementById('playBtn');
  if (startButton) {
    startButton.addEventListener('click', () => {
      startButton.setAttribute('hidden', '');
      playGame(snakeCtx, textCtx);
    });
  }
}

type GameStatus = 'running' | 'fail' | 'win' | 'levelUp';

/** Draw all the game's parts, do game condition checks. Return `true` if game is continuing after current draw. */
function drawGame(snakeCtx: CanvasRenderingContext2D): GameStatus {
  snakeCtx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
  drawParticle(snakeCtx);
  drawSnake(snakeCtx);

  let gameStatus: GameStatus = 'running';

  if (checkFailingConditions()) {
    if (lives > 1) {
      lives--;
      snake = initialSnake.slice(0, initialSnake.length);
    } else {
      snakeCtx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
      gameStatus = 'fail';
    }
  }

  handleParticleCollide();

  if (checkLevelWinningConditions()) {
    if (gameLevel === MAX_LEVEL) {
      snakeCtx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
      gameStatus = 'win';

      // save result in local storage
      gameStorage.saveResult(getTimeElements(timeElapsed));
    } else {
      gameLevel++;
      snake = snake.slice(0, 3);
      gameStatus = 'levelUp';
    }
  }

  moveSnake(snakeDirection);

  return gameStatus;
}

function playGame(snakeCtx: CanvasRenderingContext2D,
                  textCtx: CanvasRenderingContext2D,
                  onEnd?: () => void) {
  const startGameTime = performance.now();
  snakeCtx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
  textCtx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

  positionParticle();
  const particleBlinkingLoop = setInterval(particleBlink, BLINKING_LATENCY);

  let lastSnakeDrawTimestamp = performance.now();
  let gameStatus: GameStatus = 'running';

  const snakeDrawingLoop = (currentTimestamp) => {
    if (currentTimestamp - lastSnakeDrawTimestamp
      >= computeDrawingLatency(gameLevel, DRAWING_LATENCY)) {
      gameStatus = drawGame(snakeCtx);
      lastSnakeDrawTimestamp = currentTimestamp;
    }

    if (gameStatus === 'running' || gameStatus === 'levelUp') {
      requestAnimationFrame(snakeDrawingLoop);
    } else {
      clearInterval(particleBlinkingLoop);
    }
  };

  let lastTimeDrawTimestamp = performance.now();
  let lastTimeShowLevelUpMessage = performance.now();
  let showLevelUpMessage = false;
  const textDrawingLoop = (currentTimestamp) => {
    timeElapsed = currentTimestamp - startGameTime;
    if (currentTimestamp - lastTimeDrawTimestamp >= DRAW_TIME_DELAY) {
      textCtx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
      drawText(textCtx);
      drawTimeText(textCtx);
      lastTimeDrawTimestamp = currentTimestamp;
    }
    if (currentTimestamp - lastTimeShowLevelUpMessage > 500) {
      showLevelUpMessage = false;
    }
    if (showLevelUpMessage) {
      drawFinalText(textCtx, 'Next Level');
    }
    switch (gameStatus) {
      case 'levelUp':
        showLevelUpMessage = true;
        lastTimeShowLevelUpMessage = currentTimestamp;
        requestAnimationFrame(textDrawingLoop);
        break;
      case 'running':
        requestAnimationFrame(textDrawingLoop);
        break;
      case 'fail':
        textCtx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
        drawFinalText(textCtx, 'Game Over :(');
        break;
      case 'win':
        textCtx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
        drawFinalText(textCtx, 'You Win :)');
        break;
      default:
        break;
    }
  };

  requestAnimationFrame(snakeDrawingLoop);
  requestAnimationFrame(textDrawingLoop);
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

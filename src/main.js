// @ts-check
import { GameEngine } from './engine.js';
import { AppController } from './AppController.js';
import './style.css';
import { config } from './config.js';

/**
 * @fileoverview Main entry point and bootstrap for the Neon Blitz game.
 */

// --- BOOTSTRAP & INPUT DELEGATION ---
/** @type {import('./types.js').UIComponents} */
const ui = {
  gridContainer: /** @type {HTMLElement} */ (document.getElementById('gridContainer')),
  canvas: /** @type {HTMLCanvasElement} */ (document.getElementById('lineCanvas')),
  ctx: /** @type {CanvasRenderingContext2D} */ (/** @type {HTMLCanvasElement} */ (document.getElementById('lineCanvas')).getContext('2d')),
  timerBar: /** @type {HTMLElement} */ (document.getElementById('timerBar')),
  levelDisplay: /** @type {HTMLElement} */ (document.getElementById('levelDisplay')),
  timeSpentDisplay: /** @type {HTMLElement} */ (document.getElementById('timeSpentDisplay')),
  targetColorName: /** @type {HTMLElement} */ (document.getElementById('targetColorName')),
  gameArea: /** @type {HTMLElement} */ (document.querySelector('.game-area')),
  hud: /** @type {HTMLElement} */ (document.querySelector('.hud')),
};

const game = new GameEngine(ui, config);

const app = new AppController(game, ui);
app.init();

// --- DEBUG: CHEAT CODES ---
window.addEventListener('keydown', (e) => {
  if (e.shiftKey && e.key.toLowerCase() === 't') {
    game.audio?.nextTrack?.();
  } else if (e.shiftKey && e.key.toLowerCase() === 'n') {
    game.level++;
    game.combo = 1;
    game.levelTimeSpent = 0;
    game.timeRemaining = 60000;
    game.maxTime = 60000;
    game.hud.updateLevelDisplay(game.level);
    game.levelController.initLevel();
  }
});
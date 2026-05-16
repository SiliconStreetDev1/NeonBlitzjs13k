// @ts-check
import { GridManager } from './UI/GridManager.js';
import { HUDManager } from './UI/HUDManager.js';
import { PopupManager } from './UI/PopupManager.js';
import { InputHandler } from './InputHandler.js';
import { LevelController } from './LevelController.js';
import { GameRenderer } from './GameRenderer.js';
import { GameLoop } from './GameLoop.js';
import { AudioManager } from './Audio/AudioManager.js';

/**
 * @typedef {import('./types.js').UIComponents} UIComponents
 * @typedef {import('./types.js').Point} Point
 * @typedef {import('./types.js').TargetQueue} TargetQueue
 */

/**
 * --- MAIN GAME CONTROLLER ---
 * Enterprise orchestrator managing game state, timer loops, and external delegates.
 */
export class GameEngine {
  /**
   * Initializes the GameEngine with required UI components.
   * @param {UIComponents} ui - Dictionary of DOM elements.
   * @param {any} config - The master data-driven JSON configuration.
   */
  constructor(ui, config) {
    /** @type {UIComponents} */
    this.ui = ui;
    /** @type {any} */
    this.config = config;
    /** @type {AudioManager} */
    this.audio = new AudioManager();
    /** @type {InputHandler} */
    this.inputHandler = new InputHandler(this);
    
    /** @type {GridManager} */
    this.grid = new GridManager(this.ui, this.config);
    /** @type {HUDManager} */
    this.hud = new HUDManager(this.ui, this.config);
    /** @type {PopupManager} */
    this.popups = new PopupManager(this.ui);

    /** @type {LevelController} */
    this.levelController = new LevelController(this);
    /** @type {GameRenderer} */
    this.renderer = new GameRenderer(this);
    /** @type {GameLoop} */
    this.gameLoopController = new GameLoop(this);

    // Core State
    /** @type {number} */
    this.level = 1;
    /** @type {number} */
    this.combo = 1;
    /** @type {number} */
    this.maxTime = 60000;
    /** @type {number} */
    this.timeRemaining = this.maxTime;

    /** @type {number} */
    this.levelTimeSpent = 0;

    /** @type {TargetQueue} */ 
    this.targetQueue = [];
    /** @type {number} */
    this.currentTargetIndex = 0;
    
    // Input & Interaction State
    /** @type {boolean} */
    this.isPlaying = false;
    /** @type {boolean} */
    this.isDragging = false;
    /** @type {number[]} */ this.selectedBlocks = [];
    /** @type {string | null} */ this.currentDragColorClass = null;
    /** @type {string | null} */ this.currentDragColorHex = null;
    /** @type {Point} */ this.pointerPos = { x: 0, y: 0 };
    /** @type {boolean} */
    this.isPointerInvalid = false;
    /** @type {boolean} */
    this.isPointerComplete = false;
    /** @type {boolean} */
    this.isPointerDeadEnd = false;
    
    /** @type {number} */
    this.lastTime = 0;
    /** @type {number} */
    this.chameleonCycle = 0;
    /** @type {number | null} */ this.animId = null;
    this.targetDifficulty = 0; 
  }

  /** Resizes the internal canvas to strictly match the DOM container. */
  resizeCanvas() { 
    const rect = this.ui.gridContainer.getBoundingClientRect();
    this.ui.canvas.width = rect.width;
    this.ui.canvas.height = rect.height;
    this.grid.cacheBlockCenters();
  }
  
  /** 
   * Starts a completely new game run from Level 1. 
   * @returns {void}
   */
  startNewGame() { this.levelController.startNewGame(); }

  /**
   * Resets all ephemeral game and input states.
   */
  resetState() {
    this.isPlaying = false;
    this.isDragging = false;
    this.grid.clearBlockStates(this.selectedBlocks);
    this.selectedBlocks = [];
    this.renderer?.clear();
  }

  /**
   * Orchestrates the game over sequence, delegating to UI and Audio managers.
   */
  gameOver() {
    this.isPlaying = false;
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    this.audio?.stopMusic?.();
    this.audio?.playGameOver?.();
    
    const o = document.getElementById('startOverlay');
    if (o) {
      o.innerHTML = '<div style="color:#f36;margin-bottom:20px;">FAILED</div><div>[ TAP TO RESTART ]</div>';
      o.style.display = 'flex';
      setTimeout(() => o.addEventListener('click', () => {
        o.style.display = 'none';
        this.startNewGame();
      }, { once: true }), 300);
    }
  }

  
  /** Initializes the board and generates targets for the current level. */
  initLevel() { this.levelController.initLevel(); }
  
  /** Evaluates if the queue can advance and triggers it. */
  advanceQueue() { this.levelController.advanceQueue(); }
  
  /** Handles the visual and logical state transition when a level is cleared. */
  levelComplete() { this.levelController.levelComplete(); }

  /**
   * Delegates the pointer down event to the InputHandler.
   * @param {number} index - The block index touched.
   * @param {number} x - Pointer X coordinate.
   * @param {number} y - Pointer Y coordinate.
   */
  handlePointerDown(index, x, y) { this.inputHandler.handlePointerDown(index, x, y); }
  
  /**
   * Delegates the pointer move event to the InputHandler.
   * @param {number} index - The block index dragged over.
   * @param {number} x - Pointer X coordinate.
   * @param {number} y - Pointer Y coordinate.
   */
  handlePointerMove(index, x, y) { this.inputHandler.handlePointerMove(index, x, y); }
  
  /**
   * Delegates the pointer up event to the InputHandler.
   */
  handlePointerUp() { this.inputHandler.handlePointerUp(); }
}
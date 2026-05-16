// @ts-check
import { generateLevelData } from './board.js';
import { seededRandom } from './utils.js';

/**
 * Handles level initialization, transitions, and queue advancement.
 */
export class LevelController {
  /**
   * @param {import('./engine.js').GameEngine} engine 
   */
  constructor(engine) {
    /** @type {import('./engine.js').GameEngine} */
    this.engine = engine;
  }

  /**
   * Starts a completely fresh run from Level 1.
   * @returns {void}
   */
  startNewGame() {
    this.engine.level = 1;
    this.engine.combo = 1;
    this.engine.levelTimeSpent = 0;
    this.engine.timeRemaining = 60000;
    this.engine.maxTime = 60000;
    
    this.engine.hud.updateLevelDisplay(this.engine.level);
    this.initLevel();
  }

  /**
   * Evaluates and applies time bonuses when entering a new stage.
   * @returns {void}
   */
  _applyTimeRewards() {
    if (this.engine.level === 1) {
      if (this.engine.timeRemaining <= 0) {
        this.engine.timeRemaining = 60000;
        this.engine.maxTime = 60000;
      }
    } else {
      const timeReward = Math.max(15000, 30000 * Math.pow(0.92, this.engine.level - 1));
      this.engine.timeRemaining += timeReward;
      this.engine.maxTime = Math.max(this.engine.maxTime, this.engine.timeRemaining);
    }
  }

  /**
   * Initializes and resets state for the current level, generating new targets and grids.
   * @returns {void}
   */
  initLevel() {

    this.engine.audio?.startLevelMusic?.(this.engine.level);

    const rng = seededRandom(this.engine.level);
    
    // Evaluate progressive hazard states
    this.engine.hazardChameleon = this.engine.level === 3 || (this.engine.level >= 7 && rng() < 0.5);
    this.engine.hazardMemoryLeak = this.engine.level === 4 || (this.engine.level >= 7 && !this.engine.hazardChameleon && rng() < 0.5);
    this.engine.hazardOverload = this.engine.level === 5 || (this.engine.level >= 7 && rng() < 0.5);

    this.engine.hazards?.init?.(rng);

    // Enforce exclusivity: Fog overrides Memory Leak to prevent an unplayable pitch-black board
    const fog = this.engine.hazards?.getPlugin('fog');
    if (fog && fog.isActive) this.engine.hazardMemoryLeak = false;

    this.engine.targetQueue = generateLevelData(this.engine.level, rng, this.engine.config);
    this.engine.currentTargetIndex = 0;
    this.engine.targetDifficulty = this.engine.targetQueue.length > 0 ? this.engine.targetQueue[0].difficulty : 0;

    this.engine.levelTimeSpent = 0;

    this._applyTimeRewards();

    this.engine.isPointerInvalid = false;
    this.engine.isPointerComplete = false;
    this.engine.isPointerDeadEnd = false;
    this.engine.resetState();
    
    this.engine.grid.initGrid(this.engine.targetQueue, this.engine.level, rng, this.engine.config);
    
    
    this.advanceQueue();
    this.engine.resizeCanvas();
    
    this.engine.lastTime = performance.now();
    this.engine.isPlaying = true;
    
    this.engine.gameLoopController.start();
  }

  /**
   * Checks remaining blocks and advances the target queue if the current target is fully cleared.
   * @returns {void}
   */
  advanceQueue() {
    this.engine.hud.updateTargetUI(this.engine.targetQueue, this.engine.currentTargetIndex, this.engine.targetDifficulty, this.engine.combo);
    const currentTarget = this.engine.targetQueue[this.engine.currentTargetIndex];
    const remaining = currentTarget ? this.engine.grid.highlightActiveBlocks(currentTarget.colorInfo.class, this.engine.targetDifficulty) : 0;
    const allBlocks = this.engine.ui.gridContainer.children;
    if (remaining === 0 && allBlocks.length > 0 && this.engine.currentTargetIndex < this.engine.targetQueue.length) {
      this.engine.currentTargetIndex++;
      if (this.engine.currentTargetIndex >= this.engine.targetQueue.length) {
        this.levelComplete();
      } else {
        this.engine.targetDifficulty = this.engine.targetQueue[this.engine.currentTargetIndex].difficulty;
        this.advanceQueue();
      }
    }
  }

  /**
   * Triggers end-of-level animations, calculates bonuses, and transitions to the next stage.
   * @returns {void}
   */
  levelComplete() {
    this.engine.isPlaying = false;

    if (navigator.vibrate) navigator.vibrate([50, 50, 100, 50, 200]);
    this.engine.audio?.playLevelComplete?.();
    
    this.engine.popups.showPopup(`LEVEL ${this.engine.level} CLEARED!`, this.engine.ui.canvas.width / 2, this.engine.ui.canvas.height / 2, '#66fcf1');

    // Boss Fight Victory
    this.engine.level++;

    setTimeout(() => {
      this.engine.hud.updateLevelDisplay(this.engine.level);
      this.initLevel();
    }, 1500);
  }
}
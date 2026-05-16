// @ts-check

/**
 * Manages the main game loop, delta time calculations, and state updates.
 */
export class GameLoop {
  /**
   * @param {import('./engine.js').GameEngine} engine 
   */
  constructor(engine) {
    /** @type {import('./engine.js').GameEngine} */
    this.engine = engine;
    this.loop = this.loop.bind(this);
  }

  /**
   * Starts or resumes the game loop.
   */
  start() {
    if (this.engine.animId) cancelAnimationFrame(this.engine.animId);
    this.engine.lastTime = performance.now();
    this.engine.animId = requestAnimationFrame(this.loop);
  }

  /**
   * The core loop logic, ticking forward state and triggering renders.
   * @param {number} timestamp 
   */
  loop(timestamp) {
    // Cap dt to 100ms to prevent massive state jumps when the tab is backgrounded
    const dt = Math.min(timestamp - this.engine.lastTime, 100);
    this.engine.lastTime = timestamp;
    
    if (this.engine.isPlaying) {
      this.engine.levelTimeSpent += dt;
      this.engine.timeRemaining -= dt;
      if (this.engine.timeRemaining <= 0) {
        this.engine.gameOver();
      }
    }
    
    const percent = this.engine.hud.updateTimerDisplay(this.engine.timeRemaining, this.engine.maxTime, this.engine.levelTimeSpent);
    
    this.engine.hud.updateDangerState(percent, this.engine.level);
    
    if (this.engine.level >= 2) {
      const cycle = Math.floor(timestamp / 300);
      if (!this.engine.isDragging && this.engine.chameleonCycle !== cycle) {
        this.engine.chameleonCycle = cycle;
        this.engine.grid.updateChameleonBlocks(true);
      } else if (this.engine.isDragging && this.engine.chameleonCycle !== -1) {
        this.engine.chameleonCycle = -1;
        this.engine.grid.updateChameleonBlocks(false);
      }
    }

    // Level 3 Hazard: Memory Leak (Grid goes dark while tracing)
    this.engine.ui.gridContainer.classList.toggle('blackout', this.engine.level >= 3 && this.engine.isDragging);

    // Level 4 Hazard: Short Circuit (Trace overloads if held for > 2.5s)
    if (this.engine.level >= 4 && this.engine.isDragging) {
      this.engine.dragTime = (this.engine.dragTime || 0) + dt;
      if (this.engine.dragTime > 2500) {
        this.engine.inputHandler.resetSelection();
        this.engine.popups.showPopup('OVERLOAD!', this.engine.pointerPos.x, this.engine.pointerPos.y - 30, '#fc0');
      }
    } else this.engine.dragTime = 0;

    this.engine.renderer.draw(timestamp, dt); // Passing dt to normalize canvas physics
    
    if (!this.engine.isPlaying && this.engine.timeRemaining <= 0) return;
    
    this.engine.animId = requestAnimationFrame(this.loop);
  }
}
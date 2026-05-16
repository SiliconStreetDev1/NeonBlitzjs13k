// @ts-check

/**
 * @fileoverview Chameleon Block Hazard.
 * Randomly flashes decoy colors to visually confuse the player until interacted with.
 */
export class HazardChameleon {
  /**
   * @param {import('../engine.js').GameEngine} engine
   */
  constructor(engine) {
    /** @type {import('../engine.js').GameEngine} */
    this.engine = engine;
    /** @type {number} */
    this.lastCycle = 0;
  }

  /**
   * Resets the chameleon flash cycle.
   */
  reset() {
    this.lastCycle = 0;
  }

  /**
   * Processes the Chameleon block color cycling logic for advanced levels.
   * @param {number} timestamp - Current requestAnimationFrame timestamp.
   */
  update(timestamp) {
    if (this.engine.level < this.engine.progression.hazards.chameleon.unlockLevel) return;

    let currentCycle = this.lastCycle;
    if (!this.engine.isDragging) {
      const cycle = Math.floor(timestamp / this.engine.config.tuning.GAME_SETTINGS.CHAMELEON_CYCLE_MS);
      if (this.lastCycle !== cycle) {
        currentCycle = cycle;
        this.engine.grid.updateChameleonBlocks(true);
      }
    } else if (this.engine.isDragging && this.lastCycle !== -1) {
      currentCycle = -1; // Lock to true color
      this.engine.grid.updateChameleonBlocks(false);
    }
    this.lastCycle = currentCycle;
  }
}
// @ts-check

/**
 * @fileoverview Fog of War (Spotlight) Hazard.
 * Plunges the board into darkness, providing only a spotlight around the pointer.
 */
export class HazardFog {
  /**
   * @param {import('../engine.js').GameEngine} engine
   */
  constructor(engine) {
    /** @type {import('../engine.js').GameEngine} */
    this.engine = engine;
    /** @type {boolean} */
    this.isActive = false;

    // Expose position and radius so external modular systems (like particle layers) can sync with the spotlight
    /** @type {number} */
    this.currentX = 0;
    /** @type {number} */
    this.currentY = 0;
    /** @type {number} */
    this.currentRadius = 0;
  }

  /**
   * Initializes the Fog hazard for the current level.
   * @param {() => number} rng - Seeded random number generator.
   * @param {import('./HazardManager.js').HazardManager} [manager]
   */
  init(rng, manager) {
    this.isActive = false;
    const unlockLvl = this.engine.progression.hazards.fog.unlockLevel;
    if (this.engine.level >= unlockLvl) {
      this.isActive = rng() < Math.min(0.6, 0.20 + (this.engine.level - unlockLvl) * 0.05);
    }
  }

  /**
   * Renders the spotlight effect onto the canvas.
   * @param {number} timestamp - Current requestAnimationFrame timestamp.
   */
  draw(timestamp) {
    if (!this.isActive) return;

    const ui = this.engine.ui;
    ui.ctx.fillStyle = '#0b0c10'; // Pitch black grid background
    // Overdraw by 10px to prevent high-DPI fractional scaling from bleeding light at the borders
    ui.ctx.fillRect(-10, -10, ui.canvas.width + 20, ui.canvas.height + 20);
    
    ui.ctx.globalCompositeOperation = 'destination-out'; // This "erases" the black instead of drawing over it
    
    let spX = ui.canvas.width / 2;
    let spY = ui.canvas.height / 2;
    
    if (this.engine.isDragging) {
      spX = this.engine.pointerPos.x;
      spY = this.engine.pointerPos.y;
    } else if (this.engine.selectedBlocks.length > 0) {
      const center = this.engine.grid.getBlockCenter(this.engine.selectedBlocks[this.engine.selectedBlocks.length - 1]);
      if (center) {
        spX = center.x;
        spY = center.y;
      }
    } else {
      // Roam the screen smoothly when the player isn't interacting
      spX = (ui.canvas.width / 2) + Math.sin(timestamp / 1000) * (ui.canvas.width / 2.5);
      spY = (ui.canvas.height / 2) + Math.cos(timestamp / 1400) * (ui.canvas.height / 2.5);
    }
    
    // Shrink the spotlight from generous down to tight over 30 levels
    const shrinkFactor = Math.min(1, Math.max(0, (this.engine.level - this.engine.progression.hazards.fog.unlockLevel) / 30));
    const innerRadius = 100 - (50 * shrinkFactor);
    const outerRadius = 360 - (180 * shrinkFactor);
    
    // Cache properties for external systems to read
    this.currentX = spX;
    this.currentY = spY;
    this.currentRadius = outerRadius;

    const gradient = ui.ctx.createRadialGradient(spX, spY, innerRadius, spX, spY, outerRadius);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ui.ctx.fillStyle = gradient;
    ui.ctx.fillRect(-10, -10, ui.canvas.width + 20, ui.canvas.height + 20);
    
    ui.ctx.globalCompositeOperation = 'source-over'; // Reset back to normal rendering for the neon lines
  }
}
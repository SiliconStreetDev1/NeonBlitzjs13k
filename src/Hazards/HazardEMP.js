// @ts-check

/**
 * @fileoverview EMP Shockwave Hazard.
 * Periodically fires a highly-optimized cross-shaped beam that short-circuits the player's line.
 */
export class HazardEMP {
  /**
   * @param {import('../engine.js').GameEngine} engine
   */
  constructor(engine) {
    this.engine = engine;
    this.emps = [];
    this.empTimer = 0;
  }

  init(rng, manager) {
    this.emps = [];
    this.empTimer = 0;
    
    const fog = manager.getPlugin('fog');
    const isFog = fog && fog.isActive;

    if (this.engine.level === 6 || (this.engine.level >= 7 && !isFog && rng() < 0.5)) {
      this.emps.push({
        x: Math.floor(rng() * 6), // GRID_COLS
        y: Math.floor(rng() * 8)  // GRID_ROWS
      });
    }
  }

  update(dt) {
    if (!this.emps.length) return;
    
    this.empTimer += dt;
    const CYCLE = 4000, FIRE = 500;
    
    if (this.empTimer > CYCLE + FIRE) this.empTimer = 0;
    
    const isFiring = this.empTimer > CYCLE;
    const progress = isFiring ? (this.empTimer - CYCLE) / FIRE : 0;
    const waveDist = progress * 10; // Outward distance in grid cells
    
    if (isFiring && this.engine.selectedBlocks.length > 0) {
      for (let idx of this.engine.selectedBlocks) {
        const bx = idx % 6, by = Math.floor(idx / 6);
        for (let emp of this.emps) {
          // Simple grid-coordinate hit detection (Cross shape)
          if ((bx === emp.x || by === emp.y) && 
              (Math.abs(bx - emp.x) <= waveDist && Math.abs(by - emp.y) <= waveDist)) {
            this.engine.inputHandler.resetSelection();
            return;
          }
        }
      }
    }
  }

  draw() {
    if (!this.emps.length) return;
    const ui = this.engine.ui;
    const CYCLE = 4000, FIRE = 500;
    const isFiring = this.empTimer > CYCLE;
    const progress = isFiring ? (this.empTimer - CYCLE) / FIRE : 0;
    const charge = Math.min(1, this.empTimer / CYCLE);
    
    this.emps.forEach(emp => {
      const c = this.engine.grid.getBlockCenter(emp.y * 6 + emp.x);
      if (!c) return;
      if (isFiring) {
        const size = Math.max(ui.canvas.width, ui.canvas.height) * progress;
        ui.ctx.fillStyle = ui.ctx.shadowColor = '#0ff'; ui.ctx.shadowBlur = 15;
        ui.ctx.fillRect(c.x - 4, c.y - size, 8, size * 2); ui.ctx.fillRect(c.x - size, c.y - 4, size * 2, 8);
        ui.ctx.shadowBlur = 0;
      }
      ui.ctx.beginPath(); ui.ctx.arc(c.x, c.y, 8 + (isFiring ? 4 : Math.sin(this.empTimer * 0.01) * 2), 0, Math.PI * 2);
      ui.ctx.fillStyle = isFiring ? '#fff' : `rgba(0, 255, 255, ${0.2 + charge * 0.6})`; ui.ctx.fill();
    });
  }
}
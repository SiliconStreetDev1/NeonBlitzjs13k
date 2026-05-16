// @ts-check

/**
 * Handles rendering logic for the main game canvas.
 */
export class GameRenderer {
  /**
   * @param {import('./engine.js').GameEngine} engine 
   */
  constructor(engine) {
    /** @type {import('./engine.js').GameEngine} */
    this.engine = engine;
  }

  /**
   * Clears the main game canvas.
   */
  clear() {
    this.engine.ui.ctx.clearRect(0, 0, this.engine.ui.canvas.width, this.engine.ui.canvas.height);
  }

  /**
   * Renders the current frame.
   * @param {number} timestamp 
   * @param {number} dt
   */
  draw(timestamp, dt) {
    if (this.engine.selectedBlocks.length > 0 && this.engine.currentDragColorHex) {
      this.engine.ui.ctx.beginPath();
      
      if (this.engine.isPointerInvalid) {
        this.engine.ui.ctx.strokeStyle = '#800'; 
        this.engine.ui.ctx.shadowColor = '#800';
      } else if (this.engine.isPointerDeadEnd) {
        this.engine.ui.ctx.strokeStyle = '#f80'; 
        this.engine.ui.ctx.shadowColor = '#f80';
      } else if (this.engine.isPointerComplete) {
        this.engine.ui.ctx.strokeStyle = '#060'; 
        this.engine.ui.ctx.shadowColor = '#060';
      } else {
        this.engine.ui.ctx.strokeStyle = "rgba(0,0,0,0.85)"; 
        this.engine.ui.ctx.shadowColor = this.engine.currentDragColorHex; 
      }
      
      this.engine.ui.ctx.lineWidth = 14; 
      this.engine.ui.ctx.lineCap = 'round'; 
      this.engine.ui.ctx.lineJoin = 'round';
      this.engine.ui.ctx.shadowBlur = 10;
      
      const start = this.engine.grid.getBlockCenter(this.engine.selectedBlocks[0]);
      if (start) this.engine.ui.ctx.moveTo(start.x, start.y);
      for (let i = 1; i < this.engine.selectedBlocks.length; i++) {
        const nextCenter = this.engine.grid.getBlockCenter(this.engine.selectedBlocks[i]);
        if (nextCenter) this.engine.ui.ctx.lineTo(nextCenter.x, nextCenter.y);
      }
      if (this.engine.isDragging && !this.engine.isPointerComplete) {
        const lastCenter = this.engine.grid.getBlockCenter(this.engine.selectedBlocks[this.engine.selectedBlocks.length - 1]);
        if (lastCenter) {
          const dist = Math.hypot(this.engine.pointerPos.x - lastCenter.x, this.engine.pointerPos.y - lastCenter.y);
          if (dist > 24) {
            this.engine.ui.ctx.lineTo(this.engine.pointerPos.x, this.engine.pointerPos.y);
          }
        }
      }
      this.engine.ui.ctx.stroke();
    }
  }
}
// @ts-check

/**
 * @fileoverview Handles all Canvas-based explosions and visual flair independent of the DOM.
 */

/**
 * @typedef {Object} Particle
 * @property {number} x
 * @property {number} y
 * @property {number} vx
 * @property {number} vy
 * @property {number} size
 * @property {number} life
 * @property {string} color
 */

/**
 * Particle Engine for visual effects.
 */
export class ParticleSystem {
  /**
   * Initializes the particle system.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {HTMLCanvasElement} canvas - The canvas element.
   * @param {import('./Audio/AudioManager.js').AudioManager} [audioEngine] - Optional Audio Manager for SFX.
   */
  constructor(ctx, canvas, audioEngine = null) {
    /** @type {CanvasRenderingContext2D} */
    this.ctx = ctx;
    /** @type {HTMLCanvasElement} */
    this.canvas = canvas;
    /** @type {Particle[]} */
    this.particles = [];
    /** @type {import('./Audio/AudioManager.js').AudioManager | null} */
    this.audioEngine = audioEngine;
  }
  
  /**
   * Checks if there are currently any active particles.
   * @returns {boolean} True if particles exist.
   */
  hasActiveParticles() {
    return this.particles.length > 0;
  }

  /**
   * Spawns a standard spark explosion for block destruction.
   * @param {number} x - The X coordinate to spawn particles at.
   * @param {number} y - The Y coordinate to spawn particles at.
   * @param {string} color - The hex color for the particles.
   * @param {number} [count=5] - Number of particles to spawn.
   * @param {number} [speed=5] - Initial velocity scale of the particles.
   */
  spawn(x, y, color, count = 5, speed = 5) {
    // Play a block destruction "pop" or "snare" sound using the RLO drum synth (ID 128)
    // Drastically lower volume and randomize pitch/timing to prevent clipping when multiple blocks break
    if (this.audioEngine) {
      this.audioEngine.playSFX(128, 70 + Math.random() * 20, 0.1, 0.15, Math.random() * 0.05); 
    }

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed - (speed / 2),
        size: Math.random() * 8 + 4,
        life: 1.0, color: color
      });
    }
  }
  
  /**
   * Spawns a massive screen-clearing explosion for level completion.
   */
  confetti() {
    // Play a massive bass-heavy boom (Frequency 40Hz)
    if (this.audioEngine) {
      this.audioEngine.playSFX(128, 40, 0.1, 1.0); 
    }

    const colors = ['#ff3366', '#33cc66', '#ffcc00', '#cc33ff', '#33ccff'];
    for (let i = 0; i < 60; i++) {
      this.particles.push({
        x: this.canvas.width / 2 + (Math.random() - 0.5) * this.canvas.width * 0.8,
        y: this.canvas.height / 2 + (Math.random() - 0.5) * this.canvas.height * 0.8,
        vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20 - 5,
        size: Math.random() * 8 + 4, life: 1.0, 
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  /**
   * Instantly clears all active particles from the rendering pool.
   */
  clear() {
    this.particles.length = 0;
  }

  /**
   * Advances the physics simulation for particles (Gravity and Fade out) and draws them.
   * @param {number} dtMs - Delta time in milliseconds.
   */
  updateAndDraw(dtMs) {
    // Scale physics assuming 60fps (16.66ms) is the baseline, supporting 120Hz/144Hz displays uniformly
    const timeScale = dtMs / 16.666;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.x += p.vx * timeScale; p.y += p.vy * timeScale; p.vy += 0.5 * timeScale; p.life -= 0.015 * timeScale;
      if (p.life <= 0) { 
        // O(1) Array Removal (replaces the expensive .splice(i, 1) shift)
        const last = this.particles.pop();
        if (i < this.particles.length && last !== undefined) this.particles[i] = last;
      } else { 
        this.ctx.globalAlpha = p.life; this.ctx.fillStyle = p.color; this.ctx.shadowBlur = 15; this.ctx.shadowColor = p.color; this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); this.ctx.fill(); 
      }
    }
    this.ctx.globalAlpha = 1.0; this.ctx.shadowBlur = 0;
  }
}
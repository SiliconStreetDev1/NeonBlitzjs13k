// @ts-check
import { getBlockFromPoint } from './utils.js';

export class AppController {
  /**
   * @param {import('./engine.js').GameEngine} game 
   * @param {import('./types.js').UIComponents} ui 
   */
  constructor(game, ui) {
    /** @type {import('./engine.js').GameEngine} */
    this.game = game;
    /** @type {import('./types.js').UIComponents} */
    this.ui = ui;
  }

  init() {
    this.bindInputEvents();
    this.start();
  }

  /**
   * Binds global pointer events to the game engine's input handler.
   */
  bindInputEvents() {
    window.addEventListener('pointerdown', /** @param {PointerEvent} e */ (e) => {
      this.game.audio?.init?.(); 
      this.game.audio?.resumeContext?.();
      const target = /** @type {HTMLElement} */ (e.target);
      if (!this.game.isPlaying || !target || target.closest('button')) return;
      
      let el = getBlockFromPoint(e.clientX, e.clientY);
      let idx = el ? parseInt(el.dataset.index || "-1", 10) : -1;
      let rect = this.ui.canvas.getBoundingClientRect();
      this.game.handlePointerDown(idx, e.clientX - rect.left, e.clientY - rect.top);
    });

    window.addEventListener('pointermove', /** @param {PointerEvent} e */ (e) => {
      if (!this.game.isPlaying || !this.game.isDragging) return;
      let rect = this.ui.canvas.getBoundingClientRect();
      let el = getBlockFromPoint(e.clientX, e.clientY);
      let idx = el ? parseInt(el.dataset.index || "-1", 10) : -1;
      this.game.handlePointerMove(idx, e.clientX - rect.left, e.clientY - rect.top);
    });

    window.addEventListener('pointerup', /** @param {PointerEvent} e */ (e) => {
      this.game.handlePointerUp();
    });

    // Safety fallback for system interruptions (like iOS text message alerts)
    window.addEventListener('pointercancel', /** @param {PointerEvent} e */ (e) => {
      this.game.handlePointerUp();
    });
  }

  /**
   * Handles the initial boot sequence and interaction required to unlock the AudioContext.
   */
  start() {
    const overlay = document.getElementById('startOverlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        this.game.audio?.init?.();
        this.game.audio?.resumeContext?.();
        this.game.startNewGame();
        overlay.style.display = 'none';
      }, { once: true });
    } else {
      this.game.startNewGame();
    }
  }
}
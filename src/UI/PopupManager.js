// @ts-check

export class PopupManager {
  /**
   * @param {import('../types.js').UIComponents} ui 
   */
  constructor(ui) {
    /** @type {import('../types.js').UIComponents} */
    this.ui = ui;
  }

  /**
   * @param {string} text 
   * @param {number} x 
   * @param {number} y 
   * @param {string} colorHex 
   */
  showPopup(text, x, y, colorHex) {
    const p = document.createElement('div');
    p.textContent = text;
    p.style.cssText = `position:absolute;left:${x}px;top:${y-10}px;transform:translate(-50%,-50%);color:${colorHex};font-weight:bold;font-size:1.5rem;text-shadow:0 0 10px ${colorHex},0 0 2px #fff;pointer-events:none;z-index:100;transition:all 0.6s ease-out;opacity:1;`;
    if (this.ui.gameArea) this.ui.gameArea.appendChild(p);
    void p.offsetWidth; // Force reflow
    p.style.transform = 'translate(-50%, -60px)';
    p.style.opacity = '0';
    setTimeout(() => p.remove(), 600);
  }
}
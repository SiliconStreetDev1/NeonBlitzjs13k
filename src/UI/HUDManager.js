// @ts-check

export class HUDManager {
  /**
   * @param {import('../types.js').UIComponents} ui 
   * @param {any} config 
   */
  constructor(ui, config) {
    this.ui = ui;
    this.config = config;
  }

  /**
   * @param {number} timeRemaining 
   * @param {number} maxTime 
   * @param {number} levelTimeSpent 
   * @returns {number}
   */
  updateTimerDisplay(timeRemaining, maxTime, levelTimeSpent) {
    this.ui.timeSpentDisplay.textContent = (levelTimeSpent / 1000).toFixed(1) + 's';
    const percent = Math.max(0, (timeRemaining / maxTime) * 100);
    this.ui.timerBar.style.width = `${percent}%`;
    return percent;
  }

  /**
   * @param {number} level 
   */
  updateLevelDisplay(level) { this.ui.levelDisplay.textContent = level.toString(); }
  
  /**
   * @param {number} percent 
   * @param {number} level 
   */
  updateDangerState(percent, level) {
    this.ui.timerBar.classList.toggle('danger', percent < 30);
  }

  /**
   * @param {import('../types.js').TargetQueue} targetQueue 
   * @param {number} currentTargetIndex 
   * @param {number} [targetDifficulty=0] 
   * @param {number} [combo=1] 
   */
  updateTargetUI(targetQueue, currentTargetIndex, targetDifficulty = 0, combo = 1) {
    if (currentTargetIndex >= targetQueue.length) return;
    
    const currentInfo = targetQueue[currentTargetIndex].colorInfo;
    let orbHtml = `<div class="current-orb" data-color-class="${currentInfo.class}" style="background-color: ${currentInfo.hex}; box-shadow: 0 0 12px ${currentInfo.hex}; width: 24px; height: 24px;"></div>`;

    let comboHtml = combo > 1 ? `<div class="combo-meter">x${combo} 🔥</div>` : '';

    this.ui.targetColorName.innerHTML = `
      <div class="unified-queue" style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.08);padding:6px 16px;border-radius:24px;">
        ${orbHtml} ${comboHtml}
      </div>
    `;
  }
}
// @ts-check

/**
 * Handles all procedural sound effect generation using the RLO Audio Engine.
 */
export class SFXManager {
  /**
   * @param {import('rlo-engine').RLOGameEngine} rloEngine 
   * @param {import('../SettingsManager.js').SettingsManager} settings 
   */
  constructor(rloEngine, settings) {
    /** @type {import('rlo-engine').RLOGameEngine} */
    this.engine = rloEngine;
    /** @type {import('../SettingsManager.js').SettingsManager} */
    this.settings = settings;
  }

  /**
   * @param {number} id 
   * @param {number | string} freq 
   * @param {number} duration 
   * @param {number} velocity 
   * @param {number} [timeOffset=0] 
   */
  playSFX(id, freq, duration, velocity, timeOffset = 0) {
    if (!this.settings.sfxEnabled) return;
    // Pass settings down using the new Options Object API
    this.engine.playSFX(id, freq, duration, {
      // RLO Engine requires volume to be baked into velocity for synthesis
      velocity: velocity * this.settings.sfxVolume * 0.7, 
      timeOffset: timeOffset
    });
  }

  /** @returns {void} */
  playSelect() {
    this.playSFX(9, "A5", 0.1, 0.45);
  }

  playDeselect() {
    this.playSFX(9, "A4", 0.1, 0.3);
  }

  playError() {
    // Heavy Overdriven Error Buzzer
    // Switching to the Electric Guitar synth (ID 27) and stacking an octave 
    // forces the compressor to violently distort the sound, making it MUCH louder.
    this.playSFX(27, "A2", 0.4, 0.8);
  }

  playSuccess() {
    // A very subtle, light "coin" chime (ID 11 - Vibraphone)
    // Shifted to a higher octave and drastically reduced velocity for a much less intense feel
    this.playSFX(11, "E5", 0.1, 0.198);
  }

  playLevelComplete() {
    // ID 83: Lead Synth victorious chime 
    // Velocity pumped to 1.0 and an extra octave stacked on the final hit for a grander impact
    this.playSFX(83, "A4", 0.5, 1.0);
  }

  playGameOver() {
    // EPIC CYBERPUNK SYSTEM FAILURE
    // 1. Sharp, dissonant warning alarm
    this.playSFX(83, "B4", 0.1, 1.0);
  }
}

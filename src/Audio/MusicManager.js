// @ts-check
import { config } from '../config.js';

/**
 * Handles dynamic music track loading, sequencing, and fading.
 */
export class MusicManager {
  /**
   * @param {import('rlo-engine').RLOGameEngine} rloEngine 
   * @param {import('../SettingsManager.js').SettingsManager} settings 
   * @param {AudioContext} ctx
   */
  constructor(rloEngine, settings, ctx) {
    /** @type {import('rlo-engine').RLOGameEngine} */
    this.engine = rloEngine;
    /** @type {import('../SettingsManager.js').SettingsManager} */
    this.settings = settings;
    /** @type {AudioContext} */
    this.ctx = ctx;
    
    // Expose state so the UI (like MenuController) knows what to display
    /** @type {boolean} */
    this.isPlaying = false;
    /** @type {'menu' | 'level' | null} */
    this.currentType = null; // 'menu' or 'level'
    
    // Cache for our loaded tracks so we don't fetch them multiple times
    /** @type {any} */
    this.menuTrackCache = null;
    
    // Track the currently playing file name (e.g. '21.json', 'intro.json') so external systems can query it
    /** @type {string | null} */
    this.currentTrackName = null;
    /** @type {any} */
    this.currentTrackData = null;
    /** @type {number} */
    this.trackStartTime = 0;
    /** @type {number} */
    this.lastTrackPos = 0;
    /** @type {number} */
    this.beatSearchIndex = 0;
  }

  /** @returns {Promise<void>} */
  async startMenuMusic() {
    this.currentType = 'menu';
    if (!this.settings.musicEnabled) return;
    console.log("🎵 MusicManager: Playing Intro Theme...");
    this.isPlaying = true;
    
    if (this.currentType === 'menu' && this.isPlaying) {
      this.currentTrackName = 'intro.json';
      this.currentTrackData = config.track;
      this.trackStartTime = this.ctx.currentTime;
      this.setVolume(this.settings.musicVolume);
      this.engine.playMusic(config.track, { loop: true, fadeInTime: 0.5 });
    }
  }

  /**
   * @param {number | string} level 
   * @returns {Promise<void>}
   */
  async startLevelMusic(level) {
    this.currentType = 'level';
    if (!this.settings.musicEnabled) return;
    console.log(`🎵 MusicManager: Playing Level ${level} Theme...`);
    this.isPlaying = true;
    
    if (this.currentType === 'level' && this.isPlaying) {
      this.currentTrackName = `${level}.json`;
      this.currentTrackData = config.track;
      this.trackStartTime = this.ctx.currentTime;
      this.setVolume(this.settings.musicVolume);
      this.engine.playMusic(config.track, { loop: true, fadeInTime: 0.5 });
    }
  }

  /** @returns {void} */
  stopMusic() {
    console.log("🎵 MusicManager: Stopping Music...");
    this.isPlaying = false;
    this.currentTrackName = null;
    // Safely call the engine's stop method
    if (typeof this.engine.stopMusic === 'function') {
      this.engine.stopMusic();
    } else if (typeof this.engine.stop === 'function') {
      this.engine.stop();
    }
  }

  /**
   * @param {number} vol 
   * @returns {void}
   */
  setVolume(vol) {
    console.log(`🎵 MusicManager: Master Music Volume set to ${vol}`);
    if (typeof this.engine.setMusicVolume === 'function') {
      // Scale down to 38% to give the compressor even more headroom for SFX.
      // Drop intro (menu) track by an additional 30% (0.7x) so it isn't overpowering.
      const trackScale = this.currentType === 'menu' ? 0.7 : 1.0;
      this.engine.setMusicVolume(vol * 0.266 * trackScale); // Lowered by an additional 30% (0.38 * 0.7)
    }
  }

  /**
   * Analyzes the currently playing sequence to calculate a real-time beat pulse (0.0 to 1.0).
   * Identifies kick drums and heavy bass notes for visual systems to sync with.
   */
  getBeatPulse() {
    if (!this.isPlaying || !this.currentTrackData || !this.ctx) return 0;
    const trackPos = (this.ctx.currentTime - this.trackStartTime) % this.currentTrackData.durationSecs;
    let beatPulse = 0;
    
    // Reset search index if the track looped
    if (trackPos < this.lastTrackPos) {
      this.beatSearchIndex = 0;
    }
    this.lastTrackPos = trackPos;

    const notes = this.currentTrackData.notes;
    if (!notes) return 0;

    // Fast-forward the search index to avoid O(N) looping from the beginning 60 times a second
    while (this.beatSearchIndex < notes.length && notes[this.beatSearchIndex + 1] < trackPos - 0.15) {
      this.beatSearchIndex += 5;
    }

    for (let j = this.beatSearchIndex; j < notes.length; j += 5) {
      const noteTime = notes[j + 1];
      if (trackPos >= noteTime && trackPos < noteTime + 0.15) {
        const freq = notes[j];
        const vel = notes[j + 3];
        const inst = notes[j + 4];
        if ((inst === 128 && freq <= 60) || (inst !== 128 && freq < 100 && vel > 0.7)) {
          const decay = 1.0 - ((trackPos - noteTime) / 0.15);
          beatPulse = Math.max(beatPulse, decay * vel);
        }
      }
      if (noteTime > trackPos + 0.15) break; 
    }
    return beatPulse;
  }
}

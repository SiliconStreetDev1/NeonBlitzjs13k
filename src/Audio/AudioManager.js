// @ts-check
import { 
  RLOCore,
  createInstrumentMap,
  PianoSynth
} from 'rlo-engine';
import { config } from '../config.js';

/**
 * Master controller for all game audio.
 * Initializes the Web Audio API and routes requests to specific sub-managers.
 */
export class AudioManager {
  /**
   */
  constructor() {
    /** @type {boolean} */
    this.isInitialized = false;
    /** @type {string | null} */
    this.debugTrackOverride = null;
    
    /** @type {AudioContext | null} */
    this.ctx = null;
    /** @type {RLOCore | null} */
    this.rloEngine = null;
    
    this.isPlaying = false;
    this._pend = false;
    this._pendLevel = 1;
    this._currentTrack = null;
  }

  /** @returns {void} */
  init() {
    if (this.ctx) return;
    
    // Browsers require a user interaction before an AudioContext can play sound!
    const AudioContext = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
    this.ctx = new AudioContext();

    if (!this.ctx) return;
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    const customMap = createInstrumentMap([{ synth: new PianoSynth(), start: 0, end: 128 }]);

    this.rloEngine = new RLOCore(this.ctx, customMap);

    this.isInitialized = true;
    console.log("🎵 AudioManager: Core RLO Engine Initialized!");

    if (this._pend) {
      this.startLevelMusic(this._pendLevel);
      this._pend = false;
    }
  }

  /**
   * Explicitly attempts to resume the AudioContext to satisfy strict autoplay policies.
   */
  resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch((/** @type {any} */ e) => console.warn("🎵 AudioManager: Failed to resume context:", e));
      console.log("🎵 AudioManager: AudioContext Resumed!");
    }
  }

  // --- PROXY METHODS (Safely passes UI and Game Loop triggers to sub-managers) ---
  playSFX(type, f, d, v, offset = 0) { 
    if (!this.ctx) return;
    let freq = typeof f === 'number' ? f : 440 * Math.pow(2, ({C:-9,D:-7,E:-5,F:-4,G:-2,A:0,B:2}[f[0]] + (f[1]==='#'?1:f[1]==='b'?-1:0) + 12 * (parseInt(f.slice(-1)) - 4)) / 12);
    const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = typeof type === 'string' ? type : 'sine';
    osc.connect(gain).connect(this.ctx.destination);
    osc.frequency.value = freq;
    const t = this.ctx.currentTime + offset;
    gain.gain.setValueAtTime(v * 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + d);
    osc.start(t); osc.stop(t + d);
  }
  playSelect() { this.playSFX('sine', "A5", 0.1, 0.45); }
  playDeselect() { this.playSFX('sine', "A4", 0.1, 0.3); }
  playError() { 
    this.playSFX('sawtooth', "D#2", 0.2, 1.0); 
    this.playSFX('sawtooth', "A1", 0.3, 1.0, 0.05); 
  }
  playSuccess() { 
    this.playSFX('sine', "C5", 0.15, 0.4); 
    this.playSFX('sine', "E5", 0.15, 0.4, 0.05); 
    this.playSFX('sine', "G5", 0.15, 0.4, 0.1); 
    this.playSFX('sine', "C6", 0.3, 0.5, 0.15); 
  }
  playLevelComplete() { 
    this.playSFX('square', "C5", 0.4, 0.7); 
    this.playSFX('square', "E5", 0.4, 0.7, 0.1); 
    this.playSFX('square', "G5", 0.4, 0.7, 0.2); 
    this.playSFX('square', "C6", 0.4, 0.7, 0.3); 
    this.playSFX('square', "E6", 0.4, 0.7, 0.4); 
    this.playSFX('square', "G6", 0.8, 0.9, 0.5); 
  }
  playGameOver() { 
    this.playSFX('sawtooth', "C3", 0.6, 1.0); 
    this.playSFX('sawtooth', "F#2", 0.6, 1.0, 0.15); 
    this.playSFX('sawtooth', "C2", 1.2, 1.0, 0.3); 
  }
  
  startLevelMusic(level = 1) { 
    if (!this.rloEngine) {
      this._pend = true;
      this._pendLevel = level;
      return;
    }
    
    // Cycle through tracks sequentially based on the current level
    const targetTrack = config.tracks[(level - 1) % config.tracks.length];

    if (!this.isPlaying || this._currentTrack !== targetTrack) {
      this.isPlaying = true;
      this._currentTrack = targetTrack;
      this.rloEngine.setVolume(0.16);
      this.rloEngine.playSequence(targetTrack, { loop: true, fadeInTime: 0.5 });
    }
  }

  stopMusic() { this.isPlaying = false; this.rloEngine?.stop?.(); }

}

// @ts-check

/**
 * @fileoverview Orchestrates and manages all game hazards using a modular plugin pattern.
 */
export class HazardManager {
  /**
   * @param {import('../engine.js').GameEngine} engine 
   */
  constructor(engine) {
    this.engine = engine;
    /** @type {Map<string, any>} */
    this.plugins = new Map();
  }

  /**
   * Registers a new hazard plugin dynamically.
   * @param {string} name - Unique identifier for the hazard.
   * @param {new (engine: import('../engine.js').GameEngine) => any} PluginClass - The hazard class to instantiate.
   */
  registerPlugin(name, PluginClass) {
    this.plugins.set(name, new PluginClass(this.engine));
  }

  /**
   * Gets a registered hazard instance by name.
   * @param {string} name 
   * @returns {any}
   */
  getPlugin(name) {
    return this.plugins.get(name);
  }

  /**
   * Checks if a plugin should yield execution due to mutual exclusivity rules defined in the progression manifest.
   * @param {string} pluginKey - The configuration key of the plugin checking for conflicts.
   * @returns {boolean} True if another active plugin mutually excludes this one.
   */
  hasExclusiveConflict(pluginKey) {
    const hazardsConfig = this.engine.progression.hazards;
    for (const [activeKey, plugin] of this.plugins.entries()) {
      if (!plugin.isActive) continue;
      
      // Check if the currently active plugin excludes the incoming one
      const theirExclusions = hazardsConfig[activeKey]?.exclusiveWith || [];
      if (Array.isArray(theirExclusions) && theirExclusions.includes(pluginKey)) return true;
      
      // Check if the incoming plugin excludes the currently active one
      const ourExclusions = hazardsConfig[pluginKey]?.exclusiveWith || [];
      if (Array.isArray(ourExclusions) && ourExclusions.includes(activeKey)) return true;
    }
    return false;
  }

  /**
   * Initializes all hazards for a new level.
   * @param {() => number} rng - Seeded random generator.
   */
  init(rng) {
    for (const plugin of this.plugins.values()) {
      if (typeof plugin.reset === 'function') plugin.reset();
    }
    for (const plugin of this.plugins.values()) {
      if (typeof plugin.init === 'function') plugin.init(rng, this);
    }
  }

  /**
   * Advances the logic state of all active hazards.
   * @param {number} dt - Delta time in milliseconds.
   * @param {number} timestamp - High resolution timestamp.
   */
  update(dt, timestamp) {
    for (const plugin of this.plugins.values()) {
      if (typeof plugin.update === 'function') plugin.update(dt, timestamp);
    }
  }

  /**
   * Renders all active visual hazards to the game canvas.
   * @param {number} timestamp - High resolution timestamp.
   */
  draw(timestamp) {
    for (const plugin of this.plugins.values()) {
      if (typeof plugin.draw === 'function') plugin.draw(timestamp);
    }
  }
}
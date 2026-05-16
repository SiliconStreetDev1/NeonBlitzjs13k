// @ts-check
/**
 * @fileoverview Core type definitions for the Neon Blitz game.
 */

/**
 * @typedef {Object} UIComponents
 * @property {HTMLElement} gridContainer
 * @property {HTMLCanvasElement} canvas
 * @property {CanvasRenderingContext2D} ctx
 * @property {HTMLElement} timerBar
 * @property {HTMLElement} levelDisplay
 * @property {HTMLElement} timeSpentDisplay
 * @property {HTMLElement} targetColorName
 * @property {HTMLElement} gameArea
 * @property {HTMLElement} hud
 */

/**
 * @typedef {Object} Point
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} ColorInfo
 * @property {string} class
 * @property {string} name
 * @property {string} hex
 */

/**
 * @typedef {Object} TargetQueueItem
 * @property {ColorInfo} colorInfo
 * @property {Point[]} cells
 * @property {number} size
 * @property {number} difficulty
 */

/**
 * @typedef {TargetQueueItem[]} TargetQueue
 */

export default {};
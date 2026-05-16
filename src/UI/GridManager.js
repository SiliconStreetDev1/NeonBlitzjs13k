// @ts-check
import { getCenter } from '../utils.js';

export class GridManager {
  /**
   * @param {import('../types.js').UIComponents} ui 
   * @param {any} config 
   */
  constructor(ui, config) {
    this.ui = ui;
    this.config = config;
    /** @type {Array<import('../types.js').Point>} */
    this.centerCache = [];
  }

  /**
   * Caches the pixel centers of all grid blocks to prevent DOM Layout Thrashing
   * during the 60fps render loop.
   */
  cacheBlockCenters() {
    this.centerCache = [];
    const allBlocks = this.ui.gridContainer.children;
    for (let i = 0; i < allBlocks.length; i++) {
      const el = /** @type {HTMLElement} */ (allBlocks[i]);
      if (el) this.centerCache[i] = { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2 };
    }
  }

  /**
   * @param {number} index 
   */
  setBlockSelected(index) { 
    const block = this.ui.gridContainer.children[index];
    if (block) block.classList.add('selected'); 
  }
  
  /**
   * @param {number[]} indices 
   */
  clearBlockStates(indices) { 
    indices.forEach(idx => {
      const b = this.ui.gridContainer.children[idx];
      if (b) b.classList.remove('selected', 'warning-shake');
    }); 
  }
  
  /**
   * @param {number} index 
   */
  setBlockEmpty(index) {
    const block = /** @type {HTMLElement} */ (this.ui.gridContainer.children[index]);
    if (block) {
      block.className = 'block empty';
      block.dataset.colorClass = 'empty';
    }
  }

  /**
   * @param {boolean} isCycling 
   */
  updateChameleonBlocks(isCycling) {
    const allBlocks = this.ui.gridContainer.children;
    for (let i = 0; i < allBlocks.length; i++) {
      const blockEl = /** @type {HTMLElement} */ (allBlocks[i]);
      if (blockEl.dataset.isChameleon === 'true' && blockEl.dataset.colorClass !== 'empty') {
        if (isCycling) blockEl.style.backgroundColor = this.config.level.ALL_COLORS[Math.floor(Math.random() * this.config.level.ALL_COLORS.length)];
        else blockEl.style.backgroundColor = blockEl.dataset.colorHex || '';
      }
    }
  }

  /**
   * Safely retrieves all relevant data for a block from the DOM without exposing the Element.
   * @param {number} index 
   * @returns {{index: number, colorClass: string, colorHex: string | null, isChameleon: boolean} | null}
   */
  getBlockData(index) {
    const blockEl = /** @type {HTMLElement} */ (this.ui.gridContainer.children[index]);
    if (!blockEl) return null;
    return {
      index,
      colorClass: blockEl.dataset.colorClass || 'empty',
      colorHex: blockEl.dataset.colorHex || null,
      isChameleon: blockEl.dataset.isChameleon === 'true'
    };
  }

  /**
   * Safely retrieves the canvas-relative center pixel coordinates for a given grid index.
   * @param {number} index 
   * @returns {import('../types.js').Point | null}
   */
  getBlockCenter(index) {
    if (this.centerCache && this.centerCache[index]) return this.centerCache[index];
    const blockEl = /** @type {HTMLElement} */ (this.ui.gridContainer.children[index]);
    return blockEl ? getCenter(blockEl) : null;
  }

  /**
   * Scans the grid for blocks of a specific color that haven't been visited yet.
   * @param {string} colorClass 
   * @param {number[]} visitedIndices 
   * @returns {number[]}
   */
  getUnvisitedBlocks(colorClass, visitedIndices) {
    const unvisited = [];
    const allBlocks = this.ui.gridContainer.children;
    for (let i = 0; i < allBlocks.length; i++) {
      const b = /** @type {HTMLElement} */ (allBlocks[i]);
      if (b.dataset.colorClass === colorClass && !visitedIndices.includes(i)) {
        unvisited.push(i);
      }
    }
    return unvisited;
  }

  /**
   * @param {import('../types.js').TargetQueue} targetQueue 
   * @param {number} [level=1] 
   * @param {() => number} [rng=Math.random] 
   * @param {any} [config] 
   */
  initGrid(targetQueue, level = 1, rng = Math.random, config) {
    const GRID_COLS = 6;
    const GRID_ROWS = 8;
    this.ui.gridContainer.innerHTML = '';
    /** @type {HTMLElement[]} */
    let blocks = new Array(GRID_COLS * GRID_ROWS);
    for (let i = 0; i < targetQueue.length; i++) {
      let t = targetQueue[i];
      let cIdx = 0;
      for (let pos of t.cells) {
        let idx = pos.y * GRID_COLS + pos.x;
        let block = document.createElement('div');
        block.className = 'block ' + t.colorInfo.class;
        block.dataset.index = idx.toString();
        block.dataset.colorClass = t.colorInfo.class;
        block.dataset.colorHex = t.colorInfo.hex;
        block.style.backgroundColor = t.colorInfo.hex; 
        if (t.colorInfo.class === 'c-stone') {
            block.style.backgroundImage = 'radial-gradient(#777, #333)';
            block.style.border = '2px solid #222';
        } else if (level >= 2 && cIdx % 2 === 1) {
            block.dataset.isChameleon = 'true';
        }
        blocks[idx] = block;
        cIdx++;
      }
    }
    for (let i = 0; i < GRID_COLS * GRID_ROWS; i++) {
      if (!blocks[i]) {
         let block = document.createElement('div');
         block.className = 'block empty';
         block.dataset.index = i.toString();
         block.dataset.colorClass = 'empty';
         block.style.backgroundColor = '';
         blocks[i] = block;
      }
      this.ui.gridContainer.appendChild(blocks[i]);
    }
    
    setTimeout(() => this.cacheBlockCenters(), 50);
  }

  /**
   * @returns {void}
   */
  processGravity() {
    const GRID_COLS = 6;
    const GRID_ROWS = 8;
    /** @type {Array<Array<{class: string, hex: string | null, isChameleon: boolean}>>} */
    let columns = Array(GRID_COLS).fill(0).map(() => []);
    let allBlocks = Array.from(this.ui.gridContainer.children);
    for (let x = 0; x < GRID_COLS; x++) {
      for (let y = 0; y < GRID_ROWS; y++) {
        let idx = y * GRID_COLS + x;
        let block = /** @type {HTMLElement} */ (allBlocks[idx]);
        if (block.dataset.colorClass !== 'empty') {
          columns[x].push({ class: block.dataset.colorClass || 'empty', hex: block.dataset.colorHex || null, isChameleon: block.dataset.isChameleon === 'true' });
        }
      }
      while (columns[x].length < GRID_ROWS) columns[x].unshift({ class: 'empty', hex: '#000', isChameleon: false });
      
      for (let y = 0; y < GRID_ROWS; y++) {
        let block = /** @type {HTMLElement} */ (allBlocks[y * GRID_COLS + x]);
        let newData = columns[x][y];
        let oldClass = block.dataset.colorClass;
        block.className = 'block';
        if (newData.class === 'empty') {
          block.classList.add('empty');
          block.style.backgroundColor = ''; block.style.backgroundImage = ''; block.style.border = '';
        } else {
          block.classList.add(newData.class);
          block.style.backgroundColor = newData.hex || '';
          if (newData.class === 'c-stone') {
              block.style.backgroundImage = 'radial-gradient(#777, #333)'; block.style.border = '2px solid #222';
          } else {
              block.style.backgroundImage = ''; block.style.border = '';
          }
        }
        block.dataset.colorClass = newData.class;
        block.dataset.colorHex = newData.hex || '';
        block.dataset.isChameleon = newData.isChameleon ? 'true' : 'false';

        if (newData.class !== 'empty' && oldClass !== newData.class) {
          block.classList.add('falling');
          block.addEventListener('animationend', () => block.classList.remove('falling'), { once: true });
        }
      }
    }
  }

  /**
   * @param {string} targetColorClass 
   * @param {number} targetDifficulty 
   * @returns {number}
   */
  highlightActiveBlocks(targetColorClass, targetDifficulty) {
    const allBlocks = this.ui.gridContainer.children;
    let remaining = 0;
    for (let i = 0; i < allBlocks.length; i++) {
      const blockEl = /** @type {HTMLElement} */ (allBlocks[i]);
      if (blockEl.dataset.colorClass === targetColorClass) {
        if (targetDifficulty === 0) blockEl.classList.add('is-current-target');
        else blockEl.classList.remove('is-current-target');
        remaining++;
      } else {
        blockEl.classList.remove('is-current-target');
      }
    }
    return remaining;
  }
}
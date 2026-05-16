// @ts-check
import { isAdjacent } from './utils.js';

const vib = (n) => navigator.vibrate && navigator.vibrate(n);

/**
 * Enterprise-grade Input & Interaction Controller.
 * Manages grid touch events, diagonal swiping traces, and connection validations.
 */
export class InputHandler {
  /**
   * Initializes the InputHandler.
   * @param {import('./engine.js').GameEngine} engine - The main game engine instance.
   */
  constructor(engine) {
    this.engine = engine;
  }

  /**
   * Adds a block to the current active selection path.
   * @param {number} index - The block index to select.
   */
  addBlock(index) {
    this.engine.selectedBlocks.push(index);
    this.engine.grid.setBlockSelected(index);
    vib(15);
    this.engine.audio?.playSelect?.();
  }

  /**
   * Resets the player's current swipe selection, penalizing combos if necessary.
   * @param {number} [errorIndex=-1] - Optional block index to highlight with an error flash.
   */
  resetSelection(errorIndex = -1) {
    if (this.engine.combo > 1) {
      this.engine.combo = 1;
      this.engine.hud.updateTargetUI(this.engine.targetQueue, this.engine.currentTargetIndex, this.engine.targetDifficulty, this.engine.combo);
    }
    this.engine.audio?.playError?.();

    // Apply time penalty for mistakes
    const penaltyMs = Math.min(3000, 1000 + (this.engine.level - 1) * 250);

    this.engine.timeRemaining -= penaltyMs;
    
    let p = this.engine.grid.getBlockCenter(errorIndex > -1 ? errorIndex : this.engine.selectedBlocks.at(-1)) || this.engine.pointerPos;
    this.engine.popups.showPopup(`-${(penaltyMs / 1000).toFixed(1)}s`, p.x, p.y, '#f36');

    this.engine.grid.clearBlockStates(this.engine.selectedBlocks);
    this.engine.selectedBlocks = [];
    this.engine.isPointerComplete = false;
    this.engine.isPointerDeadEnd = false;
    this.engine.isDragging = false;
  }

  /**
   * Validates if a continuous path exists from the tip to all unvisited blocks.
   * Moved to a class method to prevent recreation of closure on every pointer move (GC optimization).
   * @private
   * @param {number} tipIndex
   * @param {number[]} unvisitedIndices
   * @param {number} depth
   * @param {number} remainingCount
   * @returns {boolean}
   */
  _validatePathContinuity(tipIndex, unvisitedIndices, depth = 0, remainingCount = unvisitedIndices.length) {
    if (depth > 1000) return true; // Failsafe against infinite recursion / stack overflow
    if (remainingCount === 0) return true;
    
    for (let i = 0; i < unvisitedIndices.length; i++) {
      const nextIndex = unvisitedIndices[i];
      if (nextIndex !== -1 && isAdjacent(tipIndex, nextIndex, 6)) {
        unvisitedIndices[i] = -1; // Mark as visited
        if (this._validatePathContinuity(nextIndex, unvisitedIndices, depth + 1, remainingCount - 1)) return true;
        unvisitedIndices[i] = nextIndex; // Backtrack
      }
    }
    return false;
  }

  /**
   * Evaluates the current path to dynamically check for completion or dead-ends.
   */
  updatePathState() {
    const currentTarget = this.engine.targetQueue[this.engine.currentTargetIndex];
    const tipIndex = this.engine.selectedBlocks[this.engine.selectedBlocks.length - 1];

    this.engine.isPointerComplete = !this.engine.isPointerInvalid && (this.engine.selectedBlocks.length === currentTarget.size);

    if (this.engine.isPointerComplete || this.engine.isPointerInvalid || this.engine.selectedBlocks.length === 0) {
      this.engine.isPointerDeadEnd = false;
      
      if (this.engine.isPointerComplete) {
        // Add a slight delay before auto-completing to allow the user to see the green confirmation line
        setTimeout(() => {
          if (this.engine.isPointerComplete && this.engine.isPlaying) {
            this.completePath();
          }
        }, 150);
      }
      
      return;
    }

    const currentInfo = currentTarget.colorInfo;
    const unvisited = this.engine.grid.getUnvisitedBlocks(currentInfo.class, this.engine.selectedBlocks);

    this.engine.isPointerDeadEnd = !this._validatePathContinuity(tipIndex, unvisited);
  }

  /**
   * Completes the current valid path, awarding points and advancing the game.
   */
  completePath() {
    if (this.engine.selectedBlocks.length === 0) return;
    
    const clearedCount = this.engine.selectedBlocks.length;
    
    const timeBonus = (clearedCount * 1000) + (this.engine.combo * 2000);
    this.engine.timeRemaining += timeBonus;
    this.engine.maxTime = Math.max(this.engine.maxTime, this.engine.timeRemaining);

    this.engine.combo++;
    
    this.engine.selectedBlocks.forEach(idx => {
      this.engine.grid.setBlockEmpty(idx);
    });

    const tipIndex = this.engine.selectedBlocks[this.engine.selectedBlocks.length - 1];
    const center = this.engine.grid.getBlockCenter(tipIndex);
    if (center) this.engine.popups.showPopup(`+${(timeBonus / 1000).toFixed(1)}s`, center.x, center.y, '#3c6');

    vib([30, 50, 80]);
    this.engine.audio?.playSuccess?.();
    
    this.engine.grid.processGravity();
    this.engine.selectedBlocks = [];
    this.engine.advanceQueue();
    this.engine.isPointerComplete = false;
    this.engine.isPointerDeadEnd = false;
    this.engine.isDragging = false;
  }

  /**
   * Handles the initial touch/click down event on the grid.
   * @param {number} index - The block index that was touched.
   * @param {number} x - The pointer's X coordinate relative to the canvas.
   * @param {number} y - The pointer's Y coordinate relative to the canvas.
   */
  handlePointerDown(index, x, y) {
    if (index === -1) return;
    const blockData = this.engine.grid.getBlockData(index);
    if (!blockData || blockData.colorClass === 'empty') return; 

    if (this.engine.isPointerComplete) return;

    const currentTarget = this.engine.targetQueue[this.engine.currentTargetIndex];
    const currentInfo = currentTarget.colorInfo;

    // Advanced UX: Resume, Unspool, or Tap-to-add on an existing trace
    if (this.engine.selectedBlocks.length > 0) {
      const lastIndex = this.engine.selectedBlocks[this.engine.selectedBlocks.length - 1];

      if (index === lastIndex) {
        // 1. Resume dragging from the tip
        this.engine.isDragging = true;
        this.engine.pointerPos = { x, y };
        this.engine.isPointerInvalid = false;
        return;
      } else if (this.engine.selectedBlocks.includes(index)) {
        // 2. Unspool the chain back to the tapped block without a time penalty
        while (this.engine.selectedBlocks.length > 0 && this.engine.selectedBlocks[this.engine.selectedBlocks.length - 1] !== index) {
          const removed = this.engine.selectedBlocks.pop();
          if (removed !== undefined) this.engine.grid.clearBlockStates([removed]);
        }
        this.engine.isDragging = true;
        this.engine.pointerPos = { x, y };
        this.engine.isPointerInvalid = false;
        this.updatePathState();
        vib(10);
        this.engine.audio?.playDeselect?.();
        return;
      } else if (blockData.colorClass === currentInfo.class && isAdjacent(lastIndex, index, 6) && !this.engine.selectedBlocks.includes(index)) {

        // 3. Tap-to-add the next adjacent block in the chain!
        this.engine.isDragging = true;
        this.engine.pointerPos = { x, y };
        this.engine.isPointerInvalid = false;
        this.addBlock(index);
        this.updatePathState();
        return;
      } else {
        // 4. Invalid tap. Reset and apply time penalty.
        this.resetSelection(index);
        vib(30);
        return;
      }
    }

    // Start a brand new trace
    if (blockData.colorClass === currentInfo.class) {

      this.engine.isDragging = true;
      this.engine.currentDragColorClass = blockData.colorClass;
      this.engine.currentDragColorHex = this.engine.targetDifficulty > 0 ? '#888888' : (blockData.colorHex || null);
      this.engine.pointerPos = { x, y };
      this.engine.isPointerInvalid = false;
      this.addBlock(index);
      this.updatePathState();
    } else {
      this.resetSelection(index);
      vib(30);
    }
  }

  /**
   * Handles dragging across the grid, validating path continuity.
   * @param {number} index - The block index currently being dragged over.
   * @param {number} x - The pointer's current X coordinate.
   * @param {number} y - The pointer's current Y coordinate.
   */
  handlePointerMove(index, x, y) {
    this.engine.pointerPos = { x, y };

    if (!this.engine.isDragging) return;
    
    if (this.engine.isPointerComplete) return;

    // Assume valid line extension by default, re-evaluate below
    this.engine.isPointerInvalid = false; 

    if (index === -1) return;
    const blockData = this.engine.grid.getBlockData(index);
    if (!blockData || blockData.colorClass === 'empty') return; 

    const currentTarget = this.engine.targetQueue[this.engine.currentTargetIndex];
    if (this.engine.selectedBlocks.length === currentTarget.size) {
      if (this.engine.selectedBlocks.length > 1 && this.engine.selectedBlocks[this.engine.selectedBlocks.length - 2] === index) {
        const removed = this.engine.selectedBlocks.pop();
        if (removed !== undefined) this.engine.grid.clearBlockStates([removed]);
        vib(10);
        this.engine.audio?.playDeselect?.();
        this.updatePathState();
      }
      return; 
    }

    if (blockData.colorClass === this.engine.currentDragColorClass) {
      if (!this.engine.selectedBlocks.includes(index)) {
        const tipIndex = this.engine.selectedBlocks[this.engine.selectedBlocks.length - 1];
        if (isAdjacent(tipIndex, index, 6)) {
          this.addBlock(index);
        } else {
          this.engine.isPointerInvalid = true; // Correct color, but not adjacent!
        }
      } else if (this.engine.selectedBlocks.length > 1 && this.engine.selectedBlocks[this.engine.selectedBlocks.length - 2] === index) {
        const removed = this.engine.selectedBlocks.pop();
        if (removed !== undefined) this.engine.grid.clearBlockStates([removed]);
        vib(10);
        this.engine.audio?.playDeselect?.();
      } else if (this.engine.selectedBlocks[this.engine.selectedBlocks.length - 1] !== index) {
        this.engine.isPointerInvalid = true; // Crossing over their own path!
      }
    } else {
      this.engine.isPointerInvalid = true; // Hovering wrong color!
    }

    this.updatePathState();
  }

  /**
   * Evaluates the completed swipe path upon releasing the screen, applying scores or errors.
   */
  handlePointerUp() {
    if (!this.engine.isDragging) return;
    this.engine.isDragging = false;
    if (!this.engine.isPlaying) return;

    // If they release their finger while the line is red, they fail the move
    if (this.engine.isPointerInvalid) {
      this.resetSelection();
      vib(30);
      this.engine.isPointerInvalid = false;
      this.engine.isPointerComplete = false;
      this.engine.isPointerDeadEnd = false;
      return;
    }

    const currentTarget = this.engine.targetQueue[this.engine.currentTargetIndex];
    const requiredCount = currentTarget.size;
    
    const tipIndex = this.engine.selectedBlocks[this.engine.selectedBlocks.length - 1];

    if (this.engine.selectedBlocks.length === requiredCount && requiredCount > 0) { 
      this.completePath();
    } else if (this.engine.selectedBlocks.length > 0) {
      this.resetSelection(tipIndex);
      vib(30);
    }
  }
}
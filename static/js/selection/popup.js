/**
 * Holds the position information (x and y) of an object in the html side.
 */
class Position {
  #x = 0;
  #y = 0;

  /**
   * Creates a new position element.
   * 
   * @param {number} x the x position
   * @param {number} y the y position
   */
  constructor(x, y) {
    this.#x = x;
    this.#y = y;
  }

  /**
   * The x position
   * @returns {number}
   */
  get x() {
    return this.#x;
  }

  /**
   * The y position
   * @returns {number}
   */
  get y() {
    return this.#y;
  }
} 

/**
 * The annotation popup if the user selects some text.
 * This class creates the popup window if a user selects some text.
 */
class SelectionPopup {
  static #popup = null;             // the popup window
  static #mouseOverPopup = false;   // flag if mouse is over popup
  static #selection;                // the selected text as a selection object
  static #lastRange;                // the range belonging to the last selected text
  static #lastRangeCount;           // the number of ranges of last selected text

  /**
   * Static class. Do not instantiate.
   */
  constructor() {
    // should not be constructed
    throw new Error('This class should not be instantiated!');
  }

  /**
   * Check if mouse is over popup.
   * 
   * @returns {boolean} true if mouse is over popup
   */
  static get mouseOverPopup() {
    return SelectionPopup.#mouseOverPopup;
  }

  /**
   * Set if mouse is over popup.
   * 
   * @param {boolean} value the value to set
   */
  static set mouseOverPopup(value) {
    SelectionPopup.#mouseOverPopup = value;
  }

  /**
   * Get the last selection for the popup.
   * 
   * @returns {Selection} the current selection
   */
  static get selection() {
    return this.#selection;
  }

  /**
   * Get the position of the range object in the html page.
   * 
   * @param {Range} range
   * @returns {Position} the x and y position
   */
  static #getPosition(range) {
    let rects, lastRect;
    let endX, endY;
    let position;

    // Get the ClientRect objects for the selected text
    rects = range.getClientRects();
  
    // Get the last ClientRect object in the list
    lastRect = rects[rects.length - 1];
    if (lastRect === undefined) {
      return null;
    }
    // Get the x and y coordinates of the end position relative to the viewport
    endX = lastRect.right;
    endY = lastRect.bottom;
    // ensure element is not cut of on the left
    endX = Math.max(endX, 50);
  
    // Add the scroll position to get the absolute end position relative to the document
    endX += window.scrollX;
    endY += window.scrollY;

    // create return object
    position = new Position(endX, endY);
    return position;
  }

  /**
   * Creates the popup window on the html page.
   * 
   * @param {Position} position the position of the popup
   */
  static #createPopup(position) {
    let popup;

    popup = document.createElement('div');
    popup.setAttribute('speech-bubble', '');
    popup.setAttribute('ptop', '');
    popup.setAttribute('acenter', '');
    popup.setAttribute('style', "--bbColor:#fffffa; --bbArrowSize:0.75rem");
    
    // Set popup position
    popup.style.position = 'absolute';
    popup.style.left = position.x - 48 + 'px';
    popup.style.top = position.y + 18 + 'px';
    popup.style.zIndex = 1;

    // Add the mouseover event listener
    popup.addEventListener('mouseover', (event) => {
      SelectionPopup.mouseOverPopup = true;
    });
    // Add the mouseout event listener
    popup.addEventListener('mouseout', (event) => {
      SelectionPopup.mouseOverPopup = false;
    });
    // Add event listener mousedown -> prevent removal of selection
    popup.addEventListener('mousedown', (event) => {
      runtime.clickOnPopup();
    });
    // text content
    popup.textContent = "Annotate";
    // show popup
    document.body.appendChild(popup);

    // set class variable
    SelectionPopup.#popup = popup;
  }

  /**
   * Handle text selection.
   * The AnnoTize runtime calls this function if the user releases the mouse.
   * Checks if text is selected and adds annotation popup / annotates text.
   * 
   * @param {Event} event the mouse up event
   * @returns {boolean} true if popup created / text annotated
   */
  static eventMouseup(event) {
    let selection, range, position;
    if (SelectionPopup.mouseOverPopup) {
      // click on popup
      return false;
    }
    // remove old popup (if present)
    SelectionPopup.removePopup();

    // Get the coordinates of the selected text
    selection = window.getSelection();
    if (selection == null || selection.isCollapsed) {
      return false;
    }
    // Get the corresponding range - two range, absolute and relative
    range = selection.getRangeAt(0);
    // Check if selection is in sidebar
    if (!runtime.sidebar.isNodeBefore(range.endContainer)) {
      return false;
    }

    // check if start position is at end of container
    if (range.startContainer.length === range.startOffset) {
      let endRange;
      // create selection in reverse order (i.e right-to-left) regardless of actual selection direction
      endRange = range.cloneRange();
      endRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(endRange);
      selection.extend(range.startContainer, range.startOffset);
      // extend selection one to the right (i.e. the start of selection one to right)
      selection.modify("extend", "right", "character");
      // return if selection is now collapsed
      if (selection.isCollapsed) {
        return false;
      }
      // update range
      range = selection.getRangeAt(0);
    }
    // check if end position is at start of container
    if (range.endOffset === 0) {
      // create selection in order (i.e left-to-right) regardless of actual selection direction
      selection.removeAllRanges();
      selection.addRange(range);
      // extend selection one to the left (i.e. the end of selection one to left)
      selection.modify("extend", "left", "character");
      // return if selection is now collapsed
      if (selection.isCollapsed) {
        return false;
      }
      // update range
      range = selection.getRangeAt(0);
    }

    // remove tailing whitespace if enabled
    if (ATSettings.removeTrailingWhitespaces) {
      let text = range.toString();
      while (text.length > 1 && [' ', '\n'].includes(text[text.length - 1])) {
        // create selection in order (i.e left-to-right) regardless of actual selection direction
        selection.removeAllRanges();
        selection.addRange(range);
        // extend selection one to the left (i.e. the end of selection one to left)
        selection.modify("extend", "left", "character");
        // update range
        range = selection.getRangeAt(0);
        text = range.toString();
      }
    }
    // same selection as before ~> click on selected text -> ignore (removes selection)
    if (range === this.#lastRange && selection.rangeCount === this.#lastRangeCount) {
      return false;
    }
    // save as last range
    this.#lastRange = range;
    this.#lastRangeCount = selection.rangeCount;
    this.#selection = selection;

    // handle special cases: reselect, discontinuity, auto annotate
    if (runtime.reselectAnnotation) {
      runtime.reselectAnnotationHandler();
      return true;
    }
    if (runtime.addDiscontinuity) {
      runtime.addDiscontinuityHandler();
      return true;
    }
    if (!ATSettings.showAnnotationPopup) {
      // instantly annotate selection
      runtime.clickOnPopup();
      return true;
    }

    position = this.#getPosition(range);
    if (position === null) {
      return false;
    }
    this.#createPopup(position);
    return true;
  }

  /**
   * Handle mouse down event.
   * Remove popup window if click was outside.
   */
  static eventMousedown () {
    if (SelectionPopup.mouseOverPopup) {
      return;
    }
    SelectionPopup.removePopup();
  }

  /**
   * Removes the annotation popup window (if present)
   */
  static removePopup() {
    if (SelectionPopup.#popup === null) {
      return;
    }
    SelectionPopup.#popup.remove();
    SelectionPopup.#popup = null;
    SelectionPopup.mouseOverPopup = false;
  }
}
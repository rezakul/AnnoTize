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
   * Get the x position
   * @returns {number} the x position
   */
  get x() {
    return this.#x;
  }

  /**
   * Get the y position
   * @returns {number} the y position
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
  static #popup = null;
  static #mouseOverPopup = false;
  static #selection;
  static #lastRange;

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
    endX += window.pageXOffset;
    endY += window.pageYOffset;

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
    // 
    popup.textContent = "Annotate";
    // show popup
    document.body.appendChild(popup);

    // set class variable
    SelectionPopup.#popup = popup;
  }

  static eventMouseup(event) {
    let selection, range, position;
    if (SelectionPopup.mouseOverPopup) {
      return;
    }
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
    if (settingsPlugin.options.removeTrailingWhitespaces) {
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
    if (range === this.#lastRange) {
      return false;
    }
    this.#lastRange = range;
    this.#selection = selection;

    if (runtime.reselectAnnotation) {
      runtime.reselectAnnotationHandler();
      return true;
    }
    if (runtime.addDiscontinuity) {
      runtime.addDiscontinuityHandler();
      return true;
    }
    if (!settingsPlugin.options.showAnnotationPopup) {
      runtime.clickOnPopup();
      return true;
    }

    position = this.#getPosition(range);
    if (position === null) {
      return;
    }
    this.#createPopup(position);
    return true;
  }

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



/**
 * Selection object class.
 * This class holds information about the selected text area. It allows to retrieve the selected text and
 * to insert annotations into the html document.
 */
class SelectionObject {
  #annotationID;
  #target;
  #selectedText = null;
  #mouseoverFunctions = [];
  #mouseoutFunctions = [];
  #clickFunctions = [];
  #annotationStyle;
  #todoFlag = null;

  /**
   * @param {Range} range the range corresponding to the selection (can be null if selection present)
   * @param {number} annotationID the unique annotation ID
   * @param {FragmentTarget} target the annotation target
   * @param {AnnotationStyle} style the annotation style
   */
  constructor(range, annotationID, target, style=AnnotationStyleMarker) {
    let mouseover, mouseout, click;

    this.#annotationID = annotationID;
    this.#target = target;
    // initialte selected text;
    this.#selectedText = document.createElement('div');
    this.#selectedText.setAttribute("class", "annotation-quote");
    this.#selectedText.textContent = range.toString();
    
    //this.#annotationStyle = new AnnotationStyleMarker(this);
    //this.#annotationStyle = new AnnotationStyleRectangle(this);
    this.#annotationStyle = new style(this);

    mouseover = (event) => { runtime.eventHoverOnTextHighlight(event, this.#annotationID, true);};
    mouseout = (event) => { runtime.eventHoverOnTextHighlight(event, this.#annotationID, false);};
    click = (event) => { runtime.eventClickOnTextHighlight(event, this.#annotationID);};
    
    this.#mouseoverFunctions.push(mouseover);
    this.#mouseoutFunctions.push(mouseout);
    this.#clickFunctions.push(click);
  }

  get annotationID() {
    return this.#annotationID;
  }

  /**
   * Get the corresponding range of the selected text area.
   * @return {Range} the corresponding absolute range
   */
  get range() {
    //two range, absolute and relative
    return getRangeToXPath(this.xPathStart, this.xPathEnd);
  }

  /**
   * Get the XPath to the start of the range.
   * @returns {string} the XPath
   */
  get xPathStart() {
    return this.#target.pathSelector.startPath;
  }

  /**
   * Get the XPath to the end of the range.
   * @returns {string} the XPath
   */
  get xPathEnd() {
    return this.#target.pathSelector.endPath;
  }

  /**
   * Check if the range is contiuous.
   */
  get discontinuous() {
    return this.#target.pathSelector.discontinuous;
  }

  get numberOfRanges() {
    if (!this.discontinuous) {
      return 1;
    }
    return this.#target.pathSelector.listSelector.length;
  }

  getRange(idx) {
    if (!this.discontinuous) {
      if (idx === 0) {
        return this.range;
      } else {
        console.error('Index out of bound for continuous range: ', idx);
        return null;
      }
    }
    if (idx >= this.numberOfRanges) {
      console.error('Index out of bound for discontinous range: ', idx, this.numberOfRanges);
    }
    const selector = this.#target.pathSelector.listSelector.list[idx];
    const range = getRangeToXPath(selector.startPath, selector.endPath);

    return range;
  }

  /**
   * Get the text content of the selected text.
   * @returns {string} the text content
   */
  get textContent() {
    return this.#selectedText;
  }

  /**
   * Get the current annotation style.
   * @returns {AnnotationStyle}
   */
  get style() {
    return this.#annotationStyle;
  }

  /**
   * Get the current annotation style name.
   * @returns {AnnotationStyle}
   */
  get styleName() {
    return this.#annotationStyle.constructor.styleName;
  }

  changeAnnotationStyle(newStyle) {
    let style;
    style = new newStyle(this);
    style.replace(this.#annotationStyle);
    this.#annotationStyle = style;
    // update todo highlight (case rectangle -> new bounding box)
    this.updateTodoFlag(this.#todoFlag !== null);
  }

  /**
   * Annotate the html page. Adds highlight classes and backgroundcolor to selected area.
   */
  annotateHTML() {   
    if (this.#annotationStyle.state === AnnotationStyleState.UNINITIALIZED || this.#annotationStyle.state === AnnotationStyleState.HIDDEN) {
      this.#annotationStyle.show();
    }
    // show todo if flag set
    this.updateTodoFlag();
  }

  #removeTodoFlag() {
    if (this.#todoFlag == null) {
      return;
    }
    // remove from document
    document.body.removeChild(this.#todoFlag);
    // reset internal variable
    this.#todoFlag = null;
  }

  updateTodoFlag() {
    if (this.#todoFlag) {
      this.markAsTODO(true);
    }
  }

  /**
   * Mark the annotation with TODO flag
   * @param {boolean} val
   */
  markAsTODO(val) {
    // remove old todo flag
    this.#removeTodoFlag();
    // if true: set new todo flag
    if (val) {
      let boundingRect, topAnnotation, leftAnnotation, widthAnnotation, heightAnnotation;
      let elem;
      boundingRect = this.getFirstElement().getBoundingClientRect();
      topAnnotation = boundingRect.top + window.scrollY - 5;
      leftAnnotation = boundingRect.left + window.scrollX - 5;
      widthAnnotation = boundingRect.width + 5;
      heightAnnotation = boundingRect.height + 5;

      elem = document.createElement('div');
      elem.setAttribute('class', 'todo-text-flag prevent-select');
      elem.textContent = "?";

      // set position
      elem.style.top = topAnnotation - 5 + "px";
      elem.style.left = leftAnnotation + widthAnnotation + "px";

      // save element
      this.#todoFlag = elem;
      // show in document
      document.body.appendChild(elem);
    }
  }

  /**
   * Hide the annotation highlight in the text.
   * This function grays out the highlight.
   */
  hide() {
    this.#annotationStyle.hide();
  }

  /**
   * Remove the highlights from the html text body.
   * Removes the with annotateHTML inserted changes.
   */
  remove() {
    // remove text highlight
    this.#annotationStyle.remove();
    // remove todo flag (if present)
    this.#removeTodoFlag();
  }

  /**
   * Sets the text highlight color for the selected text.
   * @param {string} color the color in a valid css format 
   */
  setTextHighlightColor(color) {
    this.#annotationStyle.color = color;
  }

  getFirstElement() {
    // console.log(this.#annotationStyle.getFirstElement());
    return this.#annotationStyle.getFirstElement();
  }

  cloneCallbacks(sel) {
    try {
      this.#mouseoverFunctions = sel.#mouseoverFunctions;
      this.#mouseoutFunctions = sel.#mouseoutFunctions;
      this.#clickFunctions = sel.#clickFunctions;
    } catch (err) {
      console.error(err);
    }
  }

  registerHoverCallback(funcOver, funcOut) {
    this.#mouseoverFunctions.push(funcOver);
    this.#mouseoutFunctions.push(funcOut);
  }

  removeHoverCallback(funcOver, funcOut) {
    let index;
    index = this.#mouseoverFunctions.indexOf(funcOver);
    if (index !== -1) {
      this.#mouseoverFunctions.splice(index, 1);
    }
    
    index = this.#mouseoutFunctions.indexOf(funcOut);
    if (index !== -1) {
      this.#mouseoutFunctions.splice(index, 1);
    }
  }

  registerClickCallback(func) {
    this.#clickFunctions.push(func);
  }

  removeClickCallback(func) {
    let index;
    index = this.#clickFunctions.indexOf(func);
    if (index === -1) {
      return;
    }
    this.#clickFunctions.splice(index, 1);
  }

  eventCallbackMouseover(event){
    this.#mouseoverFunctions.forEach(func => {
      func(event);
    });
  }

  eventCallbackMouseout(event){
    this.#mouseoutFunctions.forEach(func => {
      func(event);
    });
  }

  eventCallbackClick(event){
    // ignore event if user selects text
    if (window.getSelection().isCollapsed !== true) {
      return;
    }
    this.#clickFunctions.forEach(func => {
      func(event);
    });
  }

  setHighlightClass(name) {
    // TODO
  }
  
  resizeEvent(event) {
    this.#annotationStyle.resizeEvent(event);
    // reset todo flag
    this.updateTodoFlag();
  }
}
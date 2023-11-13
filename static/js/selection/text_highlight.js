/**
 * The text highlight.
 * This class holds information about the selected text area. It allows to retrieve the selected text and
 * to insert annotations into the html document.
 */
class TextHighlight {
  #annotationID;
  #target;
  #selectedText = null;
  #mouseoverFunctions = [];
  #mouseoutFunctions = [];
  #clickFunctions = [];
  #annotationStyle;
  #todoFlag = null;

  /**
   * @param {Range} range the range corresponding to the selection
   * @param {number} annotationID the unique annotation ID
   * @param {FragmentTarget} target the annotation target
   * @param {AnnotationStyle} style the annotation style
   */
  constructor(range, annotationID, target, style=AnnotationStyleMarker) {
    let mouseover, mouseout, click;

    this.#annotationID = annotationID;
    this.#target = target;
    // initiate selected text;
    this.#selectedText = document.createElement('div');
    this.#selectedText.setAttribute("class", "annotation-quote");
    this.#selectedText.textContent = range.toString();
    
    // create style
    this.#annotationStyle = new style(this);

    mouseover = (event) => { runtime.eventHoverOnTextHighlight(event, this.#annotationID, true);};
    mouseout = (event) => { runtime.eventHoverOnTextHighlight(event, this.#annotationID, false);};
    click = (event) => { runtime.eventClickOnTextHighlight(event, this.#annotationID);};
    
    this.#mouseoverFunctions.push(mouseover);
    this.#mouseoutFunctions.push(mouseout);
    this.#clickFunctions.push(click);
  }

  /**
   * The annotation id belonging to this highlight.
   */
  get annotationID() {
    return this.#annotationID;
  }

  /**
   * Get the corresponding range of the highlighted text area.
   * @return {Range}
   */
  get range() {
    return getRangeToXPath(this.xPathStart, this.xPathEnd);
  }

  /**
   * Get the XPath to the start of the range.
   * @returns {string}
   */
  get xPathStart() {
    return this.#target.pathSelector.startPath;
  } 

  /**
   * Get the XPath to the end of the range.
   * @returns {string}
   */
  get xPathEnd() {
    return this.#target.pathSelector.endPath;
  }

  /**
   * Check if the range is continuos.
   */
  get discontinuous() {
    return this.#target.pathSelector.discontinuous;
  }

  /**
   * Number of ranges. 1 for continuos highlights.
   */
  get numberOfRanges() {
    if (!this.discontinuous) {
      return 1;
    }
    return this.#target.pathSelector.listSelector.length;
  }

  /**
   * Get the range specified by the index (for discontinues highlights)
   * @param {number} idx the range index
   * @returns 
   */
  getRange(idx) {
    // handle continuous ranges
    if (!this.discontinuous) {
      if (idx === 0) {
        return this.range;
      } else {
        console.error('Index out of bound for continuous range: ', idx);
        return null;
      }
    }
    // handle discontinuous ranges
    if (idx >= this.numberOfRanges) {
      console.error('Index out of bound for discontinuous range: ', idx, this.numberOfRanges);
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

  /**
   * Change the annotation style.
   * Will update text highlight.
   * 
   * @param {AnnotationStyle} newStyle the new style
   */
  changeAnnotationStyle(newStyle) {
    let style;
    style = new newStyle(this);
    style.replace(this.#annotationStyle);
    this.#annotationStyle = style;
    // update todo highlight (case rectangle -> new bounding box)
    this.updateTodoFlag(this.#todoFlag !== null);
  }

  /**
   * Annotate the html page. Adds highlight classes and background color to selected area.
   */
  annotateHTML() {   
    if (this.#annotationStyle.state === AnnotationStyleState.UNINITIALIZED || this.#annotationStyle.state === AnnotationStyleState.HIDDEN) {
      this.#annotationStyle.show();
    }
    // show todo if flag set
    this.updateTodoFlag();
  }

  /**
   * Remove the todo flag.
   */
  #removeTodoFlag() {
    if (this.#todoFlag == null) {
      return;
    }
    // remove from document
    document.body.removeChild(this.#todoFlag);
    // reset internal variable
    this.#todoFlag = null;
  }

  /**
   * Mark as todo if the todo flag is set.
   */
  updateTodoFlag() {
    if (this.#todoFlag) {
      this.markAsTODO(true);
    }
  }

  /**
   * Mark the annotation with TODO flag
   * @param {boolean} val true if should be marked as todo, false to remove todo
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

  /**
   * Get the first node element of the highlight.
   * Used for the arrow calculation.
   */
  getFirstElement() {
    return this.#annotationStyle.getFirstElement();
  }

  /**
   * Clone all registered callbacks.
   * 
   * Used for the reselection of the target.
   * @param {TextHighlight} old the old text highlight the callbacks should be cloned from 
   */
  cloneCallbacks(old) {
    try {
      this.#mouseoverFunctions = old.#mouseoverFunctions;
      this.#mouseoutFunctions = old.#mouseoutFunctions;
      this.#clickFunctions = old.#clickFunctions;
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Register hover callbacks.
   * @param {*} funcOver callback for mouse over event
   * @param {*} funcOut callback for mouse out event
   */
  registerHoverCallback(funcOver, funcOut) {
    this.#mouseoverFunctions.push(funcOver);
    this.#mouseoutFunctions.push(funcOut);
  }

  /**
   * Remove registered hover callbacks.
   * @param {*} funcOver callback for mouse over event to remove
   * @param {*} funcOut callback for mouse out event to remove
   */
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

  /**
   * Register click callback.
   * @param {*} func the callback function for the click event
   */
  registerClickCallback(func) {
    this.#clickFunctions.push(func);
  }

  /**
   * Remove registered click callback.
   * @param {*} func the callback function to remove
   */
  removeClickCallback(func) {
    let index;
    index = this.#clickFunctions.indexOf(func);
    if (index === -1) {
      return;
    }
    this.#clickFunctions.splice(index, 1);
  }

  /**
   * Event handler for mouse over.
   * Calls all registered callbacks for this event. 
   * @param {Event} event the mouse over event
   */
  eventCallbackMouseover(event){
    this.#mouseoverFunctions.forEach(func => {
      func(event);
    });
  }
 
  /**
   * Event handler for mouse out.
   * Calls all registered callbacks for this event. 
   * @param {Event} event the mouse out event
   */
  eventCallbackMouseout(event){
    this.#mouseoutFunctions.forEach(func => {
      func(event);
    });
  }

  /**
   * Event handler for mouse click.
   * Calls all registered callbacks for this event. 
   * @param {Event} event the mouse click event
   */
  eventCallbackClick(event){
    // ignore event if user selects text
    if (window.getSelection().isCollapsed !== true) {
      return;
    }
    this.#clickFunctions.forEach(func => {
      func(event);
    });
  }
  
  /**
   * Event handler for resize event.
   * Update styles with fixed positions and todo flags.
   * @param {Event} event the resize event
   */
  resizeEvent(event) {
    this.#annotationStyle.resizeEvent(event);
    // reset todo flag
    this.updateTodoFlag();
  }
}
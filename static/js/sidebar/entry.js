/**
 * An concrete annotation element in the annotation sidebar.
 * The element contains a quote of the annotated text, a description field and so control structures.
 */
class AnnotationSidebarElement {
  #element;             // the html element of the entry

  #sidebarElementId;    // unique entry id
  #annotationObjectId;  // annotation object id

  #displayElement;      // the displayed entry
  #annotationBody;      // the corresponding annotation body  (js object)
  #bodyContent;         // the content of the annotation body (html element)

  #selectionPreview;    // the preview of the selected tree structure
  #selectionPreviewInitialized = false;

  #quote;               // the quoted text (target)

  #controlsEdit = null;       // controls for edit/creation state
  #controlsDisplay = null;    // controls for display state
  #controlsAdjust = null;     // controls for adjust state
  
  /* Hover and Click callbacks */
  #mouseoverFunctions = [];
  #mouseoutFunctions = [];
  #clickFunctions = [];

  /**
   * Create a new sidebar entry.
   * 
   * @param {number} annotationId the annotation id
   * @param {AnnotationBody} annotationBody the annotation body
   */
  constructor(annotationId, annotationBody) {
    // Set id
    this.#annotationObjectId = annotationId;
    this.#sidebarElementId = 'id-' + self.crypto.randomUUID();
    // Create a new element
    this.#element = document.createElement('div');
    this.#element.setAttribute('class', 'annotation-content-element');
    this.#element.setAttribute('id', 'annotationSidebarElement_' + this.annotationID);
    this.#element.setAttribute('tabindex', "-1");
    
    this.#displayElement = document.createElement('div');
    this.#displayElement.setAttribute('class', 'annotation-display-element');

    this.#element.appendChild(this.#displayElement);

    this.#quote = document.createElement('blockquote');
    // set the content of the quote
    this.setQuote();
    this.#displayElement.appendChild(this.#quote);
    // create inner layer for flip-cart
    let inner = document.createElement('div');
    inner.setAttribute('class', 'inner-layer');
    this.#displayElement.appendChild(inner);
    // init controls
    this.#createControlsState1();
    this.#createControlsState2();

    this.#annotationBody = annotationBody;
    annotationBody.registerSidebarElement(this);
    this.#bodyContent = this.#annotationBody.createElement();
    // link annotation element
    inner.appendChild(this.#bodyContent);

    // set selection adjust
    this.#controlsAdjust = this.#selectionAdjust();
    this.#controlsAdjust.style.display = "none";
    inner.appendChild(this.#controlsAdjust);

    // add Event Handler
    let eventHandler;
    // set annotation id as custom data
    this.#element.dataset.customId = this.annotationID;
    // setup event listener
    this.#element.addEventListener("click", (event) => this.eventCallbackClick(event));
    this.#element.addEventListener("mouseover", (event) => this.eventCallbackMouseover(event));
    this.#element.addEventListener("mouseout", (event) => this.eventCallbackMouseout(event));
    // default click event
    eventHandler = (event) => {
      runtime.clickOnSidebarElement(event);
    };
    this.#clickFunctions.push(eventHandler);
    // default mouse enter event
    eventHandler = (event) => {
      // change color of text highlight
      runtime.eventMouseOverSidebarElement(event, event.currentTarget.dataset.customId);
    };
    this.#mouseoverFunctions.push(eventHandler);
    // default mouse leave event
    eventHandler = (event) => {
      // change color of text highlight back
      runtime.eventMouseOutSidebarElement(event, event.currentTarget.dataset.customId);
    };
    this.#mouseoutFunctions.push(eventHandler);

    if (annotationBody.state === State.Display) {
      this.#displayElement.appendChild(this.#controlsDisplay);
    } else {
      this.#displayElement.appendChild(this.#controlsEdit);
    }
  }

  /**
   * Get the annotation id of the corresponding annotation.
   * 
   * @returns {number} the annotation id
   */
  get annotationID() {
    return this.#annotationObjectId;
  }

  /**
   * Get the save button associated with this element.
   * 
   * @returns {Node | null} the save button node or null if not present
   */
  get saveButton() {
    let id, button;
    if (this.#controlsEdit == null) {
      return null;
    }
    id = this.#sidebarElementId + '-sidebar-save-button';
    id = id.replaceAll('-', '\\-');
    button = this.#controlsEdit.querySelector("#" + id);
    return button;
  }

  /**
   * Get the cancel button for this element.
   * 
   * @returns {Node | null} the cancel button node or null if not present
   */
  get cancelButton() {
    let id, button;
    if (this.#controlsEdit == null) {
      return null;
    }
    id = this.#sidebarElementId + '-sidebar-cancel-button';
    id = id.replaceAll('-', '\\-');
    button = this.#controlsEdit.querySelector("#" + id);
    return button;
  }

  /**
   * Get value for thumb up.
   * 
   * @returns {boolean} true if thumb up, false otherwise
   */
  get thumbUp() {
    if (this.#controlsDisplay == null) {
      return false;
    }
    return this.#controlsDisplay.childNodes[0];
  }

  /**
   * Get value for thumb down.
   * 
   * @returns {boolean} true if thumb down, false otherwise
   */
  get thumbDown() {
    if (this.#controlsDisplay == null) {
      return false;
    }
    return this.#controlsDisplay.childNodes[1];
  }

  /**
   * @param {AnnotationBody} val 
   */
  set annotationBody(val) {
    let oldBody, newBody;
    // get old body
    oldBody = document.getElementById(this.#annotationBody.bodyID + "-annotation-body");
    // save new body
    this.#annotationBody = val;
    this.#annotationBody.registerSidebarElement(this);

    newBody = this.#annotationBody.createElement();
    this.#displayElement.replaceChild(newBody, oldBody);
  }

  /**
   * Register the hover event callbacks for mouse over and mouse out events.
   * 
   * @param {*} funcOver the mouse over event handler
   * @param {*} funcOut the mouse out event handler
   */
  registerHoverCallback(funcOver, funcOut) {
    this.#mouseoverFunctions.push(funcOver);
    this.#mouseoutFunctions.push(funcOut);
  }

  /**
   * Remove hover event callbacks.
   * 
   * @param {*} funcOver the mouse over event handler to remove
   * @param {*} funcOut the mouse out event handler to remove
   */
  removeHoverCallback(funcOver, funcOut) {
    let index;
    index = this.#mouseoverFunctions.indexOf(funcOver);
    this.#mouseoverFunctions.splice(index, 1);
    index = this.#mouseoutFunctions.indexOf(funcOut);
    this.#mouseoutFunctions.splice(index, 1);
  }

  /**
   * Register the click callback.
   * 
   * @param {*} func the click event handler
   */
  registerClickCallback(func) {
    this.#clickFunctions.push(func);
  }

  /**
   * Remove the click event handler
   * @param {*} func the current click event handler to remove
   */
  removeClickCallback(func) {
    let index;
    index = this.#clickFunctions.indexOf(func);
    this.#clickFunctions.splice(index, 1);
  }

  /**
   * An mouse over event occurred.
   * @param {Event} event 
   */
  eventCallbackMouseover(event){
    // call all registered event handlers
    this.#mouseoverFunctions.forEach(func => {
      func(event);
    });
  }

  /**
   * An mouse out event occurred.
   * @param {Event} event 
   */
  eventCallbackMouseout(event){
    // call all registered event handlers
    this.#mouseoutFunctions.forEach(func => {
      func(event);
    });
  }

  /**
   * An click event occurred.
   * @param {Event} event 
   */
  eventCallbackClick(event){
    // call all registered event handlers
    this.#clickFunctions.forEach(func => {
      func(event);
    });
  }

  /**
   * Highlight the sidebar entry
   * @param {number} durationMs the duration in ms
   */
  highlight(durationMs) { 
    let elem = this.#element;
    elem.classList.add('highlighted');
    setTimeout(function() {
      elem.classList.remove('highlighted')
    }, durationMs || 2500);
  }

  /**
   * Focus the entry.
   */
  focus() {
    // set focus to annotation body
    this.#element.focus();
    this.highlight();
    // TODO: maybe nicer way?
    runtime.lastFocus = this.#element;
  }

  /**
   * Informs about a target change of the corresponding annotation.
   */
  informFragmentTargetChange() {
    let preview;
    // update target tree preview
    this.#selectionPreview.replaceChildren();
    preview = this.#getCurrentSelectionPreview();
    this.#selectionPreview.appendChild(preview);
    // update quote
    this.setQuote();
  }

  /**
   * Create a button with an icon, label and event handler.
   * 
   * @param {string} iconContent the name of the icon (google icon)
   * @param {string} labelContent the label content
   * @param {*} callback the event handler for a button click
   * @returns {HTMLDivElement} a new button
   */
  #abstractButtonElement(iconContent, labelContent, callback) {
    let wrapper, button, icon, label, id;

    // set unique button id
    id = "id-" + self.crypto.randomUUID();

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-menu-selection');

    button = document.createElement('button');
    button.setAttribute('id', id);
    button.setAttribute('class', 'annotation-menu-selection-button');

    // set icon
    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined');
    icon.textContent = iconContent;
    icon.style.padding = "0px";
    button.appendChild(icon);
    // set callback
    if (callback) {
      button.addEventListener('click', callback);
    }
    // set label
    label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = labelContent;
    label.style.marginRight = "10px";
    label.appendChild(button);
    wrapper.appendChild(label);
    wrapper.appendChild(button);
    return wrapper;
  }

  /**
   * Button to reselect the target fragment.
   * 
   * @returns {HTMLDivElement} button
   */
  #reselectText() {
    let iconContent, labelContent, callback;

    iconContent = "select";
    labelContent = "Reselect text fragment:";
    callback = event => runtime.reselectTextFragment(this.#annotationObjectId);
    return this.#abstractButtonElement(iconContent, labelContent, callback);
  }

  /**
   * Button to add discontinuous range.
   * 
   * @returns {HTMLDivElement} button
   */
  #addDiscontinuity() {
    let iconContent, labelContent, callback;

    iconContent = "text_select_start";
    labelContent = "Add a discontinued range:";
    callback = event => runtime.addDiscontinuesTextFragment(this.#annotationObjectId)
    return this.#abstractButtonElement(iconContent, labelContent, callback);
  }

  /**
   * Button to adjust the shift the left border (start) of annotation target range to the left.
   * 
   * @returns {HTMLDivElement} button
   */
  #adjustLeftBorder1() {
    let wrapper, button, iconContent, labelContent;

    iconContent = "text_select_jump_to_beginning";
    labelContent = "Increase left border";
    wrapper = this.#abstractButtonElement(iconContent, labelContent, null);
    button = wrapper.getElementsByTagName('button')[0];
    button.onclick = () => runtime.adjustSelection(null, this.annotationID, "start", "left");
    return wrapper
  }

  /**
   * Button to adjust the shift the left border (start) of annotation target range to the right.
   * 
   * @returns {HTMLDivElement} button
   */
  #adjustLeftBorder2() {
    let wrapper, button, iconContent, labelContent;

    iconContent = "text_select_move_forward_character";
    labelContent = "Decrease left border";
    wrapper = this.#abstractButtonElement(iconContent, labelContent, null);
    button = wrapper.getElementsByTagName('button')[0];
    button.onclick = () => runtime.adjustSelection(null, this.annotationID, "start", "right");
    return wrapper
  }

  /**
   * Button to adjust the shift the right border (end) of annotation target range to the left.
   * 
   * @returns {HTMLDivElement} button
   */
  #adjustRightBorder1() {
    let wrapper, button, iconContent, labelContent;

    iconContent = "text_select_jump_to_end";
    labelContent = "Increase right border";
    wrapper = this.#abstractButtonElement(iconContent, labelContent, null);
    button = wrapper.getElementsByTagName('button')[0];
    button.onclick = () => runtime.adjustSelection(null, this.annotationID, "end", "right");
    return wrapper
  }

  /**
   * Button to adjust the shift the right border (end) of annotation target range to the right.
   * 
   * @returns {HTMLDivElement} button
   */
  #adjustRightBorder2() {
    let wrapper, button, iconContent, labelContent;

    iconContent = "text_select_move_back_character";
    labelContent = "Decrease right border";
    wrapper = this.#abstractButtonElement(iconContent, labelContent, null);
    button = wrapper.getElementsByTagName('button')[0];
    button.onclick = () => runtime.adjustSelection(null, this.annotationID, "end", "left");
    return wrapper
  }

  /**
   * Iterate over nodes to build html tree for target preview
   * @param {Node} node the current node
   * @param {number} positionFlag number flag that indicates if before (-1), inside (0), after (1) the selected range
   * @param {Range} range the selected range
   * @param {Node} startNodeRange the start node of the range
   * @param {Node} endNodeRange the end node of the range
   * @param {number} startOffset start offset of range
   * @param {number} endOffset end offset of range
   * @param {boolean} startAfterNodeFlag true if start XPath is: "after-node(startNodeRange)"
   * @param {boolean} endAfterNodeFlag true if end XPath is: "after-node(endNodeRange)"
   * @param {HTMLSpanElement} prev1 nodes in tree that are before the selected target
   * @param {HTMLSpanElement} prev2 nodes in tree that are inside the selected target
   * @param {HTMLSpanElement} prev3 nodes in tree that are after the selected target
   * @returns {number} the current position flag 
   */
  #recursiveNodeIteration(node, positionFlag, range, startNodeRange, endNodeRange, startOffset, endOffset, startAfterNodeFlag, endAfterNodeFlag, prev1, prev2, prev3) {
    let currentNodeIsStart, currentNodeIsEnd;
    // base case (but should not appear)
    if (node === undefined) {
      return positionFlag;
    }

    currentNodeIsStart = false;
    currentNodeIsEnd = false;

    // compare current node to range
    if (node.isSameNode(startNodeRange) && node.isSameNode(endNodeRange)) {
      if (node.nodeType !== Node.TEXT_NODE) {
        if (endAfterNodeFlag === true) {
          prev2.textContent += "<" + node.tagName.toLowerCase() + ">";
          positionFlag = 0;
          currentNodeIsEnd = true;
        } else {
          console.warn('Start and End Node should not be the same');
        }        
      } else {
        prev1.textContent += node.textContent.substring(0, startOffset);
        prev2.textContent += node.textContent.substring(startOffset, endOffset);
        prev3.textContent += node.textContent.substring(endOffset);
        // indicate that we are currently outside the selected range
        positionFlag = 1;
      }
    } else if (node.isSameNode(startNodeRange)) {
      if (node.nodeType === Node.TEXT_NODE) {
        prev1.textContent += node.textContent.substring(0, startOffset);
        prev2.textContent += node.textContent.substring(startOffset);
        // indicate that we are currently inside the selected range
        positionFlag = 0;
      } else {
        if (startAfterNodeFlag) {
          if (node.tagName.toUpperCase() !== "ANNOTATION-HIGHLIGHT") {
            prev1.textContent += "<" + node.tagName.toLowerCase() + ">";
          }
          currentNodeIsStart = true;
        } else {
          if (node.tagName.toUpperCase() !== "ANNOTATION-HIGHLIGHT") {
            prev2.textContent += "<" + node.tagName.toLowerCase() + ">";
          }
          // indicate that we are currently inside the selected range
          positionFlag = 0;
        } 
      }
    } else if (node.isSameNode(endNodeRange)) {
      if (node.nodeType === Node.TEXT_NODE) {
        prev2.textContent += node.textContent.substring(0, endOffset);
        prev3.textContent += node.textContent.substring(endOffset);
        positionFlag = 1;
      } else if (endAfterNodeFlag) {
        if (node.tagName.toUpperCase() !== "ANNOTATION-HIGHLIGHT") {
          if (positionFlag === 0) {
            prev2.textContent += "<" + node.tagName.toLowerCase() + ">";
          } else {
            prev1.textContent += "<" + node.tagName.toLowerCase() + ">";
          }
        }
        currentNodeIsEnd = true;
      } else {
        if (node.tagName.toUpperCase() !== "ANNOTATION-HIGHLIGHT") {
          prev3.textContent += "<" + node.tagName.toLowerCase() + ">";
        }
        positionFlag = 1;
      }
    } else if (!node.tagName || node.tagName.toUpperCase() !== "ANNOTATION-HIGHLIGHT") {
      // skip "ANNOTATION-HIGHLIGHT" elements in preview as they do not appear in the original document
      let prevText;
      // get the preview text of the current node
      if (node.nodeType === Node.TEXT_NODE) {
        prevText = node.textContent;
      } else {
        prevText = "<" + node.tagName.toLowerCase() + ">";
      }
      // set text to correct preview object
      switch (positionFlag) {
        case -1:
          prev1.textContent += prevText;
          break;
        case 0:
          prev2.textContent += prevText;
          break;
        case 1:
          prev3.textContent += prevText;
          break;
      }
    }

    // recursive call
    if (node.hasChildNodes()) {
      let chList = Array.from(node.childNodes);
      // depth first search
      let breakNextIteration = false;
      for (let ch of chList) {
        breakNextIteration = positionFlag;
        positionFlag = this.#recursiveNodeIteration(ch, positionFlag, range, startNodeRange, endNodeRange, startOffset, endOffset, startAfterNodeFlag, endAfterNodeFlag, prev1, prev2, prev3);
        if (breakNextIteration === 1) {
          // TODO: performance
          break;
        }
      }
    }

    // set closing tag
    if (node.nodeType !== Node.TEXT_NODE && node.tagName && node.tagName.toUpperCase() !== "ANNOTATION-HIGHLIGHT") {
       // set text to correct preview object
       switch (positionFlag) {
        case -1:
          prev1.textContent += "</" + node.tagName.toLowerCase() + ">";
          break;
        case 0:
          prev2.textContent += "</" + node.tagName.toLowerCase() + ">";
          break;
        case 1:
          prev3.textContent += "</" + node.tagName.toLowerCase() + ">";
          break;
      }
    }
    
    // handle "after-node" xpath
    if (currentNodeIsStart) {
      positionFlag = 0;
    }
    if (currentNodeIsEnd) {
      positionFlag = 1;
    }

    return positionFlag;
  }

  /**
   * Returns a preview of the currently selected html elements.
   * @returns {HTMLDivElement} the preview element
   */
  #getCurrentSelectionPreview() {
    let wrapper, prev1, prev2, prev3;
    let xPathStart, xPathEnd;
    let startNodeRange, endNodeRange, startAfterNodeFlag, endAfterNodeFlag, startOffset, endOffset;
    let annotationTarget;
    let range, outer;

    // prepare preview spans
    wrapper = document.createElement('div');
    prev1 = document.createElement('span');
    prev2 = document.createElement('span');
    prev3 = document.createElement('span');
    wrapper.appendChild(prev1);
    wrapper.appendChild(prev2);
    wrapper.appendChild(prev3);

    prev1.style.color = "lightgray";
    prev3.style.color = "lightgray";
    
    // get range to current target
    annotationTarget = runtime.getAnnotationById(this.#annotationObjectId).target.pathSelector;
    xPathStart = annotationTarget.startPath;
    xPathEnd = annotationTarget.endPath;

    range = getRangeToXPath(xPathStart, xPathEnd);

    // get node that contains full target
    outer = range.commonAncestorContainer.parentElement;
    while (outer !== null && outer.tagName.toUpperCase() === "ANNOTATION-HIGHLIGHT") {
      outer = outer.parentElement;
    }

    // set node after flags
    startAfterNodeFlag = false;
    endAfterNodeFlag = false;

    startOffset = range.startOffset;
    endOffset = range.endOffset;

    // get start node of range
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      startNodeRange = range.startContainer;
    } else {
      // use childNodes (not .children) to get all Nodes
      if (range.startOffset < range.startContainer.childNodes.length) {
        startNodeRange = range.startContainer.childNodes[range.startOffset];
      } else {
        startNodeRange = range.startContainer.childNodes[range.startOffset - 1];
        startAfterNodeFlag = true;
      }
      startOffset = 0;
    }
    // get end node of range
    if (range.endContainer.nodeType === Node.TEXT_NODE) {
      endNodeRange = range.endContainer;
    } else {
      // use childNodes (not .children) to get all Nodes
      if (range.endOffset < range.endContainer.childNodes.length) {
        endNodeRange = range.endContainer.childNodes[range.endOffset];
      } else {
        endNodeRange = range.endContainer.childNodes[range.endOffset - 1];
        endAfterNodeFlag = true;
      }
      endOffset = 0;
    }
    // create preview
    this.#recursiveNodeIteration(outer, -1, range, startNodeRange, endNodeRange, startOffset, endOffset, startAfterNodeFlag, endAfterNodeFlag, prev1, prev2, prev3);

    // hide parts of string if to long
    if (prev1.textContent.length > 15) {
      prev1.textContent = prev1.textContent.slice(0, 5) + "..." + prev1.textContent.slice(-5);
    }
    if (prev2.textContent.length > 25) {
      prev2.textContent = prev2.textContent.slice(0, 5) + "..." + prev2.textContent.slice(-5);
    }
    if (prev3.textContent.length > 15) {
      prev3.textContent = prev3.textContent.slice(0, 5) + "..." + prev3.textContent.slice(-5);
    }
    return wrapper;
  }

  /**
   * The adjustment controls for the target.
   * @returns {HTMLDivElement} the adjustment screen
   */
  #selectionAdjust() {
    let wrapper, p, hline;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', "annotation-selection");

    hline = document.createElement('div');
    hline.setAttribute('class', 'hline');
    wrapper.appendChild(hline);

    // don't calculate now for performance reasons (on large imports)
    this.#selectionPreview = document.createElement('div');
    this.#selectionPreviewInitialized = false;
    wrapper.appendChild(this.#selectionPreview);

    p = document.createElement('p');
    p.textContent = 'Update Selection:';
    p.style.fontWeight = "bold";
    wrapper.appendChild(p);

    wrapper.appendChild(this.#reselectText());
    wrapper.appendChild(this.#addDiscontinuity());

    p = document.createElement('p');
    p.textContent = 'Adjust Selection:';
    p.style.fontWeight = "bold";
    wrapper.appendChild(p);

    p = document.createElement('p');
    p.textContent = '• Left Border:';
    p.style.fontWeight = "bold";
    p.style.fontSize = "14px";
    wrapper.appendChild(p);

    wrapper.appendChild(this.#adjustLeftBorder1());
    wrapper.appendChild(this.#adjustLeftBorder2());

    p = document.createElement('p');
    p.textContent = '• Right Border:';
    p.style.fontWeight = "bold";
    p.style.fontSize = "14px";
    wrapper.appendChild(p);

    wrapper.appendChild(this.#adjustRightBorder1());
    wrapper.appendChild(this.#adjustRightBorder2());

    hline = document.createElement('div');
    hline.style.marginTop = "10px";
    hline.setAttribute('class', 'hline');
    wrapper.appendChild(hline);

    return wrapper;
  }

  /**
   * Toggle between the body and adjustment screen.
   * @param {Event} event the click event on the button
   */
  #toggleSelectionAdjust(event) {
    if (this.#controlsAdjust.style.display === "block") {
      // case: current screen is adjust -> switch to body
      this.#controlsAdjust.style.display = "none";
      this.#bodyContent.style.display = "block";
      event.target.textContent = "Adjust";
    } else {
      // case: current screen is body -> switch to adjust
      this.#controlsAdjust.style.display = "block";
      if (this.#selectionPreviewInitialized === false) {
        // initialize preview
        let preview;
        this.#selectionPreview.replaceChildren();
        preview = this.#getCurrentSelectionPreview();
        this.#selectionPreview.appendChild(preview);
        this.#selectionPreviewInitialized = true;
      }
      this.#bodyContent.style.display = "none";
      event.target.textContent = "Body";
    }
    
  }

  /**
   * Create the save button and add event listener.
   * 
   * @returns {Node} save button 
   */
  #createSaveButton() {
    let saveButton;
    saveButton = document.createElement('button');
    saveButton.setAttribute('class', 'control-button-save save-annotation-creation');
    saveButton.setAttribute('id', this.#sidebarElementId + '-sidebar-save-button');
    saveButton.textContent = 'Save';
    saveButton.addEventListener('click', (event) => ((arg) => {
      runtime.saveAnnotationEvent(event, arg);
    })(this.annotationID));
    saveButton.disabled = true;

    return saveButton;
  }

  /**
   * Create the cancel button for element creation.
   * 
   * @returns {Node} cancel button 
   */
  #createCancelButtonCreation() {
    let cancelButton;
    cancelButton = document.createElement('button');
    cancelButton.setAttribute('class', 'control-button-cancel creation');
    cancelButton.setAttribute('id', this.#sidebarElementId + '-sidebar-cancel-button');
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', event => runtime.deleteAnnotationEvent(event, this.annotationID));
  
    return cancelButton;
  }

  /**
   * Create the cancel button for element edit.
   * 
   * @returns {Node} cancel button 
   */
  #createCancelButtonEdit() {
    let cancelButton;
    cancelButton = document.createElement('button');
    cancelButton.setAttribute('class', 'control-button-cancel edit');
    cancelButton.setAttribute('id', this.#sidebarElementId + '-sidebar-cancel-button');
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', event => this.cancelEdit());
  
    return cancelButton;
  }

  /**
   * Create the adjust button and add event listener.
   * 
   * @returns {Node} adjust selection button 
   */
  #adjustButton() {
    let adjustButton;
    adjustButton = document.createElement('button');
    adjustButton.setAttribute('class', 'control-button-adjust');
    adjustButton.setAttribute('id', this.bodyID + '-sidebar-adjust-button');
    adjustButton.textContent = 'Adjust';
    adjustButton.addEventListener('click', event => this.#toggleSelectionAdjust(event));
    return adjustButton;
  }

  /**
   * Create the control structure for the first state (save and cancel button)
   * 
   * @returns {Node} control structure
   */
  #createControlsState1() {
    let div;
    let save, adjust, cancel;
    // create control element
    this.#controlsEdit = document.createElement('div');
    this.#controlsEdit.setAttribute('class', 'control-group');
    // create save  and cancel
    div = document.createElement('div');
    save = this.#createSaveButton();
    adjust = this.#adjustButton();
    cancel = this.#createCancelButtonCreation();
    // link control elements
    div.appendChild(save);
    div.appendChild(adjust);
    div.appendChild(cancel);
    this.#controlsEdit.appendChild(div);
  }

  /**
   * Create the thumbUp button.
   * 
   * @returns {Node} thumb up
   */
  #createThumbUp() {
    let thumbUp;
    thumbUp = document.createElement('i');
    thumbUp.setAttribute('class', 'material-symbols-outlined material-symbols-hover');
    thumbUp.textContent = "thumb_up";
    thumbUp.addEventListener("click", function (event) {
      if (!event.target.classList.contains('thumb-up')) {
        event.target.classList.add('thumb-up');
        event.target.nextSibling.classList.remove('thumb-down');
      } else {
        event.target.classList.remove('thumb-up');
      }
  	});
    return thumbUp;
  }

  /**
   * Create the thumbDown button.
   * 
   * @returns {Node} thumb down
   */
  #createThumbDown() {
    let thumbDown;
    thumbDown = document.createElement('i');
    thumbDown.setAttribute('class', 'material-symbols-outlined material-symbols-hover');
    thumbDown.textContent = "thumb_down";
    thumbDown.addEventListener("click", function (event) {
      if (!event.target.classList.contains('thumb-down')) {
        event.target.classList.add('thumb-down');
        event.target.previousSibling.classList.remove('thumb-up');
      } else {
        event.target.classList.remove('thumb-down');
      }
    });
    return thumbDown;
  }

  /**
   * Create the edit button.
   * 
   * @returns {Node} edit
   */
  #createEdit() {
    let edit;
    edit = document.createElement('i');
    edit.setAttribute('class', 'material-symbols-outlined material-symbols-hover');
    edit.style.float = "right";
    edit.textContent = "edit";
    edit.addEventListener("click", (event) => ((arg) => {
      runtime.editAnnotation(event, arg);
    })(this.annotationID));
    return edit;
  }

  /**
   * Create the delete button.
   * 
   * @returns {Node} delete
   */
  #createDelete() {
    let del;
    del = document.createElement('i');
    del.setAttribute('class', 'material-symbols-outlined material-symbols-hover');
    del.style.float = "right";
    del.textContent = "delete";
    del.addEventListener("click", event => runtime.deleteAnnotationEvent(event, this.annotationID));
    return del;
  }

  /**
   * Create the controls for state 2 (reactions and edit/delete)
   * 
   * @returns {Node} control structure
   */
  #createControlsState2() {
    let thumbUp, thumbDown, edit, del;
    // Surrounding div container
    this.#controlsDisplay = document.createElement('div');
    this.#controlsDisplay.setAttribute('class', 'annotation-options prevent-select');
    
    thumbUp = this.#createThumbUp();
    thumbDown = this.#createThumbDown();
    edit = this.#createEdit();
    del = this.#createDelete();
    
    this.#controlsDisplay.appendChild(thumbUp);
    this.#controlsDisplay.appendChild(thumbDown);
    this.#controlsDisplay.appendChild(del);
    this.#controlsDisplay.appendChild(edit);
  }

  /**
   * Set the quoted text content
   */
  setQuote() {
    let quote;
    // clear old quote content
    this.#quote.replaceChildren();
    // get text to quote
    quote = runtime.getAnnotationById(this.#annotationObjectId).text;
    // show in entry
    this.#quote.appendChild(quote);

    // show only first 100 character
    if (quote.textContent.length > 100) {
      // set hight to hide part of quote
      quote.style.height = "3em";
      // add control to show more
      let more = document.createElement('div');
      more.setAttribute('class', 'annotation-quote-more');
      more.textContent = "More";
      more.addEventListener('click', (event) => {
        if (event.target.textContent === 'More') {
          event.target.parentElement.firstChild.style.removeProperty('height');
          event.target.textContent = 'Less';
        } else {
          event.target.parentElement.firstChild.style.height = "3em";
          event.target.textContent = 'More';
        }
      });
      this.#quote.appendChild(more);
    } else {
      quote.style.removeProperty('height');
    }
  }

  /**
   * Removes this element.
   */
  remove() {
    this.#element.remove();
  }

  /**
   * Get the element node connected with this class.
   * 
   * @returns {Node} the element node
   */
  toNode() {
    return this.#element;
  }

  /**
   * Saves the user description of the element and adds reactions (thumbup / thumbdown)
   */
  save() {
    // reset adjust button
    document.getElementById(this.bodyID + '-sidebar-adjust-button').textContent = "Adjust";
    // show body
    this.#controlsAdjust.style.display = "none";
    this.#bodyContent.style.display = "block";

    this.#annotationBody.save();
    // Create new annotation body and replace with old
    this.#annotationBody.createElement();
    // Add new Icons for Delete, Edit, Vote
    this.#controlsEdit.parentNode.replaceChild(this.#controlsDisplay, this.#controlsEdit);
    runtime.eventMouseOutSidebarElement(null, this.#annotationObjectId);
  }

  /**
   * Allows the user to edit the description of the element.
   */
  edit() {
    // change body to edit state
    this.#annotationBody.edit();
    // Create new annotation body and replace with old
    this.#annotationBody.createElement();
  
    // replace control elements
    this.#controlsDisplay.parentNode.replaceChild(this.#controlsEdit, this.#controlsDisplay);
    // change class of cancel so element is not deleted on edit cancel
    const cancel = this.cancelButton;
    if (this.#annotationBody.validState == false && cancel.matches('.edit')) {
      cancel.parentElement.replaceChild(this.#createCancelButtonCreation(), cancel);
    }
    else if (this.#annotationBody.validState == true && cancel.matches('.creation')) {
      cancel.parentElement.replaceChild(this.#createCancelButtonEdit(), cancel);
    }
  }

  /**
   * Cancel the edit process
   */
  cancelEdit() {
    // cancel adjust selection (if present)
    runtime.cancelReselect();
    runtime.cancelAddDicontinuity();
    // show body
    this.#controlsAdjust.style.display = "none";
    this.#bodyContent.style.display = "block";
    // Set state to save
    this.#annotationBody.cancel();
    // Create new annotation body and replace with old
    this.#annotationBody.createElement();
    // replace control elements
    this.#controlsEdit.parentNode.replaceChild(this.#controlsDisplay, this.#controlsEdit);
    runtime.eventMouseOutSidebarElement(null, this.#annotationObjectId);
  }

  /**
   * Reset the entry.
   */
  resetAnnotation() {
    const cancel = this.cancelButton;
    cancel.parentElement.replaceChild(this.#createCancelButtonCreation(), cancel);
    this.saveEnabled(false);
  }

  /**
   * Adds GUI highlight.
   * Adds a yellow border and changes background of element.
   */
  addGUIHighlight() {
    this.#element.style.border = "solid 3px #FFFFAA";
    this.#element.style.backgroundColor = "#FFFFFA";
  }

  /**
   * Removes GUI highlight.
   * Removes the border (sets it to white to don't change size of div) and changes background to white.
   */
  removeGUIHighlight() {
    this.#element.style.border = "solid 3px #FFFFFF";
    this.#element.style.backgroundColor = "#FFFFFF";
  }

  /**
   * Hides the element from the sidebar
   */
  hide() {
    this.#displayElement.style.display = "none";
  }

  /**
   * Shows the element on the sidebar
   */
  unhide() {
    this.#displayElement.style.display = "block";
  }

  /**
   * The annotation body has changed.
   * Enable 'Save' Button if not already enabled.
   * @param {boolean} val indicates if save should be enabled
   */
  saveEnabled(val) {
    this.saveButton.disabled = !val;
  }
}
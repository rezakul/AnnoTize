
/**
 * Annotation object class.
 * This class holds information about the annotated class and structures to work with it.
 */
class AnnotationObject {
  #id;
  #target;
  #selection;
  #annotationBody;
  #creator;
  #hidden = false;
  #visibility = true;
  #flagTODO = false;

  /**
   * @param {string} id a unique id for this class object
   * @param {FragmentTarget} target the annotation target
   * @param {SelectionObject} selection the corresponding selection object holding the selected text
   * @param {AnnotationBody} body the annotation body
   * @param {string} creator the creator of the annotation
   */
  constructor(id, target, selection, body, creator) {
    this.#id = id;
    this.#target = target;
    this.#selection = selection;
    // set and register annotation body
    this.annotationBody = body;
    this.#creator = creator;
  }

  /**
   * The unique annotation id for this annotation.
   * 
   * @returns {number} annotation id
   */
    get id() {
      return this.#id;
    }

  /**
   * The unique annotation id for this annotation. (legacy)
   * 
   * @returns {number} annotation id
   */
  get annotationId() {
    return this.#id;
  }

  /**
   * The annotated text content.
   * 
   * @returns {string} annotated text
   */
  get text() {
    return this.#selection.textContent;
  }

  /**
   * Get the first annotated element in the text
   */
  get firstTextElement() {
    return this.#selection.getFirstElement();
  }

  get visibility() {
    return this.#visibility && this.#annotationBody.visibility;
  }

  get annotationType() {
    return this.#annotationBody.constructor.name;
  }

  get conceptName() {
    return this.#annotationBody.conceptName;
  }

  get annotationBody() {
    return this.#annotationBody;
  }

  get body() {
    return this.#annotationBody;
  }

  get sidebarElement() {
    return runtime.sidebar.getElement(this.id);
  }

  /**
   * Set a new annotation body
   * @param {AnnotationBody} val the new body
   */
  set annotationBody(val) {
      this.#annotationBody = val;
      if (val) {
        val.registerAnnotation(this);
      }
  }

  get styleClass() {
    return runtime.getStyleForName(this.#selection.styleName);
  }

  get styleClassName() {
    return this.#selection.styleName;
  }

  /**
   * The FragmentTarget of the annotation.
   */
  get target() {
    return this.#target;
  }

  /**
   * The creator of this annotation.
   */
  get creator() {
    return this.#creator;
  }

  get color() {
    return this.#annotationBody.color;
  }

  get flagTODO() {
    return this.#flagTODO;
  }

  set flagTODO(val) {
    this.#selection.markAsTODO(val);
    this.#flagTODO = val;
  }

  #replaceSelection(newSection) {
    newSection.cloneCallbacks(this.#selection);
    this.#selection = newSection;
  }

  /**
   * Show the annotation in the html side.
   * Adds the annotation element to the sidebar and highlights the text.
   * @param {Boolean} silent add the element silent (i.e. not open sidebar / focus)
   */
  show(silent=false) {
    this.#selection.annotateHTML();
    runtime.sidebar.addElement(this.id, this.text, this.#annotationBody, silent);
    this.#selection.setTextHighlightColor(this.#annotationBody.color);
    this.#selection.setHighlightClass(this.#annotationBody.getHighlightClass());
  }

  showSelection() {
    this.#selection.annotateHTML();
  }

  /**
   * Remove this annotation.
   * Removes the annotation from the sidebar and reverts the highlighted text to normal.
   */
  remove() {
    this.#selection.remove();
    runtime.sidebar.remove(this.id);
    this.#annotationBody.remove();
  }

  removeSelection() {
    this.#selection.remove();
  }

  /**
   * Export this annotation to json.
   * 
   * @param {any} key a key may given by JSON.stringify()
   * 
   * @returns {object} (JSON) stringifyable object
   */
  toJSON(key) {
    let json = {};

    // create json as javascript object
    json.type = "Annotation";
    json.id = this.id;
    json.target = this.target.id;
    // for body object toJSON will be called by JSON.stringify()
    json.body = this.body;
    json.creator = this.creator;
    
    return json;
  }

  /**
   * Applies the filter to this annotation.
   * If the filter does not complie with the annotation hide this annotation.
   * @param {Filter} filter 
   */
  filter(filter) {
    if (filter.complies(this.#annotationBody)) {
      this.hide();
    }
  }

  /**
   * Update the visibility of the annotation in the sidebar and textSegement.
   */
  updateVisibility() {
    if (this.visibility === false && this.#hidden === false) {
      // hide the element
      this.hide();
    } else if (this.visibility === true && this.#hidden === true) {
      this.unhide();
    }
  }

  /**
   * Update the color of the annotation.
   * May not result in any change.
   */
  updateColor(color, distributor) {
    if (!this.#hidden) {
      this.#annotationBody.updateColor(color, distributor);
      // use the body color instead of new color so body can overwrite change
      this.#selection.setTextHighlightColor(this.#annotationBody.color);
    }
  }


  /**
   * Hide this annotation from the user
   */
  hide() {
    runtime.sidebar.hide(this.id);
    this.#selection.hide();
    this.#hidden = true;
  }

  /**
   * Unhide this annotation from the user
   */
  unhide() {
    runtime.sidebar.unhide(this.id);
    this.#selection.setTextHighlightColor(this.#annotationBody.color);
    this.#hidden = false;
  }

  /**
   * Highlights / removes highligt in text area.
   * @param {boolean} highlight indicates if the text should be highlighted or not 
   */
  highlightText(highlight) {
    if (highlight) {
      this.#selection.setTextHighlightColor(AnnotationColors.HIGHLIGHT);
    } else if (this.#hidden){
      this.#selection.setTextHighlightColor(AnnotationColors.HIDDEN);
    } else {
      this.#selection.setTextHighlightColor(this.#annotationBody.color);
    }
  }

  registerTextHoverCallback(funcOver, funcOut) {
    this.#selection.registerHoverCallback(funcOver, funcOut);
  }

  removeTextHoverCallback(funcOver, funcOut) {
    this.#selection.removeHoverCallback(funcOver, funcOut);
  }

  registerTextClickCallback(func) {
    this.#selection.registerClickCallback(func);
  }

  removeTextClickCallback(func) {
    this.#selection.removeClickCallback(func);
  }

  registerSidebarHoverCallback(funcOver, funcOut) {
    runtime.sidebar.getElement(this.id).registerHoverCallback(funcOver, funcOut);
  }

  removeSidebarHoverCallback(funcOver, funcOut) {
    runtime.sidebar.getElement(this.id).removeHoverCallback(funcOver, funcOut);
  }

  registerSidebarClickCallback(func) {
    runtime.sidebar.getElement(this.id).registerClickCallback(func);
  }

  removeSidebarClickCallback(func) {
    runtime.sidebar.getElement(this.id).removeClickCallback(func);
  }


  /**
   * Scroll this annotation into view
  */
  scrollTo() {
    this.firstTextElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });
  }

  /**
   * Set a new TargetFragment.
   *
   * @param {FragmentTarget} fragment the new fragment target
   */
  setFragmentTarget(fragment) {
    let range, selection;
    // save new target fragment
    this.#target = fragment;
    this.sidebarElement.informFragmentTargetChange();
    // create range
    range = getRangeToXPath(fragment.pathSelector.startPath, fragment.pathSelector.endPath);
    // remove old selection
    if (this.#selection.style.state === AnnotationStyleState.SHOWN) {
      this.#selection.remove();
    }
    // set new selection
    selection = new SelectionObject(range, this.id, fragment, this.styleClass);
    this.#replaceSelection(selection);
    // show text highlight
    this.#selection.annotateHTML();
    // set todo flag
    this.#selection.markAsTODO(this.#flagTODO);
    this.#selection.setTextHighlightColor(this.#annotationBody.color);
    // inform body about new fragment-target
    this.#annotationBody.informFragmentTargetChange();
  }

  /**
   * Adjust the annotation border.
   * 
   * @param {string} border the border to adjust (start or end)
   * @param {string} direction the direction to adjust (left or right)
   */
  adjustSelection(border, direction) {
    if (border === 'start' && direction === 'left') {
      this.adjustSelectionStartLeft();
    } else if (border === 'start' && direction === 'right') {
      this.adjustSelectionStartRight();
    } else if (border === 'end' && direction === 'left') {
      this.adjustSelectionEndLeft();
    } else if (border === 'end' && direction === 'right') {
      this.adjustSelectionEndRight();
    } else {
      console.warn('Unknown parameter: ' + border + ", " + direction);
    }
  }

  #createNewFragmentTargetFromRange(range) {
    let uniqueIds, xPathStart, xPathEnd, pathSelector, selector, fragmentTarget;

    uniqueIds = runtime.getNewUniqueIds();
    xPathStart = getXPathToNode(range.startContainer, range.startOffset, true);
    xPathEnd = getXPathToNode(range.endContainer, range.endOffset, false);
    pathSelector = new PathSelector(xPathStart, xPathEnd);
    selector = new Map();
    selector.set("PathSelector", pathSelector);
    // create the target
    fragmentTarget = new FragmentTarget(uniqueIds.get("target"), runtime.source, selector);
    return fragmentTarget;
  }

  #createNewFragmentTargetFromPath(xPathStart, xPathEnd) {
    let uniqueIds, pathSelector, selector, fragmentTarget;

    uniqueIds = runtime.getNewUniqueIds();
    pathSelector = new PathSelector(xPathStart, xPathEnd);
    selector = new Map();
    selector.set("PathSelector", pathSelector);
    // create the target
    fragmentTarget = new FragmentTarget(uniqueIds.get("target"), runtime.source, selector);
    return fragmentTarget;
  }

  #calculateCustomOffset(node, offset) {
    let result = offset;
    let parent;
  
    // offset will only be different if node is a text node or annotation-highlight node
    if (node.nodeType !== Node.TEXT_NODE && !(node.nodeType === Node.ELEMENT_NODE && node.tagName === "ANNOTATION-HIGHLIGHT")) {
      return offset;
    }
  
    parent = node.parentNode;
    do {
      // add all text content in nodes before to offset
      for (let i = 0; i < parent.childNodes.length; ++i) {
        let textLen;
        let child = parent.childNodes[i];
        if (child.isSameNode(node)) {
          break;
        }
        textLen = Array.from(child.textContent).length;
        result += textLen;
      }
      // add text content length as long as inside annotation element
      node = parent;
      parent = parent.parentNode;
    } while (node.nodeType === 1 && node.tagName === "ANNOTATION-HIGHLIGHT");
  
    return result;
  }

  #createXPathCharOffset(node, offset) {
    let path, charOffset;
    // create new xpath
    path = makeXPath(node);
    // pretty print
    path = prettyPrintXPath(path);
    // get char offset of whole node
    charOffset = this.#calculateCustomOffset(node, offset);
    // into custom format
    path = "char(" + path + "," + charOffset + ")";

    return path;
  }

  #createXPathNode(node) {
    let path;
    // create new xpath
    path = makeXPath(node);
    // pretty print
    path = prettyPrintXPath(path);
    // into custom format
    path = "node(" + path + ")";

    return path;
  }

  #createXPathAfterNode(node) {
    let path;
    // create new xpath
    path = makeXPath(node);
    // pretty print
    path = prettyPrintXPath(path);
    // into custom format
    path = "after-node(" + path + ")";

    return path;
  }

  #realPreviousSibling(node) {
    let sibling;
    // get the previous sibling
    sibling = node.previousSibling;
    while (sibling && !/\S/.test(sibling.nodeValue)) {
      // skip empty siblings -> artefact from html parser
      sibling = sibling.previousSibling;
    }
    while (sibling && sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === "ANNOTATION-HIGHLIGHT") {
      sibling = sibling.lastChild;
    }
    return sibling;
  }

  #realNextSibling(node) {
    let sibling;
    // get the previous sibling
    sibling = node.nextSibling;
    while (sibling && !/\S/.test(sibling.nodeValue)) {
      // skip empty siblings -> artefact from html parser
      sibling = sibling.nextSibling;
    }
    while (sibling && sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === "ANNOTATION-HIGHLIGHT") {
      sibling = sibling.firstChild;
    }
    return sibling;
  }

  #realFirstChild(node) {
    let child;
    // get the previous sibling
    child = node.firstChild;
    while (child && !/\S/.test(child.nodeValue)) {
      // skip empty childs -> artefact from html parser
      child = child.nextSibling;
    }
    while (child && child.nodeType === Node.ELEMENT_NODE && child.tagName === "ANNOTATION-HIGHLIGHT") {
      child = child.firstChild;
    }
    return child;
  }

  #realLastChild(node) {
    let child;
    // get the previous sibling
    child = node.lastChild;
    while (child && !/\S/.test(child.nodeValue)) {
      // skip empty childs -> artefact from html parser
      child = child.previousSibling;
    }
    while (child && child.nodeType === Node.ELEMENT_NODE && child.tagName === "ANNOTATION-HIGHLIGHT") {
      child = child.lastChild;
    }
    return child;
  }

  #mathAdjustSelectionLeft(customXpath) {
    let jsXpath, node;
    let result;

    // adapt xpath
    jsXpath = extractXPathFromCustomFormat(customXpath);
    node = getElementByXPath(jsXpath);
          
    if (customXpath.startsWith('char')) {
      // case: ...<node>te|xt</node> => ...|<node>text</node>
      result = this.#createXPathNode(node);
    } else if (customXpath.startsWith('node')) {
      let sibling = this.#realPreviousSibling(node);
      if (sibling) {
        // case: <parent>...</sibling>|<node>
        let child = this.#realLastChild(sibling);
        if (child && child.nodeType !== Node.TEXT_NODE) {
          // case: <parent>...</child></sibling>|<node> => <parent>...</child>|</sibling><node>
          result = this.#createXPathAfterNode(child);
        } else {
          // case: <parent>...<sibling>text</sibling>|<node> => <parent>...|<sibling>text</sibling><node>
          result = this.#createXPathNode(sibling);
        }
      } else {
        // case: ...<parent>|<node> => ...|<parent><node>
        result = this.#createXPathNode(node.parentNode);
      }
    } else if (customXpath.startsWith('after-node')) {
      let child = this.#realLastChild(node);
      let sibling = this.#realPreviousSibling(node);
      if (child && child.nodeType !== Node.TEXT_NODE) {
        // ...</child></node>|... => ...</child>|</node>...
        result = this.#createXPathAfterNode(child);
      } else if (sibling) {
        // ...</sibling><node>text</node>|... => ...</sibling>|<node>text</node>...
        result = this.#createXPathAfterNode(sibling);
      } else {
        // <parent><node>text</node>|... -> <parent>|<node>text</node>...
        result = this.#createXPathNode(node);
      }
    } else {
      console.warn('Unknown xpath prefix:', customXpath);
    }
    return result;
  }

  #mathAdjustSelectionRight(customXpath) {
    let jsXpath, node;
    let result;

    // adapt xpath
    jsXpath = extractXPathFromCustomFormat(customXpath);
    node = getElementByXPath(jsXpath);

    if (customXpath.startsWith('char')) {
      // case: <node>te|xt</node>... => <node>text</node>|...
      result = this.#createXPathAfterNode(node);
    } else if (customXpath.startsWith('node')) {
      let child = this.#realFirstChild(node);
      if (child && child.nodeType !== Node.TEXT_NODE) {
        // case: ...|<node><child>... => ...<node>|<child>...
        result = this.#createXPathNode(child);
      } else {
        // case: ...|<node>text</node>... => ...<node>text</node>|...
        result = this.#createXPathAfterNode(node);
      }
    } else if (customXpath.startsWith('after-node')) {
      let sibling = this.#realNextSibling(node);
      if (sibling) {
        // case: </node>|<sibling>...
        let child = this.#realFirstChild(sibling);
        if (child && child.nodeType !== Node.TEXT_NODE) {
          // case: </node>|<sibling><child> => </node><sibling>|<child>
          result = this.#createXPathNode(child);
        } else {
          // case: </node>|<sibling>text</sibling>... => </node><sibling>text</sibling>|...
          result = this.#createXPathAfterNode(sibling);
        }
      } else {
        // case: </node>|</parent>... => </node></parent>|...
        result = this.#createXPathAfterNode(node.parentNode);
      }
    } else {
      console.warn('Unknown xpath prefix:', customXpath);
    }
    return result;
  }
  
  /**
   * Adjust the start of the selection and shifts it one character to the left.
   */
  adjustSelectionStartLeft() {
    let newTarget;
    // remove old annoation tags in html
    this.#selection.remove();

    if (this.#selection.xPathStart.includes('/math/')) {
      let result;
      result = this.#mathAdjustSelectionLeft(this.#selection.xPathStart);
      // create new fragment target
      newTarget = this.#createNewFragmentTargetFromPath(result, this.#selection.xPathEnd);
    } else {
      let selection, range, endRange;
      // create new range from xpath
      range = getRangeToXPath(this.#selection.xPathStart, this.#selection.xPathEnd);
      // create selection in reverse order (i.e right-to-left)
      endRange = range.cloneRange();
      endRange.collapse(false);
      selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(endRange);
      selection.extend(range.startContainer, range.startOffset);
      // extend selection one to the left (i.e. the start of selection one to left)
      selection.modify("extend", "left", "character");
      range = selection.getRangeAt(0);
      // clear selection
      selection.removeAllRanges();
      
      // create new fragment target
      newTarget = this.#createNewFragmentTargetFromRange(range);
    }
    this.setFragmentTarget(newTarget);
  }
  
  /**
   * Adjust the start of the selection and shifts it one character to the right.
   */
  adjustSelectionStartRight() {
    let newTarget;
    // remove old annoation tags in html
    this.#selection.remove();

    if (this.#selection.xPathStart.includes('/math/')) {
      let result;
      result = this.#mathAdjustSelectionRight(this.#selection.xPathStart);
      // create new fragment target
      newTarget = this.#createNewFragmentTargetFromPath(result, this.#selection.xPathEnd);
    } else {
      let selection, range, endRange;
      // create new range from xpath
      range = getRangeToXPath(this.#selection.xPathStart, this.#selection.xPathEnd);
      // create selection in reverse order (i.e right-to-left)
      endRange = range.cloneRange();
      endRange.collapse(false);
      selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(endRange);
      selection.extend(range.startContainer, range.startOffset);
      // extend selection one to the right (i.e. the start of selection one to right)
      selection.modify("extend", "right", "character");
      range = selection.getRangeAt(0);
      // clear selection
      selection.removeAllRanges();

      // create new fragment target
      newTarget = this.#createNewFragmentTargetFromRange(range);
    }
    this.setFragmentTarget(newTarget);
  }

  /**
   * Adjust the end of the selection and shifts it one character to the left.
   */
  adjustSelectionEndLeft() {
    let newTarget;
    // remove old annoation tags in html
    this.#selection.remove();
  
    if (this.#selection.xPathEnd.includes('/math/')) {
      let result;
      result = this.#mathAdjustSelectionLeft(this.#selection.xPathEnd);
      // create new fragment target
      console.log(result);
      newTarget = this.#createNewFragmentTargetFromPath(this.#selection.xPathStart, result);
    } else {      
      let selection, range;
    
      // create new range from xpath
      range = getRangeToXPath(this.#selection.xPathStart, this.#selection.xPathEnd);
      // get selection
      selection = window.getSelection();
      // create selection in order (i.e left-to-right)
      selection.removeAllRanges();
      selection.addRange(range);
      // extend selection one to the left (i.e. the end of selection one to left)
      selection.modify("extend", "left", "character");
      range = selection.getRangeAt(0);
      // clear selection
      selection.removeAllRanges();
  
      // create new fragment target
      newTarget = this.#createNewFragmentTargetFromRange(range);
    }
    this.setFragmentTarget(newTarget);  
  }

  /**
   * Adjust the end of the selection and shifts it one character to the right.
   */
  adjustSelectionEndRight() {
    let newTarget;
    // remove old annoation tags in html
    this.#selection.remove();

    if (this.#selection.xPathEnd.includes('/math/')) {
      let result;
      result = this.#mathAdjustSelectionRight(this.#selection.xPathEnd);
      // create new fragment target
      newTarget = this.#createNewFragmentTargetFromPath(this.#selection.xPathStart, result);
    } else {
      let selection, range;

      // create new range from xpath
      range = getRangeToXPath(this.#selection.xPathStart, this.#selection.xPathEnd);
      // get selection
      selection = window.getSelection();
      // create selection in order (i.e left-to-right)
      selection.removeAllRanges();
      selection.addRange(range);
    // extend selection one to the right (i.e. the end of selection one to right)
      selection.modify("extend", "right", "character");
      range = selection.getRangeAt(0);
      // clear selection
      selection.removeAllRanges();
  
      // create new fragment target
      newTarget = this.#createNewFragmentTargetFromRange(range);
    }
    
    this.setFragmentTarget(newTarget);
  }

  changeAnnotationStyle(newStyle) {
    this.#selection.changeAnnotationStyle(newStyle);
    this.body.changeAnnotationStyle(newStyle.styleName);
  }

  /**
   * The window resized.
   * @param {Event} event 
   */
  resizeEvent(event) {
    this.#selection.resizeEvent(event);
  }
}
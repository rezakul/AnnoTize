class AnnotationStyleText extends AnnotationStyle {
  #styleClassCSS;
  #mathNodes = [];
  #textNodes = [];
  #mouseoverCallback;
  #mouseoutCallback;
  #clickCallback;

  /**
   * @param {SelectionObject} selection the selected text area object
   */
  constructor(selection, styleClassCSS) {
    super(selection);
    this.#styleClassCSS = styleClassCSS;

    this.#mouseoverCallback = (event) => this.selection.eventCallbackMouseover(event);
    this.#mouseoutCallback = (event) => this.selection.eventCallbackMouseout(event);
    this.#clickCallback = (event) => this.selection.eventCallbackClick(event);
  }

  get mathNodes() {
    return this.#mathNodes;
  }

  get textNodes() {
    return this.#textNodes;
  }

  /* --- Private Helper Functions --- */

  /**
   * Creates a highlight element that can be inserted into a html node.
   * @param {string} text the textContent of the new highlight node
   * @returns {Node} the new highlight node
   */
  createHighlightElement(text) {
    let annotationElement = document.createElement(this.#styleClassCSS);
    // annotationElement.setAttribute('class', 'annotation-text-highlight_' + this.annotationID);
    annotationElement.textContent = text;
    // annotation_element.setAttribute('tabindex', "-1");
    // Set event callbacks to selection object
    annotationElement.addEventListener("mouseover", this.#mouseoverCallback);
    annotationElement.addEventListener("mouseout", this.#mouseoutCallback);
    annotationElement.addEventListener("click", this.#clickCallback);
  
    this.#textNodes.push(annotationElement);
    return annotationElement;
  }
  
  /**
   * Insertes a highlight node into the html if start and end of the range are in the same node.
   * 
   * @param {Node} node the node with the highlighted element 
   * @throws {Error} Will throw an error if node is not a TEXT_NODE
   */
  #processStartAndEndOfRange(node, startOffset, endOffset) {
    if (node.nodeType !== Node.TEXT_NODE) {
      console.warn(node);
      throw new Error('Node should be a TEXT_NODE');
    }
    let content = node.textContent;
    // adapt text content of original node
    node.textContent = content.substring(0, startOffset);
    // create new annotation node
    let annotationText = content.substring(startOffset, endOffset);
    let annotationElement = this.createHighlightElement(annotationText);
    // insert node into html
    node.after(annotationElement);
    // create new text node after annotation
    annotationElement.after(content.substring(endOffset));
  }
  
  /**
   * Insertes a highlight node into the html for the start node of the selected range.
   * 
   * @param {Node} node the node with the highlighted element 
   * @throws {Error} Will throw an error if node is not a TEXT_NODE
   */
  #processStartOfRange(node, offset) {
    if (node.nodeType !== Node.TEXT_NODE) {
      console.warn(node);
      throw new Error('Node should be a TEXT_NODE');
    }
    let content = node.textContent;
    // adapt text content of original node
    node.textContent = content.substring(0, offset);
    // create new annotation node
    let annotationText = content.substring(offset);
    let annotationElement = this.createHighlightElement(annotationText);
    node.after(annotationElement);
  }
  
  /**
   * Insertes a highlight node into the html for the end node of the selected range.
   * 
   * @param {Node} node the node with the highlighted element 
   * @throws {Error} Will throw an error if node is not a TEXT_NODE
   */
  #processEndOfRange(node, offset) {
    if (node.nodeType !== Node.TEXT_NODE) {
      console.warn(node);
      throw new Error('Node should be a TEXT_NODE');
    }
    let content = node.textContent;
    // adapt text content of original node
    node.textContent = content.substring(offset);
    // create new annotation node
    let annotationText = content.substring(0, offset);
    let annotationElement = this.createHighlightElement(annotationText);
    node.before(annotationElement);
  }

  /**
   * Process node if node is completly in range.
   * 
   * @param {Node} node the node with the highlighted element 
   * @throws {Error} Will throw an error if node is not a TEXT_NODE
   */
  #processInsideNode(node) {
    let annotationElement;
    // create highlight class and replace text content with it
    annotationElement = this.createHighlightElement(node.textContent);
    node.parentNode.replaceChild(annotationElement, node);
  }

  /**
   * Process node if node is a mathML node.
   * 
   * @param {Node} node the node inside a math enviroment with the highlighted element 
   * @throws {Error} Will throw an error if node is not inside a math node
   */
  #processMathNode(node) {
    if (!runtime.isMathNode(node)) {
      throw new Error('Node should be a inside math node');
    }
    /*
    let outermost;
    outermost = this.#getOutermostMathElement(node, range);
    if (!this.#alreadyInMathList(outermost)) {
      this.#mathNodes.push(outermost);
    }
    */
    this.#mathNodes.push(node);
  }

  #recursiveNodeIteration(node, positionFlag, range, startNodeRange, endNodeRange, startOffset, endOffset, startAfterNodeFlag, endAfterNodeFlag) {
    let currentNodeIsEnd = false;
    // base case (but should not appear)
    if (node === undefined) {
      return positionFlag;
    }
    // skip nodes that don't contain the start element if it as not yet found
    if (positionFlag === -1 && !node.contains(startNodeRange) && !node.isSameNode(startNodeRange)) {
      return positionFlag;
    }
    // check if current node is inside a mathML node
    const isMathNode = runtime.isMathNode(node);
    // skip annotation nodes in mathML nodes
    if (isMathNode && (node.tagName == "annotation-xml" || node.tagName == "annotation")) {
      return positionFlag;
    }
    
    // compare current node to range
    if (node.isSameNode(startNodeRange) && node.isSameNode(endNodeRange)) {
      if (isMathNode) {
        let mathNode = node;
        if (node.nodeType === Node.TEXT_NODE) {
          console.warn('WARNING: nodes in MathML should be fully contained - does not support end in textContent...', node);
          mathNode = node.parentNode;
        }
        this.#processMathNode(mathNode);
        return 1;
      }
      if (node.nodeType === Node.TEXT_NODE) {
        this.#processStartAndEndOfRange(node, startOffset, endOffset);
        // now outside of range
        return 1;
      } else {
        if (endAfterNodeFlag) {
          positionFlag = 0;
          currentNodeIsEnd = true;
        } else {
          console.warn('WARNING: If start and end in same node the node must be a TEXT_NODE');
          return 1;
        }
      }
    } else if (node.isSameNode(startNodeRange)) {
      if (startAfterNodeFlag) {
        // children of this node are before, nextSibling is inside
        return 0
      }
      // current node is start
      if (isMathNode) {
        let mathNode = node;
        if (node.nodeType === Node.TEXT_NODE) {
          console.warn('WARNING: nodes in MathML should be fully contained - does not support end in textContent...');
          mathNode = node.parentNode;
        }
        if (range.isPointInRange(mathNode, mathNode.childNodes.length)) {
          // whole math node is in selected range
          this.#processMathNode(mathNode);
          // skip all children if node is fully contained
          return 0;
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        this.#processStartOfRange(node, startOffset);
      }
      // indicate that we are currently inside the selected range
      positionFlag = 0;
    } else if (node.isSameNode(endNodeRange)) {
      if (endAfterNodeFlag) {
        currentNodeIsEnd = true;
      } else {
        if (isMathNode) {
          let mathNode = node;
          if (node.nodeType === Node.TEXT_NODE) {
            console.warn('WARNING: nodes in MathML should be fully contained - does not support end in textContent...');
            mathNode = node.parentNode;
          }
          // this.#processMathNode(node);
        } else if (node.nodeType === Node.TEXT_NODE) {
          this.#processEndOfRange(node, endOffset);
        }
        // now outside of range
        return 1;
      }
    } else if (positionFlag === 0 && node.nodeType === Node.TEXT_NODE) {
      // ignore nodes with only whitespaces. These node are most likely an artefact from the DOM parese and not actually part of the document.
      if (!/\S/.test(node.nodeValue)) {
        return positionFlag;
      }
      // special treatment for mathML nodes. Don't insert highlight element to not destroy mathML syntax.
      if (isMathNode) {
        console.warn('WARNING: nodes in MathML should be fully contained - does not support end in textContent...');
        this.#processMathNode(node.parentNode);
      } else {
        this.#processInsideNode(node);
      }
    }
    if (positionFlag === 0 && isMathNode) {
      if (range.isPointInRange(node, node.childNodes.length)) {
        this.#processMathNode(node);
        // skip all children if node is fully contained
        return node.contains(endNodeRange) ? 1 : 0;
      }
    }

    // recursive call
    if (node.hasChildNodes()) {
      let chList = Array.from(node.childNodes);
      // depth first search
      for (let ch of chList) {
        positionFlag = this.#recursiveNodeIteration(ch, positionFlag, range, startNodeRange, endNodeRange, startOffset, endOffset, startAfterNodeFlag, endAfterNodeFlag);
        if (positionFlag === 1) {
          // break if outside of range
          return 1;
        }
      }
    }

    // handle "after-node" xpath
    if (currentNodeIsEnd) {
      return 1;
    }

    return positionFlag;
  }
  
/*
  #recursiveStepThroughRange(node, range, inside=-1) {
    // inside can be -1 (last node was before range), 0 (last node was inside range), 1 (last node was outside)
    let nodeRange;
    // break if current node is null (but should not occure)
    if (node === null) {
      return false;
    }
    // skip nodes that don't contain the start element if it as not yet found
    nodeRange = new Range();
    nodeRange.selectNodeContents(node);
    if (inside === -1 && range.compareBoundaryPoints(Range.END_TO_START, nodeRange) === 1) {
      return -1;
    }
    // check if current node is inside a mathML node
    let isMathNode = runtime.isMathNode(node);
    // skip annotation nodes in mathML nodes
    if (isMathNode && (node.tagName == "annotation-xml" || node.tagName == "annotation")) {
      return inside;
    }

    // recursive step through children to get to text nodes
    if (node.hasChildNodes()) {
      // make an array so list is static (not live, like NodeList)
      let children = Array.from(node.childNodes);
      for (let i = 0; i < children.length; ++i) {
        inside = this.#recursiveStepThroughRange(children[i], range, inside);
        if (inside === 1) {
          return 1;
        }
      }
    }
    // annotate text elements
    if (node.nodeType === Node.TEXT_NODE) {
      // Check if the current node is inside the range
      if (range.comparePoint(node, 0) === 1) {
        // already outside the range -> this can happen if range ends exactly on a node border
        if (inside === 0) {
          return 1;
        }
        return -1;
      }
      // start and end point in current node
      if (inside === -1 && range.comparePoint(node, range.startOffset) === 0 && range.comparePoint(node, node.length) === 1) {
        
        if (isMathNode) {
          console.warn('WARNING: nodes in MathML should be fully contained - does not support end in textContent...', node);
          this.#processMathNode(node, range);
        } else {
          this.#processStartAndEndOfRange(node, range);
        }
        return 1;
      }
      // start point in current node
      if (inside === -1 && range.comparePoint(node, range.startOffset) === 0) {
        if (isMathNode) {
          if (range.startOffset === node.length) {
            
          }
          this.#processMathNode(node, range);
        } else {
          this.#processStartOfRange(node, range);
        }
        return 0;
      }
      // end point in current node
      if (inside === 0 && range.comparePoint(node, node.length) === 1) {
        if (isMathNode) {
          if (range.endOffset === 0) {
            // ignore node
          } else {
            console.warn('WARNING: nodes in MathML should be fully contained - does not support end in textContent...', node);
            this.#processMathNode(node, range);
          }
          
        } else {
          this.#processEndOfRange(node, range);
        }
        return 1;
      }
      if (inside === 0) { 
        // ignore nodes with only whitespaces. These node are most likely an artefact from the DOM parese and not actually part of the document.
        if (!/\S/.test(node.nodeValue)) {
          return inside;
        }
        // special treatment for mathML nodes. Don't insert highlight element to not destroy mathML syntax.
        if (isMathNode) {
          this.#processMathNode(node, range);
        } else {
          this.#processInsideNode(node);
        }
      }
    }
    return inside;
  }
  */
  
  #annotateMathList() {
    this.#mathNodes.forEach(element => {
      // annotate math element
      this.annotateMathElement(element);
      // change mouse on mouseover
      element.style.cursor = "pointer";
      // set event callbacks
      element.addEventListener("mouseover", this.#mouseoverCallback);
      element.addEventListener("mouseout", this.#mouseoutCallback);
      element.addEventListener("click", this.#clickCallback);
    });
  }

  #allInsideRange(node, range) {
    let startNode = range.startContainer;
    let endNode = range.endContainer;
    let result;
    if (node.nodeType === Node.TEXT_NODE) {
      return true;
    }
    if (!node.contains(startNode) && !node.contains(endNode)) {
      return true;
    }
    if (node.isSameNode(startNode)) {
      return true;
    }
    if (node.contains(startNode)) {
      let firstChild = node.firstChild;
      if (firstChild.isSameNode(startNode) || firstChild.contains(startNode)) {
        result = this.#allInsideRange(firstChild, range);
        if (result === false) {
          return false;
        }
      } else {
        return false;
      }
    }
    if (node.contains(endNode)) {
      let lastChild = node.lastChild;
      if (lastChild.isSameNode(endNode) || lastChild.contains(endNode)) {
        result = this.#allInsideRange(lastChild, range);
      } else {
        return false;
      }
    }
    return result;
  }

  #getOutermostMathElement(node, range) {
    /*
    if (node.nodeType === Node.TEXT_NODE) {
      return node.parentNode;
    }
    */
    if (node == null) {
      // should not occure
      return node;
    }
    if (node.tagName === 'math') {
      return node;
    }
    if (this.#allInsideRange(node.parentNode, range)) {
      return this.#getOutermostMathElement(node.parentNode, range);
    }
    return node;
  }

  #alreadyInMathList(node) {
    let result = false;
    this.#mathNodes.forEach(element => {
      result |= element.isSameNode(node);
    });
    return result;
  }

  #initializeRange(range) {
    // Idea: use a TreeWalker to iterate over the elements in the range
    // -> does not work because document will be changed during iteration
    // const walker = document.createTreeWalker(this.range.commonAncestorContainer, NodeFilter.SHOW_TEXT, null, false);
    let startNodeRange, endNodeRange, startAfterNodeFlag, endAfterNodeFlag, startOffset, endOffset;
    let ancestor = range.commonAncestorContainer;
    
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
    // this.#recursiveStepThroughRange(ancestor, range);
    this.#recursiveNodeIteration(ancestor, -1, range, startNodeRange, endNodeRange, startOffset, endOffset, startAfterNodeFlag, endAfterNodeFlag);
  }

  #initialize() {
    if (this.discontinuous) {
      for (let i = 0; i < this.numberOfRanges; ++i) {
        const range = this.getRange(i);
        this.#initializeRange(range);
      }
    } else {
      // get local copy of range for performance resons
      const range = this.range;
      this.#initializeRange(range);
    }
    this.#annotateMathList();
  }

  /**
   * Annotate the html page. Adds highlight classes and backgroundcolor to selected area.
   */
  show() {
    if (this.state === AnnotationStyleState.REMOVED) {
      throw Error('Annotation highlight was previously removed...');
    }
    if (this.state === AnnotationStyleState.SHOWN) {
      return;
    }
    if (this.state === AnnotationStyleState.UNINITIALIZED) {
      this.#initialize();
    }
    if (this.state === AnnotationStyleState.HIDDEN) {
      // TODO
    }
    this.state = AnnotationStyleState.SHOWN;
  }

  /**
   * Hide the annotation highlight in the text.
   */
  hide() {
    if (this.state === AnnotationStyleState.REMOVED) {
      throw Error('Annotation highlight was previously removed...');
    }
    if (this.state === AnnotationStyleState.UNINITIALIZED) {
      console.warn('Annotation highlight not yet ininialized');
      return;
    }
    if (this.state === AnnotationStyleState.SHOWN) {
      // grays out highlights
      this.#textNodes.forEach(element => {
        element.style.backgroundColor = 'rgb(211,211,211, 0.4)';
      });
      this.#mathNodes.forEach(element => {
        element.setAttribute("mathbackground", 'rgb(211,211,211, 0.4)');
      });
      this.state = AnnotationStyleState.HIDDEN;
    }
  }
  
  /**
   * Remove the highlights from the html text body.
   * Removes the with annotateHTML inserted changes.
   */
  remove() {
    if (this.state === AnnotationStyleState.REMOVED) {
      console.warn('Annotation highlight was already removed...');
      return;
    }
    this.textNodes.forEach(element => {
      let nodes, content;
      // text content of new Node
      content = "";
      nodes = new Set();
      if (element.previousSibling != null && element.previousSibling.nodeType === Node.TEXT_NODE) {
        content += element.previousSibling.textContent;
        element.previousSibling.remove();
      }
      for (let child of element.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          content += child.textContent;
        } else {
          // save current text node
          if (content !== "") {
            nodes.add(document.createTextNode(content));
            content = "";
          }
          // add child to nodes set
          nodes.add(child);
        }
      }
      if (element.nextSibling != null && element.nextSibling.nodeType === Node.TEXT_NODE) {
        content += element.nextSibling.textContent;
        element.nextSibling.remove();
      }
      if (content !== "") {
        nodes.add(document.createTextNode(content));
      }
      for (let node of nodes) {
        // use before to keep the right order
        element.before(node);
      }
      element.remove();
    });

    // remove event listener from math nodes
    this.mathNodes.forEach(element => {
      element.style.removeProperty('cursor');
      // remove EventListeners
      element.removeEventListener("mouseover", this.#mouseoverCallback);
      element.removeEventListener("mouseout", this.#mouseoutCallback);
      element.removeEventListener("click", this.#clickCallback);
    });
    this.state = AnnotationStyleState.REMOVED;
  }

  getFirstElement() {
    let r1, r2;
    if (this.#textNodes.length === 0 && this.#mathNodes.length === 0) {
      console.warn('Empty selection object...');
    }
    if (this.#textNodes.length === 0) {
      return this.#mathNodes[0];
    }
    if (this.#mathNodes.length === 0) {
      return this.#textNodes[0];
    }
    r1 = new Range();
    r2 = new Range();
    r1.selectNodeContents(this.#textNodes[0]);
    r2.selectNodeContents(this.#mathNodes[0]);

    return r1.compareBoundaryPoints(Range.START_TO_START, r2) === -1 ? this.#textNodes[0] : this.#mathNodes[0];
  }
}
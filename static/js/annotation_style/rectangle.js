class AnnotationStyleRectangle extends AnnotationStyle {
  #wrapper;
  #clickElement;
  #boxElement;

  /**
   * @param {Selection} selection the selection object this style belongs to
   */
  constructor(selection) {
    super(selection);
    // initialize box
    this.#wrapper = document.createElement('div');
    this.#wrapper.setAttribute('class', 'annotation-text-highlight');
    
    this.#boxElement = document.createElement('div');
    this.#boxElement.setAttribute('class', 'annotation-rectangle');

    this.#clickElement = document.createElement('div');
    this.#clickElement.setAttribute('class', 'annotation-rectangle-tab');

    this.#clickElement.addEventListener("mouseover", (event) => this.selection.eventCallbackMouseover(event));
    this.#clickElement.addEventListener("mouseout", (event) => this.selection.eventCallbackMouseout(event));
    this.#clickElement.addEventListener("click", (event) => this.selection.eventCallbackClick(event));

    this.#wrapper.appendChild(this.#boxElement);
    this.#wrapper.appendChild(this.#clickElement);
  }

  get color() {
    return super.color;
  }

  /**
  * Sets the annotation highlight color.
  * @param {string} val the color in a valid css format 
  */
  set color(val) {
    if (val === '' || val === null) {
      //this.#boxElement.style.removeProperty("background-color");
      this.#boxElement.style.removeProperty("border");
      this.#clickElement.style.removeProperty("background-color");
    } else {
      //this.#boxElement.style.backgroundColor = color;
      this.#boxElement.style.border = "5px solid " + val;
      this.#clickElement.style.backgroundColor = val;
    }
    super.color = val;
  }

  static get styleName() {
    return "rectangle";
  }

  /**
   * Get a preview node for a selection menu from this style
   * @returns {Node}
   */
  static preview() {
    let preview;
    preview = super.preview();
    
    preview.style.border = "2px solid orange";
    preview.style.paddingLeft = "5px";
    preview.style.width = "40%";
    preview.textContent = "Rectangle";
    return preview;
  }
    
  #positionBox() {
    let boundingRect, topAnnotation, leftAnnotation, widthAnnotation, heightAnnotation;
    boundingRect = this.range.getBoundingClientRect();
    topAnnotation = boundingRect.top + window.scrollY - 5;
    leftAnnotation = boundingRect.left + window.scrollX - 5;
    widthAnnotation = boundingRect.width + 5;
    heightAnnotation = boundingRect.height + 5;
    
    this.#boxElement.style.top = topAnnotation + "px";
    this.#boxElement.style.left = leftAnnotation + "px";
    this.#boxElement.style.width = widthAnnotation - 3 + "px";
    this.#boxElement.style.height = heightAnnotation + "px";
    
    this.#clickElement.style.top = topAnnotation - 15 + "px";
    this.#clickElement.style.left = leftAnnotation + "px";
  }
  
  /**
   * Shows the annotation highlight.
   */
  show() {
    if (this.state === AnnotationStyleState.REMOVED) {
      throw Error('Annotation highlight was previously removed...');
    }
    if (this.state === AnnotationStyleState.SHOWN) {
      return;
    }
    this.#positionBox();
    // add box to html and setup eventlisteners
    document.body.appendChild(this.#wrapper);
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
    }
    if (this.state === AnnotationStyleState.SHOWN) {
      this.#wrapper.remove();
      this.state = AnnotationStyleState.HIDDEN;
    }
  }
    
  /**
   * Remove the highlights from the html text body.
   */
  remove() {
    if (this.state === AnnotationStyleState.REMOVED) {
      console.warn('Annotation highlight was already removed...');
      return;
    }
    if (this.state === AnnotationStyleState.SHOWN) {
      this.#wrapper.remove();
    }
    this.state = AnnotationStyleState.REMOVED;
  }
  
  getFirstElement() {
    return this.#clickElement;
  }
  
  resizeEvent(event) {
    if (this.state === AnnotationStyleState.SHOWN) {
      this.#positionBox();
    }
  }
}
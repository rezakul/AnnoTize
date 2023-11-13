class AnnotationStyleOutline extends AnnotationStyleText {

  /**
   * @param {Selection} selection the selected text area (can be null if range present)
   * @param {Range} range the range corresponding to the selection (can be null if selection present)
   * @param {number} annotationID the unique annotation ID
   */
  constructor(selection) {
    super(selection, "annotation-highlight");
  }

  static get styleName() {
    return "outline";
  }

  get color() {
    return super.color;
  }

  /**
   * Sets the text highlight color for the selected text.
   * @param {string} val the color in a valid css format 
   */
  set color(val) {
    this.textNodes.forEach(element => {
      if (val === '' || val === null) {
        element.style.removeProperty("text-decoration-color");
      } else {
        element.style.border = '1.5px ' + val;
        element.style.borderStyle = 'solid solid solid solid';
        element.style.borderRadius = '15px 15px 15px 15px'; 
      }
    });
    this.mathNodes.forEach(element => {
      if (val === '' || val === null) {
        //element.style.removeProperty("text-decoration");
        element.style.removeProperty("border");
        element.style.removeProperty("border-style");
        element.style.removeProperty("border-radius");
      } else {
        element.style.border = '1.5px ' + val;
        element.style.borderStyle = 'solid solid solid solid';
        element.style.borderRadius = '15px 15px 15px 15px'; 
      }
    });
    super.color = val;
  }

  /**
   * Get a preview node for a selection menu from this style
   * @returns {Node}
   */
  static preview() {
    let preview;
    preview = super.preview();
    
    preview.style.border = "1.5px solid orange";
    preview.style.borderRadius = "15px";
    preview.style.paddingLeft = "5px";
    preview.style.width = "30%";
    preview.textContent = "Outline";
    return preview;
  }

  /* --- Private Helper Functions --- */

  /**
   * Creates a highlight element that can be inserted into a html node.
   * @param {string} text the textContent of the new highlight node
   * @returns {Node} the new highlight node
   */
  createHighlightElement(text) {
    let annotationElement;
    
    annotationElement = super.createHighlightElement(text);
    return annotationElement;
  }

  annotateMathElement(element) {
    // TODO
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
      this.textNodes.forEach(element => {
        element.style.backgroundColor = 'rgb(211,211,211, 0.4)';
      });
      this.mathNodes.forEach(element => {
        element.setAttribute("mathbackground", 'rgb(211,211,211, 0.4)');
      });
      this.state = AnnotationStyleState.HIDDEN;
    }
  }

  remove() {
    if (this.state === AnnotationStyleState.REMOVED) {
      console.warn('Annotation highlight was already removed...');
      return;
    }
    // remove background property
    this.mathNodes.forEach(element => {
      element.style.removeProperty("background-color");
    });
    // remove text nodes
    super.remove();
  }
}
class AnnotationStyleUnderscore extends AnnotationStyleText {

  /**
   * @param {Selection} selection the selected text area (can be null if range present)
   */
  constructor(selection) {
    super(selection, "annotation-highlight");
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
        element.style.textDecoration = 'underline solid ' + val;
      }
    });
    this.mathNodes.forEach(element => {
      if (val === '' || val === null) {
        //element.style.removeProperty("text-decoration");
        element.style.removeProperty("border-bottom")
      } else {
        //element.style.textDecoration = 'underline solid ' + val;
        element.style.borderBottom = "2px solid " + val;
      }
    });
    super.color = val;
  }

  static get styleName() {
    return "underscore";
  }

  /**
   * Get a preview node for a selection menu from this style
   * @returns {Node}
   */
  static preview() {
    let preview;
    preview = super.preview();
    
    preview.style.textDecoration = "underline solid orange";
    preview.textContent = "Underscore";
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
    // annotationElement.style.textDecorationLine = 'underline';
    // annotationElement.style.textDecorationStyle = 'solid';
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
      this.textNodes.forEach(element => {
        element.style.removeProperty("text-decoration-color");
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
    // remove underscore property
    this.mathNodes.forEach(element => {
      //element.style.removeProperty("text-decoration");
      element.style.removeProperty("border-bottom");
    });
    // remove text nodes
    super.remove();
  }
  
}
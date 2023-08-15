class AnnotationStyleMarker extends AnnotationStyleText {

  /**
   * @param {Selection} selection the selected text area (can be null if range present)
   * @param {Range} range the range corresponding to the selection (can be null if selection present)
   * @param {number} annotationID the unique annotation ID
   */
  constructor(selection) {
    super(selection, "annotation-highlight");
  }

  get color() {
    return super.color;
  }

  static get styleName() {
    return "marker";
  }

  /**
   * Sets the text highlight color for the selected text.
   * @param {string} val the color in a valid css format 
   */
  set color(val) {
    let luminance = computeLuminance(val);
    this.textNodes.forEach(element => {
      if (val === '' || val === null) {
        element.style.removeProperty("background-color");
      } else {
        element.style.backgroundColor = val;
        if (luminance > 0.179) {
          element.style.color = '#000000';
        } else {
          element.style.color = '#ffffff';
        }
      }
    });
    this.mathNodes.forEach(element => {
      // mathbackground is deprecated -> use css
      if (val === '' || val === null) {
        element.style.removeProperty("background-color");
      } else {
        element.style.backgroundColor = val;
        if (luminance > 0.179) {
          element.style.color = '#000000';
        } else {
          element.style.color = '#ffffff';
        }
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
    
    preview.style.backgroundColor = "orange";
    preview.textContent = "Marker";
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
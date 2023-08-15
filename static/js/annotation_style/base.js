class AnnotationStyleState {
  constructor () {
    throw Error('Unsupported operation...');
  }

  /**
   * The annotation highlight is not yet initialized
   */
  static get UNINITIALIZED() {
    return 'uninitialized';
  }

  /**
   * The annotation highlight is shown.
   */
  static get SHOWN() {
    return 'shown';
  }

  /**
   * The annotation highlight is hidden.
   */
  static get HIDDEN() {
    return 'hidden';
  }

  /**
   * The annotation highlight was removed.
   * State used for debugging.
   */
  static get REMOVED() {
    return 'removed';
  }
}

class AnnotationStyle {
  #state;
  #selection;
  #color;

  constructor(selection) {
    this.#selection = selection;
    this.#state = AnnotationStyleState.UNINITIALIZED;
  }

  get annotationID() {
    return this.#selection.annotationID;
  }

  get selection() {
    return this.#selection;
  }

  get range() {
    return this.#selection.range;
  }

  get xPathStart() {
    return this.#selection.xPathStart;
  }

  get xPathEnd() {
    return this.#selection.xPathEnd;
  }

  get discontinuous() {
    return this.#selection.discontinuous;
  }

  get numberOfRanges() {
    return this.#selection.numberOfRanges;
  }
  
  getRange(idx) {
    return this.#selection.getRange(idx);
  }

  get state() {
    return this.#state;
  }

  set state(val) {
    this.#state = val;
  }

  get color() {
    return this.#color;
  }

  set color(val) {
    this.#color = val;
  }

  static preview() {
    let preview;
    preview = document.createElement("DIV");
    preview.style.width = "80%";
    preview.setAttribute("value", this.styleName);
    // subclasses should set textContent accordingly
    preview.textContent = this.styleName;
    return preview;
  }

  replace(oldStyle) {
    let oldState;
    if (this.state !== AnnotationStyleState.UNINITIALIZED) {
      console.warn('The new annotation style should be uninitialized to adopt the old one');
      return;
    }
    oldState = oldStyle.state;
    // remove the old style and set up new
    oldStyle.remove();
    // replace the old style with self
    switch(oldState) {
      case AnnotationStyleState.UNINITIALIZED:
        // nothing to do
        break;
      case AnnotationStyleState.SHOWN:
        this.show();
        break;
      case AnnotationStyleState.HIDDEN:
        // show first to initialize state 
        this.show();
        this.hide();
        break;
      case AnnotationStyleState.REMOVED:
        this.remove();
        break;
      default:
        console.warn('Unsupported state');
        break;
    }
    this.color = oldStyle.color;
  }
  
  resizeEvent(event) {
    return;
  }
}
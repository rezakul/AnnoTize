/**
 * An occurrence of an identifier.
 * @extends {TemplateFragment} implements a template fragment.
 */
class IdentifierOccurrenceTemplateQ extends IdentifierTemplateQ {
  #occurrence;

  /**
   * Creates a number input fragment.
   * 
   * @param {string} identiferId the initial value (default none)
   * @param {IdentifierOccurrence} occurrence the occurrence object
   * @param {string} label the label of the input
   */
  constructor(name, number=-1, identiferId="", occurrence=null) {
    super(name, number, identiferId);
    // initialize private variables
    this.#occurrence = occurrence;
  }

  /**
   * Get the highlight color for this element.
   * @returns {String} css color
   */
  get color() {
    // TODO
    return this.identifier.occurrence.color;
  }

  toJSON(key) {
    let json = {};

    json.type = "SimpleTextBody";
    json.val = this.text;
    
    return json;
  }

  content(state, signalChange) {
    let wrapper;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-template-fragment');

    const callback = (event) => {runtime.getPlugin('IdentifierBody').lastUsedIdentifier = event.target.value;};
    wrapper.appendChild(super.content(state, signalChange, callback));
    
    return wrapper;
  }

  save() {
    let identifier;
    identifier = this.getIdentifierFromMenu();

    if (this.identifier) {
      // create new occurrence if only identifier is defined
      if (!this.#occurrence) {
        // create new occurrence and register with identifier
        this.#occurrence = new IdentifierOccurrence();
        this.identifier.addOccurrence(this.#occurrence);
        if (this.body.annotationObject) {
          this.#occurrence.registerAnnotation(this.body.annotationObject);
        }
      }
      if (this.identifier === identifier) {
        // nothing changed
        super.save();
        return;
      } else {
        // remove old occurrence
        this.remove();
      }
    }
    // set new identifier occurrence
    this.#occurrence = new IdentifierOccurrence();
    identifier.addOccurrence(this.#occurrence);
    if (this.body.annotationObject) {
      this.#occurrence.registerAnnotation(this.body.annotationObject);
    }

    super.save();
  }

  edit() {
    // nothing to do
  }

  cancel() {
    // nothing to do
  }

  clickOnElementEvent(event) {
    if (this.identifier) {
      runtime.getPlugin('IdentifierBody').lastUsedIdentifier = this.identifier.id;
    }
  }

  registerAnnotation(annotationObject) {
    // TODO
    throw Error('Implement me');
    super.registerAnnotation(annotationObject);
    this.#occurrence.registerAnnotation(annotationObject);
    const callback = (event) => this.clickOnElementEvent(event);
    annotationObject.registerTextClickCallback(callback);
    annotationObject.registerSidebarClickCallback(callback);
  }

  remove() {
    this.identifier.removeOccurrence(this.#occurrence);
  }

  focus() {
    let input;
    input = document.getElementById(this.uniqueFragmentId + '-annotation-input-value');
    input.focus();
  }

  copy() {
    // TODO
  }
}
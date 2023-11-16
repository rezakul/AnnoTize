/**
 * Holds information about the creator of the annotations.
 */
class Creator {
  #id;                              // unique creator id
  #annotationStyle;                 // the annotation highlight style new annotations of this creator have
  #annotationStyleOverwritable;     // flag if style is overwritable

  /**
   * Annotation Creator
   * @param {string} id the unique creator id
   * @param {string} style the highlight style ('default' if omitted)
   * @param {boolean} overwritable  flag if style is overwritable (true if omitted)
   */
  constructor (id, style='default', overwritable=true) {
    this.#id = id;
    this.#annotationStyle = style;
    this.#annotationStyleOverwritable = overwritable;
  }

  /**
   * Globally unique creator id
   */
  get id() {
    return this.#id;
  }

  /**
   * The annotation style for annotations with this creator
   * @returns {AnnotationStyle}
   */
  get annotationStyle() {
    return this.#annotationStyle;
  }

  set annotationStyle(val) {
    this.#annotationStyle = val;
  }

  /**
   * The user can overwrite the define annotation style
   * @returns {boolean}
   */
  get annotationStyleOverwritable() {
    return this.#annotationStyleOverwritable;
  }

  set annotationStyleOverwritable(val) {
    this.#annotationStyleOverwritable = val;
  }
}
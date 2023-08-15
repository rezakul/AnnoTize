class Creator {
  #id;
  #annotationStyle = 'default';
  #annotationStyleOverwritable = true;

  /**
   * Annotation Creator
   * @param {string} id the unique creator id
   */
  constructor (id) {
    this.#id = id;
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
class AbstractTemplateBody {
  #bodyID;
  
  constructor() {
    this.#bodyID = "id-" + self.crypto.randomUUID();
  }

  get bodyID() {
    return this.#bodyID;
  }

  get displayName() {
    return this.constructor.name;
  }

  /**
   * Export this annotation body to json.
   * 
   * @param {any} key a key may given by JSON.stringify()
   * @returns {object} (JSON) stringifyable object
   */
  toJSON(key) {
    let json = {};

    // IMPLEMENT IN DERIVED CLASS!
    json.error = "Define in derived body class!";
    
    return json;
  }

  /**
   * Creates the template content.
   * 
   * @returns {Node} the element node
   */
  content() {
    throw Error('Not implemented');
  }

  /**
   * Save the current state of the template.
   */
  save() {
    // implement in derived class
  }

  /**
   * Create a new annotation from the template.
   * @param {State} state the state of the annotation
   * @returns {AnnotationBody} a new creation annotation body
   */
  createFromTemplate(state) {
    let body, templateBody;
    templateBody = this.getAnnotationFromTemplate(state);
    body = new AnnotationTypeSelectionBody(state, templateBody);
    return body;
  }
}
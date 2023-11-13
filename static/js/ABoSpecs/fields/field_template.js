class FieldTemplate {
  // indicates if the field is in a valid state (i.e. all fields are set by the user)
  #validState;
  // the abstract field this fragment belongs to
  #field;
  // a unique id for this template fragment
  #uniqueFragmentId;
  // the template fragment name
  #name;
  // the number of the input in the field (-1 if not number)
  #number;

  /**
   * Constructs a template fragment element (input field, tag field, identifier, ...)
   */
  constructor(field, name, number, valid=false) {
    this.#validState = valid;
    this.#uniqueFragmentId = "id-" + self.crypto.randomUUID();
    this.#name = name;
    this.#number = number;
    this.#field = field;
  }

  /**
   * The unique fragment id
   * @returns {string} The unique body id
   */
  get uniqueFragmentId() {
    return this.#uniqueFragmentId;
  }

  /**
   * The abstract field this template fragment belongs to
   * @returns {AbstractField}
   */
  get field() {
    return this.#field;
  }

  /**
   * The template body this fragment belongs to.
   * @returns {TemplateBody}
   */
  get body() {
    return this.field.body;
  }

  /**
   * The template fragment name.
   * @returns {string}
   */
  get name() {
    return this.#name;
  }

  /**
   * Get the number of the template fragment within its field.
   * @returns {number}
   */
  get number() {
    return this.#number;
  }

  /**
   * Get the default label for inputs
   * @returns {string}
   */
  get label() {
    if (this.#number !== -1) {
      return this.name + " [" + this.#number + "]:";
    } else {
      return this.name + ":";
    }
  }

  /**
   * The unqiue body id.
   * @returns {string}
   */
  get unqiueBodyId() {
    return this.body.bodyID;
  }

  /**
   * Get the state of the template body.
   * @returns {State}
   */
  get state() {
    return this.body.state;
  }

  /**
   * Indicates if body is currently in a valid state.
   * @returns {boolean}
   */
  get validState() {
    return this.#validState;
  }

  set validState(valid) {
    if (this.#validState !== valid) {
      this.#validState = valid;
      this.body.emitter.dispatchEvent(new CustomEvent('validityChange', {detail: {valid: valid}}));
    }
    
  }

  get color() {
    return null;
  }

  getLabelForInput(inputId) {
    let label;
    label = document.createElement('label');
    label.setAttribute('class', 'annotation-creation-label');
    label.setAttribute('for', inputId);
    label.textContent = this.label;
    return label;
  }

  getTemplateSelectWrapper() {
    let wrapper, select;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-template-field');
   
    wrapper.appendChild(this.getLabelForInput(this.uniqueFragmentId + '-select'));

    select = document.createElement('select');
    select.setAttribute('id', this.uniqueFragmentId + "-select");
    select.setAttribute('class', 'annotation-sidebar-select');
    select.required = true;
    select.dataset.customId = this.uniqueFragmentId;
    wrapper.appendChild(select);
    return wrapper;
  }

  getTemplateNumberInput() {
    let wrapper, input;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-template-field');
   
    wrapper.appendChild(this.getLabelForInput(this.uniqueFragmentId + '-annotation-input-value'));

    input = document.createElement('input');
    input.setAttribute('id', this.uniqueFragmentId + '-annotation-input-value');
    input.setAttribute('class', 'annotation-sidebar-input');
    input.setAttribute('type', 'number');
    input.required = true;
    wrapper.appendChild(input);
    
    return wrapper;
  }

  getTemplateTextInput() {
    let wrapper, input;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-template-field');
   
    wrapper.appendChild(this.getLabelForInput(this.uniqueFragmentId + '-annotation-input-value'));

    input = document.createElement('input');
    input.setAttribute('id', this.uniqueFragmentId + '-annotation-input-value');
    input.setAttribute('class', 'annotation-sidebar-input');
    input.setAttribute('type', 'text');
    input.required = true;
    wrapper.appendChild(input);
    
    return wrapper;
  }

  getTemplateTextboxInput() {
    let wrapper, input;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-template-field');
   
    wrapper.appendChild(this.getLabelForInput(this.uniqueFragmentId + '-annotation-input-value'));

    input = document.createElement('textarea');
    input.setAttribute('id', this.uniqueFragmentId + '-annotation-input-value');
    input.setAttribute('class', 'annotation-sidebar-input');
    input.required = true;
    wrapper.appendChild(input);
    
    return wrapper;
  }

  remove() {
    // Implement in child classes if neccessary
  }
}
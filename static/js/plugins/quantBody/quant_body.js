/**
 * A simple quantity body containing one a unit and a scalar value. 
 * @extends {AnnotationBody} extends the abstract AnnotationBody class. 
 */
class QuantBody extends AnnotationBody {
  #quant;

  /**
   * Creates a SimpleTagBody with a given tag.
   * @param {State} state the state of the annotation
   * @param {Quant} quant the quant
   */
  constructor(state, quant=null) {
    super(state);
    if (quant === null) {
      this.#quant = new Quant(NaN, "");
    } else {
      this.#quant = quant;
    }
  }

  /**
   * The quant value.
   * @returns {Quant}
   */
  get quant() {
    return this.#quant;
  }

  set quant(val) {
    this.#quant = val;
  }

  /**
   * Get the highlight color for this element.
   * @returns {String} css color
   */
  get color() {
    return AnnotationColors.HIGHLIGHT;
  }

  /**
   * Get the visibility of the tag.
   * @returns {boolean} if the element should be visible to the user
   */
  get visibility() {
    return true;
  }

  toJSON(key) {
    let json = {};

    json.type = "https://sigmathling.kwarc.info/resources/quantity-expressions/quantBody";
    json["rab:hasScalar"] = this.quant.scalar;
    json["rab:hasUnit"] = this.quant.unit;
    
    return json;
  }

  /**
   * Create a function callback that is called if an input field changes during edit / creation.
   * @param {function} signalValid callback to signal a valid state (and enable save button)
   * @param {function} signalInvalid callback to signal a invalud state (and disable save button)
   * @returns {(event : Event) => boolean} the callback function
   */
  #getChangeCallback(signalValid, signalInvalid) {
    let callback;
    callback = (event) => {
      let input1, input2;
      let id;
      id = event.target.dataset.customId;
      input1 = document.getElementById(id + '-annotation-scalar-value');
      input2 = document.getElementById(id + '-annotation-unit-value');
      if (input1.value !== "" && input2.value !== "") {
        signalValid();
        return true;
      } else {
        signalInvalid();
        return false;
      }
    }
    return callback;
  }

  /**
   * Creates the scalar input field.
   * 
   * @param {boolean} disabled whether the input is disabled
   * @returns {Node}
   */
  #scalarField(disabled) {
    let wrapper, label, input;
    wrapper = document.createElement('div');

    label = document.createElement('label');
    label.setAttribute('for', this.bodyID + '-annotation-scalar-value');
    label.setAttribute('class', 'annotation-display-label');
    label.textContent = "Scalar:";

    input = document.createElement('input');
    input.setAttribute('id', this.bodyID + '-annotation-scalar-value');
    input.setAttribute('class', 'annotation-sidebar-input');
    input.setAttribute('type', 'number');
    // also more decimal places are supported
    input.setAttribute('step', 0.1);
    input.dataset.customId = this.bodyID;
    input.disabled = disabled;
    input.value = this.quant.scalar;

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return wrapper;
  }

  /**
   * Creates the unit input field.
   * 
   * @param {boolean} disabled whether the input is disabled
   * @returns {Node}
   */
  #unitField(disabled) {
    let wrapper, label, input;
    wrapper = document.createElement('div');

    label = document.createElement('label');
    label.setAttribute('for', this.bodyID + '-annotation-unit-value');
    label.setAttribute('class', 'annotation-display-label');
    label.textContent = "Unit:";

    input = document.createElement('input');
    input.setAttribute('id', this.bodyID + '-annotation-unit-value');
    input.setAttribute('class', 'annotation-sidebar-input');
    input.setAttribute('type', 'text');
    input.dataset.customId = this.bodyID;
    input.disabled = disabled;
    input.value = this.quant.unit;

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return wrapper;
  }

  /**
   * Show the scalar input field in the display state.
   * @returns {Node}
   */
  #displayScalar() {
    return this.#scalarField(true);
  }

  /**
   * Show the unit input field in the display state.
   * @returns {Node}
   */
  #displayUnit() {
    return this.#unitField(true);
  }

  /**
   * Show the scalar input field in the edit state.
   * @param {function} signalValid callback to signal a valid state (and enable save button)
   * @param {function} signalInvalid callback to signal a invalud state (and disable save button)
   * @returns {Node}
   */
  #editScalar(signalValid, signalInvalid) {
    let tab, input;
    let id, changeCallback;
    tab = this.#scalarField(false);
    id = this.bodyID + '-annotation-scalar-value';
    id = id.replaceAll('-', '\\-');
    input = tab.querySelector("#" + id);
    // callback for user input
    changeCallback = this.#getChangeCallback(signalValid, signalInvalid);
    input.addEventListener("input", changeCallback);
    return tab;
  }

  /**
   * Show the unit input field in the edit state.
   * @param {function} signalValid callback to signal a valid state (and enable save button)
   * @param {function} signalInvalid callback to signal a invalud state (and disable save button)
   * @returns {Node}
   */
  #editUnit(signalValid, signalInvalid) {
    let tab, input;
    let id, changeCallback;
    tab = this.#unitField(false);
    id = this.bodyID + '-annotation-unit-value';
    id = id.replaceAll('-', '\\-');
    input = tab.querySelector("#" + id);
    // callback for user input
    changeCallback = this.#getChangeCallback(signalValid, signalInvalid);
    input.addEventListener("input", changeCallback);
    return tab;
  }

  /**
   * Create the creation state of the QunatBody.
   * @param {function} signalValid callback to signal a valid state (and enable save button)
   * @param {function} signalInvalid callback to signal a invalud state (and disable save button)
   * @returns {Node}
   */
  createElementCreation(signalValid, signalInvalid) {
    let wrapper, p, hline;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'tag-wrapper');

    hline = document.createElement('div');
    hline.setAttribute('class', 'hline');
    wrapper.appendChild(hline);

    p = document.createElement('p');
    p.textContent = "Quant:";
    p.style.fontWeight = "bold";
    wrapper.appendChild(p);

    wrapper.appendChild(this.#editScalar(signalValid, signalInvalid));
    wrapper.appendChild(this.#editUnit(signalValid, signalInvalid));
    // start state is invalid if not all values present
    if (!this.quant || !this.quant.scalar || !this.quant.unit) {
      signalInvalid();
    } else {
      signalValid();
    }
    return wrapper;
  }

  /**
   * Create the edit state of the QunatBody.
   * @param {function} signalValid (optional) callback to signal a valid state (and enable save button)
   * @param {function} signalInvalid (optional) callback to signal a invalud state (and disable save button)
   * @returns {Node}
   */
  createElementEdit(signalValid=null, signalInvalid=null) {
    let element;
    if (signalValid === null) {
      signalValid = () => {this.saveEnabled()};
    }
    if (signalInvalid === null) {
      signalInvalid = () => {this.saveDisabled()};
    }
    element = this.createElementCreation(signalValid, signalInvalid);

    this.setElementContent(element);
    return this.element;
  }

  /**
   * Create the display state of the QunatBody.
   * @returns {Node}
   */
  createElementDisplay() {
    let wrapper, p;
  
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'tag-wrapper');
    // body description
    p = document.createElement('p');
    p.textContent = "QuantBody:";
    p.style.fontWeight = "bold";
    wrapper.appendChild(p);
    // set tag
    wrapper.appendChild(this.#displayScalar());
    wrapper.appendChild(this.#displayUnit());
    this.setElementContent(wrapper);
    
    return this.element;
  }

  /**
   * Body gets focus.
   */
  focus() {
    super.focus();
  }

  isValue(val) {
    return null;
  }

  /**
   * Save the current body state.
   */
  save() {
    this.quant.scalar = document.getElementById(this.bodyID + '-annotation-scalar-value').value;
    this.quant.unit = document.getElementById(this.bodyID + '-annotation-unit-value').value;
    super.save();
  }

  /**
   * Edit the current body state.
   */
  edit() {
    super.edit();
  }

  /**
   * Cancel the edit / creation of the current body state.
   */
  cancel() {
    super.cancel();
  }

  copy() {
    let copy, quant, elem;
    let scalar, unit;
    // get current scalar value
    elem = document.getElementById(this.bodyID + '-annotation-scalar-value');
    if (elem) {
      scalar = elem.value;
    } else if (this.quant !== null) {
      scalar = this.quant.scalar;
    }
    // get current unit value
    elem = document.getElementById(this.bodyID + '-annotation-unit-value');
    if (elem) {
      unit = elem.value;
    } else if (this.quant !== null) {
      unit = this.quant.unit;
    }

    quant = new Quant(scalar, unit);
    copy = new QuantBody(this.state, quant);
    return copy;
  }
}
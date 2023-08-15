/**
 * A simple number input field.
 * @extends {TemplateFragment} implements a template fragment.
 */
class NumberTemplate extends TemplateFragment {
  #value;
  #min;
  #max;
  #step;

  /**
   * Creates a number input fragment.
   * 
   * @param {string} value the initial value (default none)
   * @param {string} label the label of the input
   * @param {number} min the min value (default: none)
   * @param {number} max the max value (default: none)
   * @param {number} step the step size (default: 1)
   */
  constructor(field, name, number=-1, defaultValue=NaN, min=NaN, max=NaN, step="any") {
    super(field, name, number, false);
    this.value = defaultValue;
    this.#min = min;
    this.#max = max;
    this.#step = step;
  }

  /**
   * The input value.
   * @returns {string}
   */
  get value() {
    return this.#value;
  }

  set value(val) {
    this.#value = val;
  }

  toJSON(key) {
    let json = {};

    json.value = this.#value;
    
    return this.#value;
  }

  exportAsTemplate() {
    let json = {};
    
    json.type = "number";
    json.name = this.name;
    if (this.#min) {
      json.min = this.#min;
    }
    if (this.#max) {
      json.max = this.#max;
    }
    if (this.#step) {
      json.step = this.#step;
    }
    
    return json;
  }

  initalizeValue(value) {
    this.#value = value;
  }

  exportCurrentValue() {
    const input = document.getElementById(this.uniqueFragmentId + '-annotation-input-value');
    if (input && input.value) {
      return input.value;
    }
    return null;
  }

  /**
   * Input event handler for the input
   */
  #inputChange(event) {
    this.validState = event.target.checkValidity();
  }

  /**
   * Creates the input field for user input.
   *
   * @param {boolean} disabled - disables the input
   * @returns {HTMLDivElement} the wrapper containing the input
   */

  #inputField(disabled) {
    let wrapper, input;
    wrapper = this.getTemplateNumberInput();

    input = wrapper.getElementsByTagName('input')[0];
    // set parameter
    input.setAttribute('step', this.#step);
    if (!isNaN(this.#min)) {
      input.setAttribute('min', this.#min);
    }
    if (!isNaN(this.#max)) {
      input.setAttribute('max', this.#max);
    }
    input.disabled = disabled;
    input.value = this.value;

    // change callback to signal valid/invalid state
    input.addEventListener("input", event => this.#inputChange(event));
    // init valid state
    input.dispatchEvent(new Event("input"));
    
    return wrapper;
  }

  content(state) {
    let wrapper;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-template-fragment');

    wrapper.appendChild(this.#inputField(state === State.Display));

    return wrapper;
  }

  save() {
    let input;
    input = document.getElementById(this.uniqueFragmentId + '-annotation-input-value');
    this.value = input.value;
  }

  edit() {
    // nothing to do
  }

  cancel() {
    // nothing to do
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
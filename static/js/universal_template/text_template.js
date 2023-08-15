/**
 * A simple number input field.
 * @extends {TemplateFragment} implements a template fragment.
 */
class TextTemplate extends TemplateFragment {
  #value;
  #validation;

  /**
   * Creates a number input fragment.
   * 
   */
  constructor(field, name, number=-1, defaultValue="", validation=".*") {
    super(field, name, number, false);
    this.value = defaultValue;
    this.#validation = validation;
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

    json.type = "SimpleTextBody";
    json.val = this.text;
    
    return this.#value;
  }

  exportAsTemplate() {
    let json = {};
    
    json.type = "text";
    json.name = this.name;
    json.validation = this.#validation;


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
    wrapper = this.getTemplateTextInput();

    input = wrapper.getElementsByTagName('input')[0];
    input.disabled = disabled;
    input.value = this.value;
    input.pattern = this.#validation;

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
/**
 * A simple text input field.
 * @extends {FieldTemplate} implements a field in the body.
 */
class TextField extends FieldTemplate {
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
    return this.#value;
  }

  exportAsTemplate() {
    let json = {};
    
    json.type = "text";
    json.name = this.name;
    json.validation = this.#validation;


    return json;
  }

  initializeValue(value) {
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
    let valid;
    // reset validity message
    event.target.setCustomValidity("");
    // get validity
    valid = event.target.checkValidity()
    if (!valid) {
      event.target.setCustomValidity('Please match the pattern: ' + event.target.pattern);
    }
    event.target.reportValidity();
    // save state
    this.validState = valid;
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

    // check if value is url
    if (disabled && this.#isUrl(this.value)) {
      let href = document.createElement('a');
      href.setAttribute('id', this.uniqueFragmentId + '-annotation-input-reference');
      href.setAttribute('class', 'reference');
      href.href = this.value.slice(5, -1);
      href.target = "_blank";
      href.rel = "noreferrer noopener";
      href.textContent = this.value;
      wrapper.appendChild(href);
      input.hidden = true;
    }
    
    return wrapper;
  }

  content(state) {
    let wrapper;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-template-fragment');

    wrapper.appendChild(this.#inputField(state === State.Display));

    return wrapper;
  }

  #isUrl(str) {
    // Define the regular expression pattern
    var regex = /\\url\{[^\}]+\}/;
    // Test the input string against the pattern
    return regex.test(str);
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
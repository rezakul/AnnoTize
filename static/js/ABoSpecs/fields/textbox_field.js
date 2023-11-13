/**
 * A simple free-text field.
 * @extends {FieldTemplate} implements a field in the body.
 */
class TextboxField extends FieldTemplate {
  #value;
  #maxlength;

  /**
   * Creates a textfield fragment.
   * 
   * @param {string} value the text field (default empty string)
   * @param {string} label the label of the textarea
   * @param {string} description a description to show as a placeholder for user hint
   * @param {boolean} required true if the input is mandatory (default: true)
   * @param {number} maxlen the maximum length of the text entry (NaN for no maxlen, default)
   */
  constructor(field, name, number=-1, defaultValue="", maxlen=NaN) {
    super(field, name, number, false);
    this.#value = defaultValue;
    this.#maxlength = maxlen;
  }

  toJSON(key) {
    return this.#value;
  }

  exportAsTemplate() {
    let json = {};
    
    json.type = "textbox";
    json.name = this.name;
    if (this.#maxlength) {
      json.maxLength = this.#maxlength;
    }

    return json;
  }

  exportCurrentValue() {
    const input = document.getElementById(this.uniqueFragmentId + '-annotation-input-value');
    if (input && input.value) {
      return input.value;
    }
    return null;
  }

  initializeValue(value) {
    this.#value = value;
  }

  /**
   * Input event handler for the textbox
   */
  #inputChange(event) {
    this.validState = event.target.checkValidity();
  }

  /**
   * Creates the textbox for user input.
   * 
   * @param {boolean} disabled - disables the textbox
   * @returns {HTMLDivElement} the wrapper containing the textbox
   */
  #textBox(disabled=false) {
    let wrapper, textArea;

    wrapper = this.getTemplateTextboxInput();

    textArea = wrapper.getElementsByTagName('textarea')[0];

    if (!Number.isNaN(this.#maxlength)) {
      textArea.maxLength = this.#maxlength;
    }

    textArea.value = this.#value;
    textArea.disabled = disabled;
    
    // change callback to signal valid/invalid state
    textArea.addEventListener("input", event => this.#inputChange(event));
    // init valid state
    textArea.dispatchEvent(new Event("input"));

    return wrapper;
  }

  content(state) {
    let wrapper;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-template-fragment');

    wrapper.appendChild(this.#textBox(state === State.Display));

    return wrapper;
  }

  save() {
    const textArea = document.getElementById(this.uniqueFragmentId + '-annotation-input-value');
    this.#value = textArea.value;
  }

  edit() {
    // nothing to do
  }

  cancel() {
    // nothing to do
  }

  focus() {
    const textArea = document.getElementById(this.uniqueFragmentId + '-annotation-input-value');
    textArea.focus();
  }

  copy() {
    // TODO
  }
}
/**
 * A simple number input field.
 * @extends {TemplateFragment} implements a template fragment.
 */
class SelectTemplate extends TemplateFragment {
  #value;
  #optionList;
  #modifiable;
  #validation;

  /**
   * Creates a number input fragment.
   * 
   * @param {string} value the initial value (default none)
   * @param {AdvancedSelect} optionList the otion list values.
   * @param {string} label the label of the input
   * @param {boolean} modifiable if the select is modifiable (i.e. the user can add options dynamically) (default: false)
   * @param {string} validation only relevant if modifiable is true: a validation pattern the input must match
   */
  constructor(field, name, number=-1, defaultValue="", optionList, modifiable=false, validation=".*") {
    super(field, name, number, defaultValue !== "");
    this.value = defaultValue;
    this.#optionList = optionList;
    this.#modifiable = modifiable;
    this.#validation = validation;
    // handle changes on select options
    this.#optionList.emitter.addEventListener('selectChange', event => this.#handleSelectChange(event));
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
    
    json.type = "select";
    json.name = this.name;
    json.selectId = this.#optionList.id;
    json.modifiable = this.#modifiable;
    json.validation = this.#validation;

    return json;
  }

  initalizeValue(value) {
    this.#value = value;
  }

  exportCurrentValue() {
    const input = document.getElementById(this.uniqueFragmentId + '-select');
    if (input && input.value) {
      return input.value;
    }
    return null;
  }

  /**
   * Input event handler for the input
   */
  #inputChange(event) {
    this.validState = event.target.value !== "";
  }

  #addValueEvent(event) {
    if (event.key === 'Enter' && event.target.value && event.target.checkValidity()) {
      this.#optionList.addEntry(event.target.value);
      const select = document.getElementById(this.uniqueFragmentId + '-select');
      if (select) {
        select.value = event.target.value;
        select.dispatchEvent(new Event('change'));
      }
      event.target.value = "";
      event.target.classList.remove('valid');
    }
  }

  #updateColorInput(event) {
    // gray out if duplicate entry
    if (this.#optionList.hasEntry(event.target.value)) {
      event.target.style.color = 'gray';
    } else {
      event.target.style.removeProperty('color');
    }
  }

  /**
   * The underlying select changed. Update the optio list.
   */
  #handleSelectChange() {
    const select = document.getElementById(this.uniqueFragmentId + '-select');
    if (!select) {
      return;
    }
    // remove old option values
    select.replaceChildren();
    // add default value if nothing selected yet
    if (this.value === "") {
      let description;
      description = document.createElement('option');
      description.setAttribute('value', "");
      description.selected = true;
      description.disabled = true;
      description.hidden = true;
      description.textContent = "Select " + this.label;
      select.appendChild(description);
    }
    // add all options
    for (let opt of this.#optionList.optionsSorted) {
      let option;
      option = document.createElement('option');
      option.setAttribute('value', opt);
      option.textContent = opt;
      if (opt === this.#value) {
        option.selected = true;
      }
      select.appendChild(option);
    }
  }

  /**
   * Creates the input field to add option to select.
   * 
   * @returns {HTMLDivElement} the wrapper containing the input
   */

  #inputField() {
    let wrapper, label, input;
    
    wrapper = this.getTemplateTextInput();
    
    label = wrapper.getElementsByTagName('label')[0];
    label.textContent = "Add value to '" + this.name + "':";
    input = wrapper.getElementsByTagName('input')[0];
    input.required = false;
    input.pattern = this.#validation;

    // change callback to signal valid/invalid state
    input.addEventListener("keypress", event => this.#addValueEvent(event));
    input.addEventListener("input", event => this.#updateColorInput(event));
    
    return wrapper;
  }

  /**
   * Creates the input field for user input.
   * 
   * @param {boolean} disabled - disables the input
   * @returns {HTMLDivElement} the wrapper containing the input
   */

  #selectField(disabled) {
    let wrapper, select;
    // get the select wrapper
    wrapper = this.getTemplateSelectWrapper();
    // get the HTMLSelect
    select = wrapper.getElementsByTagName('select')[0];

    // set select options
    if (this.value === "") {
      // add default value if nothing selected yet
      let description;
      description = document.createElement('option');
      description.setAttribute('value', "");
      description.selected = true;
      description.disabled = true;
      description.hidden = true;
      description.textContent = "Select " + this.label;
      select.appendChild(description);
    }
    // add all options
    for (let opt of this.#optionList.optionsSorted) {
      let option;
      option = document.createElement('option');
      option.setAttribute('value', opt);
      option.textContent = opt;
      if (opt === this.#value) {
        option.selected = true;
      }
      select.appendChild(option);
    }

    select.disabled = disabled;
    // change callback to signal valid/invalid state
    select.addEventListener("change", event => this.#inputChange(event));
    
    return wrapper;
  }

  content(state) {
    let wrapper;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-template-fragment');

    if (this.#modifiable && state !== State.Display) {
      wrapper.appendChild(this.#inputField()); 
    }
    wrapper.appendChild(this.#selectField(state === State.Display));

    return wrapper;
  }

  save() {
    let input;
    input = document.getElementById(this.uniqueFragmentId + '-select');
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
    input = document.getElementById(this.uniqueFragmentId + '-select');
    input.focus();
  }

  copy() {
    // TODO
  }
}
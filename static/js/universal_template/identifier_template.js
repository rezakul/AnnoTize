/**
 * The parent identifier template.
 * @extends {TemplateFragment} implements a template fragment.
 */
class IdentifierTemplateQ extends TemplateFragment {
  #identifierId;

  /**
   * Creates a number input fragment.
   * 
   * @param {string} identifierId the initial value (default none)
   * @param {string} label the label of the input
   */
  constructor(name, number, identifierId="") {
    super(name, number, identifierId !== "");
    this.#identifierId = identifierId;
  }

  get identifier() {
    if (this.hasIdentifier()) {
      return runtime.getPlugin('IdentifierBody').getIdentifierForId(this.#identifierId);
    }
    return null;
  }

  hasIdentifier() {
    return this.#identifierId !== "" && runtime.getPlugin('IdentifierBody').hasIdentifierForId(this.#identifierId);
  }

  /**
   * Input event handler for the input
   * 
   * @param {(event) => any} signalChange a callback function to signal a change to body
   */
  #inputChange(event, signalChange) {
    this.validState = event.target.value !== "";
    signalChange();
  }

  getIdentifierFromMenu() {
    let id, identifier;
    id = document.getElementById(this.uniqueFragmentId + "-select").value;
    identifier = runtime.getPlugin('IdentifierBody').getIdentifierForId(id);
    return identifier;
  }

  #createNewIdentifierClickEvent(event) {
    let customId, identifier, identifierId, select;

    customId = event.currentTarget.dataset.customId; 
    // create unique identifier id
    identifierId = runtime.getPlugin('IdentifierBody').createUniqueIdentifierId();
    identifier = new Identifier(identifierId);
    // add identifer
    runtime.getPlugin('IdentifierBody').addIdentifier(identifier);
    // set value in the identifier-selection menu
    select = document.getElementById(customId + "-select");
    select.click();
    select.value = identifierId;
    // signal change
    select.dispatchEvent(new Event("change"));
  }

  #dynamiclyCreateDropdownContent(event) {
    let val, identifiers;
    val = event.target.value;
    event.target.replaceChildren();
    if (val === '') {
      let description;
      description = document.createElement('option');
      description.setAttribute('value', "");
      description.selected = true;
      description.disabled = true;
      description.hidden = true;
      description.textContent = "Select Identifier";
      event.target.appendChild(description);
    }
    identifiers = runtime.getPlugin('IdentifierBody').getAllIdentifierIds();
    for (let identifier of identifiers) {
      let option;
      option = document.createElement('option');
      option.setAttribute('value', identifier);
      option.textContent = identifier;
      event.target.appendChild(option);
      if (val === identifier) {
        option.selected = true;
      }
    }
  }

  #identifierSelectionDropdown(signalChange, identifierCallback) {
    let wrapper, select;

    wrapper = this.getTemplateSelectWrapper();

    select = wrapper.getElementsByTagName('select')[0];
    // set custom event listener
    select.addEventListener('change', event => this.#inputChange(event, signalChange));
    select.addEventListener('change', identifierCallback);
    select.addEventListener('click', this.#dynamiclyCreateDropdownContent);

    // load dropdown menu
    select.click();
    // select current identifier if present
    if (this.identifier) {
      for (let option of select.options) {
        if (option.value === this.identifier.id) {
          option.selected = true;
        }
      }
    }
    
    return wrapper;
  }

  #identifierSelectionFromText() {
    let wrapper, button, icon, label;
    let callbackSelect, callbackType, customId;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-menu-selection');

    button = document.createElement('button');
    button.setAttribute('id', this.uniqueFragmentId + "-click-select-identifier");
    button.setAttribute('class', 'annotation-menu-selection-button');

    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined');
    icon.textContent = "point_scan";
    icon.style.padding = "0px";
    button.appendChild(icon);

    customId = this.uniqueFragmentId;
    callbackSelect = (annotation) => {
      let select;
      select = document.getElementById(customId + "-select");
      select.click();
      select.value = annotation.annotationBody.identifier.id;
      // signal change
      select.dispatchEvent(new Event("change"));
    };
    callbackType = (annotation) => {
      return annotation.annotationType.startsWith('Identifier');
    }
    button.addEventListener('click', (event) => ((callbackSelect, callbackType) => {
        runtime.selectAnnotationFromDocument(callbackSelect, callbackType);
        event.stopPropagation();
    })(callbackSelect, callbackType));

    label = document.createElement('label');
    label.setAttribute('for', this.uniqueFragmentId + "-click-select-identifier");
    label.textContent = "Select from document:";
    label.style.marginRight = "10px";

    wrapper.appendChild(label);
    wrapper.appendChild(button);
    return wrapper;
  }

  #createNewIdentifier() {
    let wrapper, button, icon, label;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-menu-selection');

    button = document.createElement('button');
    button.setAttribute('id', this.uniqueFragmentId + "-click-new-identifier");
    button.setAttribute('class', 'annotation-menu-selection-button');
    button.dataset.customId = this.uniqueFragmentId;

    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined');
    icon.textContent = "add";
    icon.style.padding = "0px";
    button.appendChild(icon);

    button.addEventListener('click', this.#createNewIdentifierClickEvent);

    label = document.createElement('label');
    label.setAttribute('for', this.uniqueFragmentId + "-click-new-identifier");
    label.textContent = "Create a new Identifier:";
    label.style.marginRight = "10px";

    wrapper.appendChild(label);
    wrapper.appendChild(button);
    return wrapper;
  }

  content(state, signalChange, identifierCallback) {
    let wrapper;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-identifier-selection');

    if (state === State.Display) {
      let label, button;
      label = document.createElement('label');
      label.setAttribute('for', this.uniqueFragmentId + '-annotation-identifier-value');
      label.setAttribute('class', 'annotation-display-label');
      label.textContent = this.label + ":";

      button = document.createElement('button');
      button.setAttribute('id', this.uniqueFragmentId + '-annotation-identifier-value');
      button.setAttribute('class', 'annotation-sidebar-button');
      button.textContent = this.identifier.id;
      button.dataset.customId = this.uniqueFragmentId;
 
      button.addEventListener('click', (event) => {
        let target;

        target = runtime.getPlugin('IdentifierBody').getIdentifierForId(event.currentTarget.textContent);
        if (target.hasDeclaration()) {
          event.target.dataset.target = target.declaration.annotation.id;
          runtime.gotoAnnotation(event);
        } else {
          console.warn('No declaration defined');
        }
      });

      wrapper.appendChild(label);
      wrapper.appendChild(button);
    } else {
      let div, span;
      div = document.createElement('div');
      div.style.marginBottom = "12px";
      div.style.paddingLeft = "5px";
      span = document.createElement('span');
      span.textContent = "or";
      div.appendChild(span);
  
      wrapper.appendChild(this.#identifierSelectionDropdown(signalChange, identifierCallback));
      wrapper.appendChild(this.#identifierSelectionFromText());
      wrapper.appendChild(div);
      wrapper.appendChild(this.#createNewIdentifier());
    }

    return wrapper;
  }

  save() {
    let input;
    input = document.getElementById(this.uniqueFragmentId + '-select');
    this.#identifierId = input.value;
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
class CommonIdentifierBody extends AnnotationBody {
  #identifier;
  /**
   * Creates a IdentifierBody.
   * @param {State} state the state of the annotation
   */
  constructor(state, identifier) {
    super(state);
  
    this.#identifier = identifier;
  }

  get identifier() {
    return this.#identifier;
  }

  set identifier(val) {
    this.#identifier = val;
  }

  getIdentifierFromMenu() {
    let id, identifier;
    id = document.getElementById(this.bodyID + "-dropdown-select-identifier").value;
    identifier = runtime.getPlugin('IdentifierBody').getIdentifierForId(id);
    return identifier;
  }

  #identifierSelectChangeEvent(event) {
    let identifier, select;
    let hasDecl;
    identifier = runtime.getPlugin('IdentifierBody').getIdentifierForId(event.target.value);
    // enable the type selection
    select = document.getElementById(event.target.dataset.customId + '-dropdown-identifier-type');
    select.disabled = false;
    select.value = "";
    // disable declaration option if identifer has alread a declaration
    hasDecl = identifier.hasDeclaration();
    select.options[1].disabled = hasDecl;
    if (hasDecl) {
      select.options[2].selected = true;
      select.dispatchEvent(new Event('change'));
      event.stopPropagation();
    }
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
    select = document.getElementById(customId + "-dropdown-select-identifier");
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

  #identifierSelectionDropdown(signalValid, identifierCallback) {
    let wrapper, select, label;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-identifier-selection-dropdown');

    label = document.createElement('label');
    label.textContent = 'Identifier-ID:';
    label.setAttribute('class', 'annotation-creation-label');
    label.setAttribute('for', this.bodyID + '-dropdown-select-identifier');
    wrapper.appendChild(label);

    select = document.createElement('select');
    select.setAttribute('id', this.bodyID + "-dropdown-select-identifier");
    select.setAttribute('class', 'annotation-sidebar-select');
    select.required = true;
    select.dataset.customId = this.bodyID;
    select.addEventListener('change', signalValid);
    select.addEventListener('change', identifierCallback);
    select.addEventListener('click', this.#dynamiclyCreateDropdownContent);

    wrapper.appendChild(select);
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
    button.setAttribute('id', this.bodyID + "-click-select-identifier");
    button.setAttribute('class', 'annotation-menu-selection-button');

    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined');
    icon.textContent = "point_scan";
    icon.style.padding = "0px";
    button.appendChild(icon);

    customId = this.bodyID;
    callbackSelect = (annotation) => {
      let select;
      select = document.getElementById(customId + "-dropdown-select-identifier");
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
    label.setAttribute('for', this.bodyID + "-click-select-identifier");
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
    button.setAttribute('id', this.bodyID + "-click-new-identifier");
    button.setAttribute('class', 'annotation-menu-selection-button');
    button.dataset.customId = this.bodyID;

    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined');
    icon.textContent = "add";
    icon.style.padding = "0px";
    button.appendChild(icon);

    button.addEventListener('click', this.#createNewIdentifierClickEvent);

    label = document.createElement('label');
    label.setAttribute('for', this.bodyID + "-click-new-identifier");
    label.textContent = "Create a new Identifier:";
    label.style.marginRight = "10px";

    wrapper.appendChild(label);
    wrapper.appendChild(button);
    return wrapper;
  }

  identifierSelection(signalValid, identifierCallback) {
    let wrapper, p, div, span;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-identifier-selection');

    p = document.createElement('p');
    p.textContent = 'Identifier:';
    p.style.fontWeight = "bold";
    wrapper.appendChild(p);

    div = document.createElement('div');
    div.style.marginBottom = "12px";
    div.style.paddingLeft = "5px";
    span = document.createElement('span');
    span.textContent = "or";
    div.appendChild(span);

    wrapper.appendChild(this.#identifierSelectionDropdown(signalValid, identifierCallback));
    wrapper.appendChild(this.#identifierSelectionFromText());
    wrapper.appendChild(div);
    wrapper.appendChild(this.#createNewIdentifier());

    return wrapper;
  }
}
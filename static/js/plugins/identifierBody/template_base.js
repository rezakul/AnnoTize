/**
 * The template for the grounding body
 * @extends {AbstractTemplateBody} extends the abstract template structure. 
 */
class IdentifierTemplate extends AbstractTemplateBody {
  #identifier;
  #autorefresh;
  #autocreate;

  /**
   * The abstract template for an identifier (declaration or occurrence)
   * @param {string} identifier the identifier
   * @param {boolean} autorefresh if the identifier should be the last selected identifier
   * @param {boolean} autocreate if the identifier should be createt automatically
   */
  constructor(identifier="", autorefresh=false, autocreate=false) {
    super();
    this.#identifier = identifier;
    this.#autorefresh = autorefresh;
    this.#autocreate = autocreate;
  }

  get identifier() {
    return this.#identifier;
  }

  get autorefresh() {
    return this.#autorefresh;
  }

  get autocreate() {
    return this.#autocreate;
  }

  #identifierSelectionDropdown() {
    let wrapper, select, label;
    let identifiers;

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
    
    if (!this.#identifier) {
      let description;
      description = document.createElement('option');
      description.setAttribute('value', "");
      description.selected = true;
      description.disabled = true;
      description.hidden = true;
      description.textContent = "Select Identifier";
      select.appendChild(description);
    }
    identifiers = runtime.getPlugin('IdentifierBody').getAllIdentifierIds();
    for (let identifier of identifiers) {
      let option;
      option = document.createElement('option');
      option.setAttribute('value', identifier);
      option.textContent = identifier;
      select.appendChild(option);
      if (this.#identifier === identifier) {
        option.selected = true;
      }
    }
    wrapper.appendChild(select);

    // disable select if in template mode and useLastId defined
    if (this.#autorefresh || this.#autocreate) {
      select.disabled = true;
    }
    
    return wrapper;
  }

  #templateUseLastIdentifier() {
    let wrapper, label, checkbox;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-template-last-id');

    label = document.createElement('label');
    label.textContent = 'Use last selected Identifier:';
    label.setAttribute('class', 'annotation-creation-label');
    wrapper.appendChild(label);
    
    checkbox = document.createElement('input');
    checkbox.setAttribute('id', this.bodyID + '-use-last-identifier');
    checkbox.setAttribute('type', 'checkbox');
    checkbox.dataset.customId = this.bodyID;
    label.appendChild(checkbox);

    checkbox.addEventListener('change', (event) => {
      const select = document.getElementById(event.target.dataset.customId + '-dropdown-select-identifier');
      const box = document.getElementById(event.target.dataset.customId + '-autocreate-new-identifier');
      
      select.disabled = event.target.checked;
      box.disabled = event.target.checked;
    });
    if (this.#autorefresh) {
      checkbox.checked = true;
    }
    if (this.#autocreate) {
      checkbox.disabled = true;
    }

    return wrapper;
  }

  #templateAutocreateNewIdentifier() {
    let wrapper, label, checkbox;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-template-last-id');

    label = document.createElement('label');
    label.textContent = 'Autocreate new Identifier:';
    label.setAttribute('class', 'annotation-creation-label');
    wrapper.appendChild(label);
    
    checkbox = document.createElement('input');
    checkbox.setAttribute('id', this.bodyID + '-autocreate-new-identifier');
    checkbox.setAttribute('type', 'checkbox');
    checkbox.dataset.customId = this.bodyID;
    label.appendChild(checkbox);

    checkbox.addEventListener('change', (event) => {
      const select = document.getElementById(event.target.dataset.customId + '-dropdown-select-identifier');
      const box = document.getElementById(event.target.dataset.customId + '-use-last-identifier');
      
      select.disabled = event.target.checked;
      box.disabled = event.target.checked;
    });
    if (this.#autocreate) {
      checkbox.checked = true;
    }
    if (this.#autorefresh) {
      checkbox.disabled = true;
    }

    return wrapper;
  }

  identifierSelection() {
    let wrapper, p;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-identifier-selection');

    p = document.createElement('p');
    p.textContent = 'Identifier:';
    p.style.fontWeight = "bold";
    wrapper.appendChild(p);

    wrapper.appendChild(this.#templateUseLastIdentifier());
    wrapper.appendChild(this.#templateAutocreateNewIdentifier());
    wrapper.appendChild(this.#identifierSelectionDropdown());

    return wrapper;
  }

  save() {
    this.#identifier = document.getElementById(this.bodyID + '-dropdown-select-identifier').value;
    this.#autorefresh = document.getElementById(this.bodyID + '-use-last-identifier').checked;
    this.#autocreate = document.getElementById(this.bodyID + '-autocreate-new-identifier').checked;
  }

}
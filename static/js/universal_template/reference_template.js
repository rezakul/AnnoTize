/**
 * The parent identifier template.
 * @extends {TemplateFragment} implements a template fragment.
 */
class ReferenceTemplate extends TemplateFragment {
  #reference;
  #role;
  #referencedTypes;
  #referencedId;
  // referenced annotation
  #refrerencedAnnotation;
  // use the last interacted (suitable) annotation as the reference
  #useLastAnnotationAsReference;
  // reference removal callback
  #deleteAnnotationCallback;
  // referenced annotation color changes
  #colorChangeCallback;

  /**
   * Creates a reference fragment.
   * 
   * @param {AbstractField} field the abstract field this fragment belongs to
   * @param {string} name the name of the input field
   * @param {number} number the number of the input in the input field
   * @param {string} role the reference role (target or source)
   * @param {string} referencedId the id of the referenced annotation
   * @param {string} label the label of the input
   * @param {boolean} undirected if the relation has no direction (default: false)
   * @param {Array<string>} referencedTypes the allowed annotation type of the referenced annotation
   */
  constructor(field, name, number=-1, role, label, referencedTypes, undirected=false, defaultValue) {
    super(field, name, number, false);
    this.#reference = new Reference("id-" + self.crypto.randomUUID(), undefined, undefined, label, undirected);
    this.#role = role;
    if (!role || !['target', 'source'].includes(role)) {
      this.#role = 'source';
      if (!undirected) {
        console.warn('Unknown role: ' + role + ". Setting role to source...");
      }
    }
    if (defaultValue) {
      this.#referencedId = defaultValue.referencedId;
      this.#useLastAnnotationAsReference = defaultValue.ulaar;
    } else {
      this.#useLastAnnotationAsReference = false;
    }
   
    this.#referencedTypes = referencedTypes;
    // listen to global annotation removal in case this fragment is not saved yet
    this.#deleteAnnotationCallback = event => this.#referencedAnnotationRemove(event)
    runtime.emitter.addEventListener('deleteAnnotation', this.#deleteAnnotationCallback);

    // set last interacted annotation as reference if flag set
    if (this.#useLastAnnotationAsReference) {
      this.#referencedId = runtime.getLastInteractionWithConcept(this.#referencedTypes);
    }
    this.#colorChangeCallback = event => this.#colorChangeEvent(event);
  }

  get color() {
    if (this.#refrerencedAnnotation) {
      return this.#refrerencedAnnotation.color;
    }
    return null
  }
  
  toJSON(key) {
    let json = {};

    json.value = this.#referencedId;
    
    return this.#referencedId;
  }

  exportAsTemplate() {
    let json = {};
    
    json.type = "reference";
    json.name = this.name;
    json.referencedTypes = this.#referencedTypes;
    json.referenceRole = this.#role;
    json.label = this.#reference.label;
    
    return json;
  }

  initalizeValue(value) {
    this.#referencedId = value;
    this.#saveReference(value);
    // set reference object
    this.#refrerencedAnnotation = runtime.getAnnotationForId(this.#referencedId);
    // add event listener for color changes
    this.#referenceEmitter().addEventListener('colorChange', this.#colorChangeCallback);
  }

  exportCurrentValue() {
    let result = {};
    const input = document.getElementById(this.uniqueFragmentId + '-select');
    result.ulaar = this.#useLastAnnotationAsReference;
    if (input && input.value) {
      result.referencedId = input.value;
    }
    return result;
  }

  #colorChangeEvent(event) {
    this.body.annotationObject.updateColor(event.detail.color, event.detail.distributor);
  }

  #referencedAnnotationRemove(event) {
    if (event.type !== 'deleteAnnotation') {
      return;
    }
    if (this.body.state === State.Display) {
      if (event.detail.id !== this.#referencedId) {
        return;
      }
      const button = document.getElementById(this.uniqueFragmentId + '-referenced-annotation');
      button.textContent = "???";
      this.validState = false;
      this.#refrerencedAnnotation = null;
      this.#referencedId = "";
    } else {
      const select = document.getElementById(this.uniqueFragmentId + '-select');
      if (event.detail.id !== select.value) {
        return;
      }
      select.value = "";
      select.click();
      this.validState = false;
    }
  }

  /**
   * Input event handler for the input
   */
  #inputChange(event) {
    this.validState = event.target.value !== "";
  }

  #dynamiclyCreateDropdownContent(event) {
    const val = event.target.value;
    const options = runtime.getAnnotationIdsWithConceptType(this.#referencedTypes)
    event.target.replaceChildren();
    if (val === '') {
      let description;
      description = document.createElement('option');
      description.setAttribute('value', "");
      description.selected = true;
      description.disabled = true;
      description.hidden = true;
      description.textContent = "Select " + this.name;
      event.target.appendChild(description);
    }
    for (let opt of options) {
      let option;
      option = document.createElement('option');
      option.setAttribute('value', opt);
      option.textContent = opt;
      event.target.appendChild(option);
      if (val === opt) {
        option.selected = true;
      }
    }
  }

  #identifierSelectionDropdown() {
    let wrapper, select;

    wrapper = this.getTemplateSelectWrapper();

    select = wrapper.getElementsByTagName('select')[0];
    // set custom event listener
    select.addEventListener('change', event => this.#inputChange(event));
    // select.addEventListener('change', identifierCallback);
    select.addEventListener('click', event => this.#dynamiclyCreateDropdownContent(event));

    // load dropdown menu
    select.click();
    // select current identifier if present
    if (this.#referencedId) {
      for (let option of select.options) {
        if (option.value === this.#referencedId) {
          option.selected = true;
        }
      }
      // signal change that may occure
      select.dispatchEvent(new Event('change'));
    }
    
    return wrapper;
  }

  #selectAnnotationFromHTMLCallback(annotation, fragmentId) {
    let select;
    select = document.getElementById(fragmentId + "-select");
    select.click();
    select.value = annotation.id;
    // signal change
    select.dispatchEvent(new Event("change"));
  }

  #identifierSelectionFromText() {
    let wrapper, button, icon, label;
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

    const callback = annotation => this.#selectAnnotationFromHTMLCallback(annotation, this.uniqueFragmentId);

    button.addEventListener('click', event => runtime.selectAnnotationFromDocument(event, callback, this.#referencedTypes));
    label = document.createElement('label');
    label.setAttribute('for', this.uniqueFragmentId + "-click-select-identifier");
    label.textContent = "Select from document:";
    label.style.marginRight = "10px";

    wrapper.appendChild(label);
    wrapper.appendChild(button);
    return wrapper;
  }

  #useLastAsReferenceEvent(event) {
    this.#useLastAnnotationAsReference = event.target.checked;
  }

  #useLastAsReference() {
    let wrapper, label, checkbox;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-template-advanced');

    label = document.createElement('label');
    if (this.number !== -1) {
      label.textContent = "Use last annotation as reference [" + this.number + "]:";
    } else {
      label.textContent = "Use last annotation as reference:";
    }
    
    label.setAttribute('class', 'annotation-creation-label');
    wrapper.appendChild(label);
    
    checkbox = document.createElement('input');
    checkbox.setAttribute('id', this.bodyID + '-show-header');
    checkbox.setAttribute('type', 'checkbox');
    checkbox.dataset.customId = this.bodyID;
    label.appendChild(checkbox);

    checkbox.addEventListener('change', event => this.#useLastAsReferenceEvent(event));
    checkbox.checked = this.#useLastAnnotationAsReference;

    return wrapper;
  }

  content(state) {
    let wrapper;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-template-fragment');

    if (state === State.Display) {
      let label, button;
      label = document.createElement('label');
      label.setAttribute('for', this.uniqueFragmentId + '-referenced-annotation');
      label.setAttribute('class', 'annotation-display-label');
      label.textContent = this.label;

      button = document.createElement('button');
      button.setAttribute('id', this.uniqueFragmentId + '-referenced-annotation');
      button.setAttribute('class', 'annotation-sidebar-button');
      button.dataset.customId = this.uniqueFragmentId;
      if (this.#role === 'target') {
        button.textContent = this.#reference.source;
      } else {
        button.textContent = this.#reference.target;
      }
 
      button.addEventListener('click', (event) => {
        // TODO
      });

      wrapper.appendChild(label);
      wrapper.appendChild(button);
    } else {
      if (state === State.Template) {
        wrapper.appendChild(this.#useLastAsReference());
      }
      wrapper.appendChild(this.#identifierSelectionDropdown());
      wrapper.appendChild(this.#identifierSelectionFromText());
    }

    return wrapper;
  }

  #saveReference(value) {
    if (this.#role === 'target') {
      // check if new source
      if (this.#reference.source !== value) {
        // overwrite old source
        this.#reference.setSource(value);
      }
      // check if target already set
      if (!this.#reference.hasTarget()) {
        // set self as target if not already set
        this.#reference.setTarget(this.body.annotationObject.id);
      }
    } else {
      // check if new target
      if (this.#reference.target !== value) {
        // overwrite old source
        this.#reference.setTarget(value);
      }
      // check if target already set
      if (!this.#reference.hasSource()) {
        // set self as source if not already set
        this.#reference.setSource(this.body.annotationObject.id);
      }
    }
  }

  #referenceEmitter() {
    if (!this.#referencedId || !runtime.hasAnnotationForId(this.#referencedId)) {
      return null;
    }
    return runtime.getAnnotationForId(this.#referencedId).annotationBody.emitter;
  }

  save() {
    let value;
    value = document.getElementById(this.uniqueFragmentId + '-select').value;
    this.#saveReference(value);
    this.#referencedId = value;
    this.#refrerencedAnnotation = runtime.getAnnotationForId(this.#referencedId);
    this.#referenceEmitter().addEventListener('colorChange', this.#colorChangeCallback);
  }

  edit() {
    const emitter = this.#referenceEmitter();
    if (emitter) {
      emitter.removeEventListener('colorChange', this.#colorChangeCallback);
    }
  }

  cancel() {
    this.#referenceEmitter().addEventListener('colorChange', this.#colorChangeCallback);
  }

  remove() {
    this.#reference.remove();
    // remove event listener
    runtime.emitter.removeEventListener('deleteAnnotation', this.#deleteAnnotationCallback);
    const emitter = this.#referenceEmitter();
    if (emitter) {
      emitter.removeEventListener('colorChange', this.#colorChangeCallback);
    }
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
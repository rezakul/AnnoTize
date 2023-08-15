/*
type RGB = `rgb(${number}, ${number}, ${number})`;
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
type HEX = `#${string}`;

type Color = RGB | RGBA | HEX;
*/

class TemplateBody {
  // the current state of the annotation
  #state;
  // indicates if annotation is in a valid state (i.e. all fields are set by the user)
  #validState;
  // the html element that is displayed in the sidebar
  #element;
  // the sidebar element this body belongs to
  #sidebarElement;
  // the corresponding annotation object
  #annotationObject;
  // a unique id for this body
  #uniqueBodyID;
  // all references containing this body
  #referenceMap;
  
  // saves the old style during the 'Edit' phase
  #oldStyle;
  // saves the old target during the 'Edit' phase
  #oldFragmentTarget;

  // show the header if concept is defined
  #showHeader;

  // emitter to signal changes
  #emitter;

  // flag that this annotation is not a real annotation but rather a TODO-Highlight
  #highlightState = false;
  #todoState = false;

  // callback for concept changes
  #conceptChangeCallback;

  static annotationStyle = 'default';
  static annotationStyleOverwritable = true;

  // the name of the concept
  #name;
  // the decription of the concept
  #description;
  // rdftype of the concept
  #rdftype;
  // the template fields the body consists of
  #fields = [];
  // annotation style
  #style;
  // style overwritable
  #styleOverwritable;
  // concept selection menu
  #conceptSelect;
  
  /**
   * Constructs a annotation body element.
   * @param {State} state - the state of the annotation
   * @param {Object} concept - the concept template the body implements.
   */
  constructor(state, concept, showHeader=true) {
    // set current state
    this.#state = state;
    // create new unique id
    this.#uniqueBodyID = "id-" + self.crypto.randomUUID();
    // initialize the html element
    this.#element = this.#initializeElement();
    // setup emitter
    this.#emitter = new EventTarget();
    // show header
    this.#showHeader = showHeader;
    // set up concept
    if (concept !== undefined) {
      this.#initializeConcept(concept);
      // style setup
      let conceptClass = runtime.getConceptForName(concept.name);
      this.#style = conceptClass.style;
      this.#styleOverwritable = conceptClass.styleOverwritable;
    }
    if (concept === undefined && !(state === State.Creation || state === State.Template)) {
      throw Error('Unsupported state: needs concept');
    }
    this.#referenceMap = new Map();
    // listen to validity changes
    this.emitter.addEventListener('validityChange', event => this.#fragmentChangeCallback(event));
    if (state === State.Creation) {
      // react to changes in concepts -> remove once body is first saved
      this.#conceptChangeCallback = event => this.#handleConceptListChange(event);
      conceptPlugin.emitter.addEventListener('conceptListChange', this.#conceptChangeCallback);
    }
  }

  /**
   * Get the state of the annotation.
   * @returns {State}
   */
  get state() {
    return this.#state;
  }

  set state(val) {
    this.#state = val;
  }

  /**
   * A emitter to signal changes
   * @returns {EventTarget}
   */
  get emitter() {
    return this.#emitter;
  }

  /**
   * Get the html element for this annotation body.
   * @returns {HTMLDivElement} The body element
   */
  get element() {
    return this.#element;
  }

  /**
   * Get the parent sidebar element the annotation body belongs to.
   * @returns {AnnotationSidbarElement} The annotation sidebar object
   */
  get sidebarElement() {
    return this.#sidebarElement;
  }

  /**
   * The annotation object.
   * @returns {AnnotationObject} sThe annotation object
   */
  get annotationObject() {
    return this.#annotationObject;
  }

  /**
   * The highlight color for this element as a css color.
   * @returns {Color} The current color
   */
  get color() {
    if (!this.#name) {
      return "#FF5F1F";
    }
    let color;
    for (let field of this.#fields) {
      if (field.color) {
        color = field.color;
      }
    }
    if (color) {
      return color;
    }
    if (runtime.getConceptForName(this.#name)) {
      return runtime.getConceptForName(this.#name).color;
    } else {
      return "#FF5F1F";
    }
  }

  /**
   * The annotation is visible
   * @returns {boolean} True if visible
   */
  get visibility() {
    return true;
  }

  /**
   * The unique body id
   * @returns {string} The unique body id
   */
  get bodyID() {
    return this.#uniqueBodyID;
  }

  /**
   * Indicates if body is currently in a valid state.
   * @returns {boolean}
   */
  get validState() {
    return this.#validState;
  }

  set validState(valid) {
    this.#validState = valid;
  }

  get conceptName() {
    return this.#name;
  }

  get showHeader() {
    return this.#showHeader;
  }

  /**
   * Export this annotation body to json.
   * 
   * @param {any} key a key may given by JSON.stringify()
   * @returns {object} (JSON) stringifyable object
   */
  toJSON(key) {
    let json = {};

    json.type = this.#name;
    for (let field of this.#fields) {
      if (field.hasContent()) {
        json[field.name] = field;
      }
    }
    
    return json;
  }

  initalizeValues(values) {
    for (let field of this.#fields) {
      field.initalizeValues(values[field.name]);
    }
  }

  #handleConceptListChange(event) {
    // should be in creation state
    if (this.state !== State.Creation) {
      console.warn('Unexpected state');
      return;
    }
    let description;
    const select = this.#conceptSelect;
    if (!select) {
      console.warn('Concept-Select not found...');
    }

    // reset select
    select.replaceChildren();

    // create new select content
    description = document.createElement('option');
    description.setAttribute('value', "");
    description.selected = true;
    description.disabled = true;
    description.hidden = true;
    description.textContent = "Choose ABoSpec";
    select.appendChild(description);
    
    for (let concept of runtime.conceptNames) {
      let option = document.createElement('option');
      option.setAttribute('value', concept);
      option.textContent = concept;
      option.selected = concept === this.#name;
      select.appendChild(option);
    }
    
    if (select.value === "") {
      // selected concept was removed -> what to do?
    }
  }

  /**
   * Add a reference to the body.
   * @param {Reference} reference the reference to add
   * @returns {boolean} true on success
   */
  addReference(reference) {
    if (this.#referenceMap.has(reference.id)) {
      return false;
    }
    this.#referenceMap.set(reference.id, reference);
    return true;
  }

  /**
   * Remove a reference from the body
   * @param {string} referenceId the id of the reference to remove
   * @returns {boolean} true on success
   */
  removeReference(referenceId) {
    return this.#referenceMap.delete(referenceId);
  }

  getHighlightClass() {
    return "";
  }

  /**
   * 
   * @param {string} color 
   * @param {Array<string>} distributor 
   * @returns 
   */
  updateColor(color, distributor) {
    // assumes the field that initiated the color change has already defined a new color 
    if (color !== this.color) {
      return;
    }
    // check if update already processed -> this way no recursion can occure
    if (distributor && distributor.includes(this.annotationObject.id)) {
      return;
    } else if (!distributor) {
      distributor = [];
    }
    distributor.push(this.annotationObject.id);
    this.emitter.dispatchEvent(new CustomEvent('colorChange', {detail: { color: color, distributor: distributor},} ));
  }

  /**
   * Enable the save button in the sidebar entry.
   */
  enableSave() {
    this.sidebarElement.saveEnabled(true);
  }

  /**
   * Disable the save button in the sidebar entry.
   */
  disableSave() {
    this.sidebarElement.saveEnabled(false);
  }

  /**
   * Register the corresponding sidebar element. 
   * @param {AnnotationSidbarElement} sidebarElement - the parent sidebar element
   */
  registerSidebarElement(sidebarElement) {
    this.#sidebarElement = sidebarElement;
  }

  /**
   * Register the corresponding annotation element this body belongs to. 
   * @param {AnnotationObject} sidebarElement - the annotation object element
   */
  registerAnnotation(annotationObject) {
    this.#annotationObject = annotationObject;
    if (this.#name) {
      runtime.setLastInteractionWithConcept(this.#name, this.#annotationObject.id);
    }
  }

  exportAsTemplate() {
    if (!this.#name) {
      return undefined;
    }
    let json, fields;
    json = {};

    json.name = this.#name;
    json.description = this.#description;
    json.rdftype = this.#rdftype;    

    fields = [];
    for (let field of this.#fields) {
      fields.push(field.exportAsTemplate());
    }
    json.fields = fields;
  
    return json;
  }

  /**
   * Initialize / parse the concept
   * @param {Object} the concept
   */
  #initializeConcept(concept) {
    // parse concept body values
    this.#name = concept.name;
    this.#description = concept.description;
    this.#rdftype = concept.rdftype;
    
    // register concept
    if (this.#annotationObject) {
      runtime.setLastInteractionWithConcept(this.#name, this.#annotationObject.id);
    }
    // parse concept input fields
    this.#fields = [];
    for (let conceptField of concept.fields) {
      let fieldGenerator, field;
      switch (conceptField.type) {
        case 'textbox':
          fieldGenerator = (abstrField, number, defaultValue) => { return new TextboxTemplate(abstrField, conceptField.name, number, defaultValue, conceptField.maxLength) };
          break;
        case 'text':
          fieldGenerator = (abstrField, number, defaultValue) => { return new TextTemplate(abstrField, conceptField.name, number, defaultValue, conceptField.validation) };
          break;
        case 'number':
          fieldGenerator = (abstrField, number, defaultValue) => { return new NumberTemplate(abstrField, conceptField.name, number, defaultValue, conceptField.min, conceptField.max, conceptField.step) };
          break;
        case 'select':
          const sel = advancedSelectPlugin.getSelectForId(conceptField.selectId);
          fieldGenerator = (abstrField, number, defaultValue) => { return new SelectTemplate(abstrField, conceptField.name, number, defaultValue, sel, conceptField.modifiable, conceptField.validation) };
          break;
        case 'reference':
          fieldGenerator = (abstrField, number, defaultValue) => { return new ReferenceTemplate(abstrField, conceptField.name, number, conceptField.referenceRole, conceptField.label, conceptField.referencedTypes, conceptField.undirected, defaultValue)};
          break;
        case 'tag':
          fieldGenerator = (abstrField, number, defaultValue) => { return new TagTemplate(abstrField, conceptField.name, number, defaultValue)};
          break;
        default:
          console.error('Unknown field type: ', conceptField.type);
          continue;
      }
      field = new AbstractField(this, fieldGenerator, conceptField.name, conceptField.number, conceptField.default);
      this.#fields.push(field);
    }
  }

  #setConceptEvent(event) {
    let oldStyle = this.#style;
    const concept = runtime.getConceptForName(event.target.value);
    // save style
    this.#style = concept.style;
    this.#styleOverwritable = concept.styleOverwritable;
    // remove old concept (notify concept fragments)
    for (let field of this.#fields) {
      field.remove();
    }
    // set new concept
    this.#initializeConcept(concept.concept);
    // remove todo
    if (this.#state !== State.Template) {
      this.#todoState = false;
      this.#annotationObject.flagTODO = false;
    }
    // refresh HTMLDiv element
    this.refreshElementConcept();
    // set new annotation style
    if (oldStyle !== this.#style) {
      if (this.annotationObject) {
        runtime.changeAnnotationStyle(this.annotationObject.annotationId, this.#style);
      }
    }
  }

  /**
   * Initializes this annotation body element.
   */
  #initializeElement() {
    let elem;

    elem = document.createElement('div');
    elem.setAttribute('id', this.bodyID + '-annotation-body');
    elem.setAttribute('class', 'annotation-body');

    return elem;
  }

  #fragmentChangeCallback(event) {
    if (this.state === State.Template) {
      return;
    }
    if (!event || event.detail.valid !== this.validState) {
      let valid = true;
      for (let field of this.#fields) {
        valid = valid && field.valid();
      }
      if (valid && !this.validState) {
        this.enableSave();
      }
      if (!valid && this.validState) {
        this.disableSave();
      }
      this.validState = valid;
    }
  }

  refreshElementConcept() {
    // save header
    const header = this.#element.firstChild;
    // remove old content
    this.#element.replaceChildren();
    // set header again
    this.#element.appendChild(header);
    // show / hide style menu
    const styleMenu = document.getElementById(this.bodyID + '-annotation-style-selection');
    if (styleMenu) {
      styleMenu.style.display = this.#styleOverwritable ? 'block' : 'none';
    }
    // set concept content
    this.#element.appendChild(this.#conceptContent());
    // initialize valid state
    this.#fragmentChangeCallback();
  }

  #convertButton() {
    let wrapper, button, icon, label;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-menu-selection');
    wrapper.style.marginBottom = "15px";

    button = document.createElement('button');
    button.setAttribute('id', this.bodyID + "-convert-to-annotation");
    button.setAttribute('class', 'annotation-menu-selection-button');

    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined');
    icon.textContent = "format_ink_highlighter";
    icon.style.padding = "0px";
    button.appendChild(icon);

    button.addEventListener('click', event => this.#convertToAnnotation(event));
    label = document.createElement('label');
    label.setAttribute('for', this.bodyID + "-convert-to-annotation");
    label.textContent = "Convert to annotation:";
    label.style.marginRight = "10px";

    wrapper.appendChild(label);
    wrapper.appendChild(button);
    return wrapper;
  }

  #conceptContent() {
    let wrapper, div, hline, todo, p;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-template-concept');
    // set title
    hline = document.createElement('div');
    hline.setAttribute('class', 'hline');
    wrapper.appendChild(hline);

    div = document.createElement('div');
    div.setAttribute('class', 'abospec-header');
    wrapper.appendChild(div);

    p = document.createElement('p');
    p.setAttribute('class', 'abospec-name');
    p.textContent = this.#name + ":";
    div.appendChild(p);

    
    if (this.#todoState || this.state === State.Edit || this.state === State.Creation) {
      todo = document.createElement('i');
      todo.setAttribute('class', 'material-symbols-outlined todo-button prevent-select');
      todo.textContent = "flag_circle";
      if (this.state === State.Edit || this.state === State.Creation) {
        todo.classList.add('material-symbols-hover');
        todo.addEventListener('click', event => this.#todoButtonEvent(event));
      }
      if (this.#todoState) {
        todo.style.color = 'orange';
      }
      div.appendChild(todo);
    }

    if (this.state === State.Edit && this.#highlightState) {
      let hline2;
      wrapper.appendChild(this.#convertButton());
      hline2 = document.createElement('div');
      hline2.setAttribute('class', 'hline2');
      wrapper.appendChild(hline2);
    }

    for (let field of this.#fields) {
      let elem, hline2;
      // add field content
      elem = field.content(this.state);
      wrapper.appendChild(elem);
      if (this.state !== State.Display) {
        // line to seperate different fields
        hline2 = document.createElement('div');
        hline2.setAttribute('class', 'hline2');
        wrapper.appendChild(hline2);
      }
    }
    // make line at end
    if (this.state === State.Display) {
      hline = document.createElement('div');
      hline.setAttribute('class', 'hline');
      wrapper.appendChild(hline);
    } else {
      // overwrite class
      wrapper.lastChild.setAttribute('class', 'hline');
    }
    return wrapper;
  }

  #showHeaderEvent(event) {
    this.#showHeader = event.target.checked;
  }

  #showHeaderOnCreation() {
    let wrapper, label, checkbox;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-template-advanced');

    label = document.createElement('label');
    label.textContent = 'Show header:';
    label.setAttribute('class', 'annotation-creation-label');
    wrapper.appendChild(label);
    
    checkbox = document.createElement('input');
    checkbox.setAttribute('id', this.bodyID + '-show-header');
    checkbox.setAttribute('type', 'checkbox');
    checkbox.dataset.customId = this.bodyID;
    label.appendChild(checkbox);

    checkbox.addEventListener('change', event => this.#showHeaderEvent(event));
    checkbox.checked = this.#showHeader;

    return wrapper;
  }

  /**
   * Creates an annotation body from the given template.
   * The annotation body will be displayed in the sidebar.
   * 
   * @returns {HTMLDivElement} the template body
   */
  createElement() {
    if (this.state === State.Template) {
      let wrapper, p;

      wrapper = document.createElement('div');
      wrapper.setAttribute('class', 'annotation-template-header');

      p = document.createElement('p');
      p.textContent = 'Annotation:';
      p.style.fontWeight = "bold";
      wrapper.appendChild(p);

      wrapper.appendChild(this.#showHeaderOnCreation());
      wrapper.appendChild(this.#conceptSelectMenu());
      // wrapper.appendChild(this.#styleSelectMenu());

      this.#element.appendChild(wrapper);
    } else if (this.state === State.Creation && (!this.#name || this.#showHeader)) {
      let wrapper, p, hline;

      wrapper = document.createElement('div');
      wrapper.setAttribute('class', 'annotation-template-header');

      hline = document.createElement('div');
      hline.setAttribute('class', 'hline');
      wrapper.appendChild(hline);

      p = document.createElement('p');
      p.textContent = 'Annotation:';
      p.style.fontWeight = "bold";
      wrapper.appendChild(p);

      wrapper.appendChild(this.#conceptSelectMenu());
      wrapper.appendChild(this.#styleSelectMenu());

      this.#element.appendChild(wrapper);
    } else {
      this.#element.replaceChildren();
    }
    if (this.#name) {
      this.#element.appendChild(this.#conceptContent());
      // initialize valid state
      this.#fragmentChangeCallback();
    }
    return this.#element;
  }

  highlightAnnotateEvent() {
    let creationBody;
    creationBody = new AnnotationTypeSelectionBody(State.Creation);
    this.annotationObject.changeAnnotationStyle(AnnotationStyleMarker);
    // set as new body for annotation
    this.annotationObject.annotationBody = creationBody;
    // restore cancel button on sidebar
    this.sidebarElement.cancelButton.classList.remove('cancel-annotation-edit');
    this.sidebarElement.cancelButton.classList.add('cancel-annotation-creation');
    // set as new element for sidebar
    this.sidebarElement.annotationBody = creationBody;
  }

  /**
   * Selection menu for the annotation style.
   * @returns {HTMLDivElement} a wrapper containing the custom-selection menu
   */
  #styleSelectMenu() {
    let wrapper, label, select;
    let styles;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-style-selection');
    wrapper.setAttribute('id', this.bodyID + '-annotation-style-selection');

    // Tag selection drop-down menu
    label = document.createElement('label');
    label.textContent = 'Annotation-Style:';
    label.setAttribute('class', 'annotation-creation-label');
    label.setAttribute('for', this.bodyID + '-annotation-style-selection');
    wrapper.appendChild(label);

    styles = [];
    Array.from(runtime.annotationStyles.values()).forEach(element => {
      styles.push(element.preview());
    });
    select = CustomSelect.getCustomSelect(styles, 'Select Style');
    select.style.width = "250px";
    select.addEventListener('change', event => runtime.changeAnnotationStyle(this.annotationObject.annotationId, event.target.firstChild.getAttribute('value')));
    // set up with inital value
    CustomSelect.setValueWithoutEvent(select, this.#style);
    wrapper.appendChild(select);
    // hide if not overwritable
    if (!this.#styleOverwritable) {
      wrapper.style.display = 'none';
    }
    return wrapper;
  }

  /**
   * Select the concept to use
   * @returns {HTMLDivElement} a wrapper containing the select
   */
  #conceptSelectMenu() {
    let wrapper, label, select, description, option, button, icon;
  
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-type-selection');
  
    // Tag selection drop-down menu
    label = document.createElement('label');
    label.textContent = 'Annotation-Type:';
    label.setAttribute('class', 'annotation-creation-label');
    label.setAttribute('for', this.bodyID + '-annotation-type-selection');
    wrapper.appendChild(label);
  
    select = document.createElement('select');
    select.setAttribute('class', 'annotation-sidebar-select');
    select.setAttribute('id', this.bodyID + '-annotation-type-selection');
    select.required = true;
    if (this.state !== State.Template) {
      select.style.width = "195px";
    }
    select.addEventListener("change", event => this.#setConceptEvent(event));
    wrapper.appendChild(select);
    // save select
    this.#conceptSelect = select;
  
    description = document.createElement('option');
    description.setAttribute('value', "");
    description.selected = true;
    description.disabled = true;
    description.hidden = true;
    description.textContent = "Choose ABoSpec";
    select.appendChild(description);
    
    for (let concept of runtime.conceptNames) {
      option = document.createElement('option');
      option.setAttribute('value', concept);
      option.textContent = concept;
      option.selected = concept === this.#name;
      select.appendChild(option);
    }
    
    if (this.state !== State.Template) {
      let tooltiptext;
      button = document.createElement('div');
      button.setAttribute('class', 'sidebar-highlight-button prevent-select tooltip');
      button.setAttribute('id', this.bodyID + '-sidebar-highlight-button');
      button.dataset.annotationId = this.annotationObject.id;
      button.addEventListener('click', event => this.#highlightButtonEvent(event));
    
      icon = document.createElement('i');
      icon.setAttribute('class', 'material-symbols-outlined');
      icon.style.padding = "0px";
      icon.textContent = "format_ink_highlighter";

      tooltiptext = document.createElement('span');
      tooltiptext.setAttribute('class', 'tooltiptext');
      tooltiptext.textContent = "Create Highlight";
      button.appendChild(tooltiptext);
    
      button.appendChild(icon);
      wrapper.appendChild(button);
    }
    
  
    return wrapper;
  }

  refreshTodoElement() {
    if (this.#todoState) {
      let elem, hline2;
      // line to separate different fields
      hline2 = document.createElement('div');
      hline2.setAttribute('class', 'hline2');
      // create html element for notes
      elem = this.#fields[this.#fields.length - 1].content(this.state);
      // insert into body
      this.#element.lastChild.insertBefore(hline2, this.#element.lastChild.lastChild);
      this.#element.lastChild.insertBefore(elem, this.#element.lastChild.lastChild);
    } else {
      // remove hline
      this.#element.lastChild.lastChild.remove();
      // remove notes
      this.#element.lastChild.lastChild.remove();
      // set hline2 to hline
      this.#element.lastChild.lastChild.setAttribute('class', 'hline');
    }
  }

  /**
   * The 'TODO' button was pressed by the user.
   * @param {Event} event 
   */
  #todoButtonEvent(event) {
    if (this.#todoState) {
      this.#todoState = false;
      this.#fields.pop();
      // reset button color
      event.target.style.removeProperty('color');
      // refresh HTMLDiv element
      this.refreshTodoElement();
      // set todo state in annotation object
      this.#annotationObject.flagTODO = false;
    } else {
      let notes, generator;
      this.#todoState = true;
      // set button color
      event.target.style.color = "orange";
      // create input field for notes
      generator = (abstrField, number, defaultValue) => { return new TextboxTemplate(abstrField, 'Notes', number, defaultValue, undefined) };
      notes = new AbstractField(this, generator, 'TODO', {"atleast": 0, "atmost": "Infinity", "default": 0}, null);
      this.#fields.push(notes);
      // refresh HTMLDiv element
      this.refreshTodoElement();
      // set todo state in annotation object
      this.#annotationObject.flagTODO = true;
    }
      console.log('todo');
  }
  
  /**
   * 
   * @param {Event} event 
   */
  #highlightButtonEvent(event) {
    // remove old concept (notify concept fragments)
    for (let field of this.#fields) {
      field.remove();
    }
    // set new concept
    this.#initializeConcept(highlight_concept);
    // refresh HTMLDiv element
    this.refreshElementConcept();
    // set as todo
    this.#highlightState = true;
    // set new annotation style
    this.annotationObject.changeAnnotationStyle(AnnotationStyleStripedHighlight);
    // save annotation
    runtime.saveAnnotationEvent(null, this.annotationObject.id);
  }

  #convertToAnnotation() {
    // reset element
    this.#fields = [];
    this.#name = "";
    this.validState = false;
    this.#highlightState = false;
    this.#sidebarElement.resetAnnotation();
    this.annotationObject.changeAnnotationStyle(AnnotationStyleMarker);
    // clear html object
    this.#element.replaceChildren();
    // set new state and content
    this.state = State.Creation;
    this.createElement();
  }

  /**
   * The annotation style changes
   * @param {string} style 
   * @returns 
   */
  changeAnnotationStyle(style) {
    if (this.#style === 'rectangle' || style === 'rectangle') {
      for (let reference of this.#referenceMap.values()) {
        reference.syncArrows();
      }
    }
    this.#style = style;
    let select = document.getElementById(this.bodyID + '-annotation-style-selection');
    if (select) {
      select = select.lastChild;
      if (this.#style === 'default') {
        CustomSelect.setValueWithoutEvent(select, "marker");
      } else {
        CustomSelect.setValueWithoutEvent(select, this.#style);
      }
    }
  }

  informFragmentTargetChange() {
    // sync the reference arrows to new target
    for (let reference of this.#referenceMap.values()) {
      reference.syncArrows();
    }
  }

  /**
   * Sets the focus on this element.
   */
  focus() {
    // Implement in child classes
  }

  #removeConceptChangeEventListener() {
    if (this.#conceptChangeCallback !== null) {
      conceptPlugin.emitter.removeEventListener('conceptListChange', this.#conceptChangeCallback);
      this.#conceptChangeCallback = null;
    }
  }

  /**
   * Handle removal of the annotation from the document. 
   */
  remove() {
    // pass remove event to all fields
    for (let field of this.#fields) {
      field.remove();
    }
    // remove self from all references
    for (let reference of this.#referenceMap.values()) {
      if (this.#annotationObject.id === reference.target) {
        reference.removeTarget();
      } else if (this.#annotationObject.id === reference.source) {
        reference.removeSource();
      } else {
        console.warn('Unexpected reference state: ', reference);
      }
    }
    this.#removeConceptChangeEventListener();
  }

  save() {
    for (let field of this.#fields) {
      field.save();
    }
    this.state = State.Display;
    this.#removeConceptChangeEventListener();
  }

  edit() {
    for (let field of this.#fields) {
      field.edit();
    }
    this.state = State.Edit;
    // save style and target
    if (this.#annotationObject) {
      this.#oldStyle = this.#annotationObject.styleClassName;
      this.#oldFragmentTarget = this.#annotationObject.target;
    }
  }

  cancel() {
    for (let field of this.#fields) {
      field.cancel();
    }
    this.state = State.Display;
    // restore old style and target
    if (!this.#annotationObject) {
      return;
    } 
    if (this.#oldStyle !== this.#annotationObject.styleClassName) {
      runtime.changeAnnotationStyle(this.annotationObject.id, this.#oldStyle);        
    }
    if (this.#oldFragmentTarget !== this.#annotationObject.target) {
      this.annotationObject.setFragmentTarget(this.#oldFragmentTarget);
    }
  }


  getCurrentBody() {
    return this;
  }

  setStylable(overwritable) {
    if (this.state === State.Display) {
      return;
    }
    const select = this.element.getElementsByClassName('annotation-style-selection');
    if (select.length !== 0) {
      select[0].style.display = overwritable ? 'block' : 'none';
    }
  }
}
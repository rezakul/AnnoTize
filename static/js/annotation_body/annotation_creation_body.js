/**
 * A simple body that lets the user select the annotation type. 
 * @extends {AnnotationBody} extends the abstract AnnotationBody class. 
 */
class AnnotationTypeSelectionBody extends AnnotationBody {
  #annotationType;
  #annotationStyle;
  #annotationCreationBody;
  #annotationTypeBody = null;
  
  /**
   * Creates a AnnotationTypeSelectionBody.
   * @param {State} state the state of the annotation (MUST BE 'Creation')
   * @param {AnnotationBody} annotationType (optional) the annotation type
   * @param {string} annotationStyle (optional) the annotation style
   */
  constructor(state, annotationType=null, annotationStyle=null) {
    super(state);
    this.#annotationType = annotationType;
    this.#annotationStyle = annotationStyle;
    this.#annotationCreationBody = document.createElement('div');
    this.#annotationCreationBody.setAttribute('class', 'annotation-creation-body');
  }

  /**
   * Get the highlight color for this element.
   * @returns {String} css color
   */
  get color() {
    return super.color;
  }

  /**
   * Get the visibility of the tag.
   * @returns {boolean} if the element should be visible to the user
   */
  get visibility() {
    return super.visibility();
  }

  get template() {
    return super.template;
  }

  set template(val) {
    super.template = val;
    if (this.#annotationType) {
      this.#annotationType.template = val;
    }
  }

  /**
   * 
   * @param {AnnotationBody} annotationType 
   */
  setAnnotationType(annotationType) {
    let signalValid, signalInvalid;
    let annotationBody;
    let style, styleable;
    let id, select;

    this.#annotationType = annotationType;
    
    signalValid = () => {
      this.saveEnabled();
    }
    signalInvalid = () => {
      this.saveDisabled();
    }
    annotationBody = this.#annotationType.createElement(signalValid, signalInvalid);
    if (this.#annotationTypeBody === null) {
      this.#annotationCreationBody.appendChild(annotationBody);
    } else {
      this.#annotationCreationBody.replaceChild(annotationBody, this.#annotationTypeBody);
    }
    this.#annotationTypeBody = annotationBody;
    if (!this.annotationObject) {
      return;
    }
    // set the anotation-style for this body
    style = runtime.getDefinedStyle(this.annotationObject.creator, annotationType);
    if (style !== 'default' && style !== this.annotationObject.styleClassName) {
      runtime.changeAnnotationStyle(this.annotationObject.id, style);
      this.setAnnotationStyle(style);
    }

    // disable user style if necessary
    styleable = runtime.userStylable(this.annotationObject.creator, annotationType);
    // hide or show select
    id = this.bodyID + '-annotation-style-selection';
    id = id.replaceAll('-', '\\-');
    select = this.element.querySelector("#" + id);
    select.parentElement.style.display = styleable ? 'block' : 'none';
  }

  changeAnnotationStyle(style) {
    console.log(style);
    console.trace();
    this.setAnnotationStyle(style);
  }

  setAnnotationStyle(annotationStyle) {
    let id;
    let select, items;
    // set value for identifier selection
    id = this.bodyID + '-annotation-style-selection';
    id = id.replaceAll('-', '\\-');
    select = this.element.querySelector("#" + id);

    CustomSelect.setValueWithoutEvent(select, annotationStyle);
    return;

    // set current style
    items = select.getElementsByClassName("select-item-entry");
    for (let item of items) {
      if (item.firstChild.getAttribute('value') === annotationStyle) {
        item.click();
        break;
      }
    }
    select.firstChild.classList.remove("select-arrow-active");
    select.lastChild.classList.add("select-hide");
  }

  getAnnotationStyle() {
    return this.#annotationStyle;
  }

  getCurrentBody() {
    if (this.#annotationType) {
      return this.#annotationType;
    }
    return this;
  }

  hasAnnotationType() {
    return this.#annotationType !== null;
  }

  toJSON(key) {
    let json = {};

    // IMPLEMENT IN DERIVED CLASS!
    json.error = "Annotation creation should not be exported";
    
    return json;
  }

  highlightElement(event) {
    this.#annotationType = new AnnotationHighlightBody(State.Display);
    this.annotationObject.changeAnnotationStyle(AnnotationStyleStripedHighlight);
    runtime.saveAnnotationEvent(null, this.annotationObject.id);
  }

  changeAnnotationType(event) {
    let annotationClass, annotationType;
    
    annotationClass = runtime.getAnnotationType(event.target.value);
    annotationType = new annotationClass(State.Creation);

    this.setAnnotationType(annotationType);
  }

  #bodySelectionMenu() {
    let wrapper, label, select, description, option, button, icon;
    let annotationTypes;

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
    select.style.width = "195px";
    select.addEventListener("change", (event) => ((body) => {
      body.changeAnnotationType(event);
    })(this));
    wrapper.appendChild(select);

    if (this.#annotationType === null) {
      description = document.createElement('option');
      description.setAttribute('value', "");
      description.selected = true;
      description.disabled = true;
      description.hidden = true;
      description.textContent = "Choose Annotation Type";
      select.appendChild(description);
    }
    
    annotationTypes = runtime.getAnnotationTypesList();
    for (let annotationType of annotationTypes) {
      option = document.createElement('option');
      option.setAttribute('value', annotationType);
      option.textContent = annotationType;
      if (this.#annotationType !== null && this.#annotationType.constructor.name === runtime.getAnnotationType(annotationType).name) {
        option.selected = true;
      } 
      select.appendChild(option);
    }

    button = document.createElement('div');
    button.setAttribute('class', 'sidebar-highlight-button prevent-select');
    button.setAttribute('id', this.bodyID + '-sidebar-highlight-button');
    button.dataset.annotationId = this.annotationObject.id;
    button.addEventListener('click', (event) => ((body) => {
      body.highlightElement(event);
    })(this));

    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined');
    icon.style.padding = "0px";
    icon.textContent = "format_ink_highlighter";

    button.appendChild(icon);
    wrapper.appendChild(button);

    return wrapper;
  }

  #styleSelectionMenu() {
    let wrapper, label, select;
    let styles;
    let callback;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-style-selection');

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
    select.setAttribute('id', this.bodyID + '-annotation-style-selection');
    select.addEventListener('change', (event) => ((id) => {
      runtime.changeAnnotationStyle(id, event.target.firstChild.getAttribute('value'));
    })(this.annotationObject.annotationId));
    callback = (event) => {
      this.#annotationStyle = event.target.firstChild.getAttribute('value');
    }
    select.addEventListener('change', callback);
    wrapper.appendChild(select);

    return wrapper;
  }

  createElementCreation(signalValid, signalInvalid) {
    let wrapper, p;
    let bodySelection, styleSelection;
    let overwrite;

    // this.#annotationCreationBody.replaceChildren();

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', "select-basic-wrapper");
    wrapper.style.marginBottom = "25px";

    p = document.createElement('p');
    p.textContent = 'Annotation:';
    p.style.fontWeight = "bold";
    wrapper.appendChild(p);

    bodySelection = this.#bodySelectionMenu();
    wrapper.appendChild(bodySelection);
    styleSelection = this.#styleSelectionMenu();
    if (this.annotationObject) {
      overwrite = runtime.userStylable(this.annotationObject.creator, this.annotationObject.body);
    } else {
      console.log('TODO');
      overwrite = runtime.userStylable(runtime.creator, null);
    }
    styleSelection.style.display = overwrite ? 'display' : 'none';
    wrapper.appendChild(styleSelection);

    this.setElementContent(this.#annotationCreationBody);
    // setup style and type if present
    this.#annotationCreationBody.appendChild(wrapper);
    if (this.#annotationType !== null) {
      this.setAnnotationType(this.#annotationType);
    }
    if (this.#annotationStyle !== null) {
      this.setAnnotationStyle(this.#annotationStyle);
    }

    return this.element;
  }

  createElementEdit(signalValid, signalInvalid) {
    throw Error('Edit-State not supported by this body');
  }

  createElementDisplay() {
    throw Error('Display-State not supported by this body');
  }

  save() {
    // save the body
    this.#annotationType.save();
    // set as new body for annotation
    this.annotationObject.annotationBody = this.#annotationType;
    // set as new element for sidebar
    this.sidebarElement.annotationBody = this.#annotationType;
  }

  edit() {
    throw Error('Edit not supported by this body');
  }

  cancel() {
    // delete annotation on cancel
    
    //throw Error('Cancel not supported by this body');
  }

  focus() {
    if (this.state === State.Edit) {
      this.element.firstChild.focus();
      this.element.firstChild.select();
    }
  }

  copy() {
    let copy;
    let style, type;
    // get the current state
    if (this.#annotationType) {
      type = this.#annotationType.copy();
    }
    style = this.#annotationStyle;
    // create a copy
    copy = new AnnotationTypeSelectionBody(State.Creation, type, style);
    return copy;
  }
}
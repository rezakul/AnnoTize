// dirty fix because Enum is not allowed
const State = {
  Creation: "Creation",
  Edit: "Edit",
  Display: "Display",
  Template: "Template"
};

class AnnotationBody {
  #state;
  #element;
  #sidebarElement = null;
  #annotationObject;
  #bodyID;
  #validState = false;
  // temporary save state before edit
  #oldStyle;
  #oldFragmentTarget;

  static annotationStyle = 'default';
  static annotationStyleOverwritable = true;
  
  /**
   * Constructs a annotation body element.
   * @param {State} state the state of the annotation
   */
  constructor(state) {
    this.#state = state;
    this.#bodyID = "id-" + self.crypto.randomUUID();
    this.#element = this.#initializeElement();
  }

  /**
   * Get the state of the annotation.
   * @returns {State} the current state
   */
  get state() {
    return this.#state;
  }

  /**
   * Set the state of the annotation.
   * @param {State} val the new state
   */
  set state(val) {
    if (!State.hasOwnProperty(val)) {
      throw Error('Invalid state: ' + val);
    }
    this.#state = val;
  }

  /**
   * Get the html element for this annotation body.
   * @returns {Node} the body element
   */
  get element() {
    return this.#element;
  }

  /**
   * Get the parent sidebar element the annotation body belongs to.
   * @returns {AnnotationSidbarElement}
   */
  get sidebarElement() {
    return this.#sidebarElement;
  }

  /**
   * The annotation object.
   * @returns {AnnotationObject}
   */
  get annotationObject() {
    return this.#annotationObject;
  }

  /**
   * The highlight color for this element as a css color.
   * @returns {String}
   */
  get color() {
    return '#FF5F1F';
  }

  get visibility() {
    return true;
  }

  get bodyID() {
    return this.#bodyID;
  }

  get validState() {
    return this.#validState;
  }

  set validState(valid) {
    this.#validState = valid;
  }

  getHighlightClass() {
    return "";
  }

  updateColor() {
    return;
  }

  saveEnabled() {
    this.sidebarElement.saveEnabled(true);
    this.validState = true;
  }

  saveDisabled() {
    this.sidebarElement.saveEnabled(false);
    this.validState = false;
  }

  /**
   * Register the corresponding sidebar element. 
   * @param {AnnotationSidbarElement} sidebarElement the parent sidebar element
   */
  registerSidebarElement(sidebarElement) {
    this.#sidebarElement = sidebarElement;
  }

  /**
   * Register the corresponding annotation element this body belongs to. 
   * @param {AnnotationSidbarElement} sidebarElement the annotation object element
   */
  registerAnnotation(annotationObject) {
    this.#annotationObject = annotationObject;
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

  /**
   * Creates the SimpleTagElement displayed to the user.
   * The element should be shown in the sidebar element.
   * 
   * @param {State} state the (new) current state (default the last current state)
   * @returns {Node} the SimpleTextElement node
   */
  createElement(signalValid=null, signalInvalid=null) {
    let elem;
    //console.log('Create element');
    switch (this.state) {
      case State.Creation:
        elem = this.createElementCreation(signalValid, signalInvalid);
        break;
      case State.Edit:
        elem = this.createElementEdit(signalValid, signalInvalid);
        break;
      case State.Display:
        //console.log(this.createElementDisplay);
        elem = this.createElementDisplay();
        break;
      default:
        throw Error('State not supported: ' + this.state);
    }
    return elem;
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
   * @returns {Node} a custom-selection menu
   */
  #styleSelectionMenu() {
    let wrapper, label, select;
    let styles;

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
    select.addEventListener('change', (event) => ((id) => {
        runtime.changeAnnotationStyle(id, event.target.firstChild.getAttribute('value'));
    })(this.annotationObject.annotationId));

    wrapper.appendChild(select);
    return wrapper;
  }

  /**
   * Sets the content of the element and removes the old content.
   * @param {Node} content the new content
   */
  setElementContent(content) {
    // remove all old content
    this.element.replaceChildren();
    if (this.state === State.Edit) {
      let wrapper, hline;

      wrapper = document.createElement('div');
      // create line
      hline = document.createElement('div');
      hline.setAttribute('class', 'hline');
      wrapper.appendChild(hline);
      // add style selection
      if (this.constructor.name !== 'AnnotationHighlightBody') {
        if (this.#annotationObject) {
          let selection, select_items, saveEnabled;
          selection = this.#styleSelectionMenu();
          // set current style
          CustomSelect.setValueWithoutEvent(selection.lastChild, this.#annotationObject.styleClassName);
          // css
          selection.style.marginTop = "15px";
          selection.style.marginBottom = "15px";
          // enable save on change
          saveEnabled = () => {this.saveEnabled()};
          selection.lastChild.addEventListener('change', saveEnabled);
          if (!runtime.userStylable(this.annotationObject.creator, this.annotationObject.body)) {
            selection.style.display = 'none';
          }
          wrapper.appendChild(selection);
        }
      } else {
        let wrapper2, annotate, icon, label;
        wrapper2 = document.createElement('div');
        wrapper2.style.marginTop = "15px";
        wrapper2.style.marginBottom = "15px";
        wrapper.appendChild(wrapper2);
        // annotate label
        label = document.createElement('label');
        label.textContent = 'Annotate:';
        label.setAttribute('class', 'annotation-creation-label');
        label.setAttribute('for', this.bodyID + '-annotate-highlight-element');
        label.style.marginTop = "10px";
        wrapper2.appendChild(label);

        icon = document.createElement('i');
        icon.setAttribute('class', 'material-symbols-outlined');
        icon.style.padding = "0px";
        icon.textContent = "chat";

        annotate = document.createElement('button');
        annotate.setAttribute('id', this.bodyID + 'annotate-highlight-element');
        annotate.setAttribute('class', 'annotation-menu-selection-button');
        annotate.appendChild(icon);
        annotate.addEventListener('click', (event) => ((body) => {
          body.highlightAnnotateEvent(event);
        })(this));
        wrapper2.appendChild(annotate);
      }
      
      wrapper.appendChild(content);
      this.element.appendChild(wrapper);
    } else {
      this.element.appendChild(content);
    }
  }

  /**
   * The annotation style changes
   * @param {string} style 
   * @returns 
   */
  changeAnnotationStyle(style) {
    return;
  }

  /**
   * Sets the focus on this element.
   */
  focus() {
    // Implement in child classes
  }

  /**
   * Handle removal of the annotation from the document. 
   */
  remove() {
    // Implement in child classes
  }

  save() {
    this.state = State.Display;
  }

  edit() {
    this.state = State.Edit;
    // save style and target
    if (this.#annotationObject) {
      this.#oldStyle = this.#annotationObject.styleClassName;
      this.#oldFragmentTarget = this.#annotationObject.target;
    }
  }

  cancel() {
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

  /**
   * Export this annotation body to json.
   * 
   * @param {any} key a key may given by JSON.stringify()
   * @returns {object} (JSON) stringifyable object
   */
  toJSON(key) {
    let json = {};

    // IMPLEMENT IN DERIVED CLASS!
    json.error = "Define in derived body class!";
    
    return json;
  }

  /**
   * Creates a (deep) copy of the annotation body
   */
  copy() {
    let copy;
    copy = new this.constructor(this.state);
    return copy;
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
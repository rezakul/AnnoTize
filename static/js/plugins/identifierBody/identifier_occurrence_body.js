/**
 * A identifier occurrence body containing an identifier occurrence. 
 * @extends {AnnotationBody} extends the abstract AnnotationBody class. 
 */
class IdentifierOccurrenceBody extends CommonIdentifierBody {
  #occurrence;

  /**
   * Creates a IdentifierOccurrenceBody with a given identifier.
   * @param {State} state the state of the annotation
   * @param {Identifier} identifier the identifier
   * @param {IdentifierOccurrence} occurrence the occurrence object
   */
  constructor(state, identifier, occurrence) {
    super(state, identifier);
    this.#occurrence = occurrence;
  }

  get occurrence() {
    return this.#occurrence;
  }
  
  get declaration() {
    return this.identifier.declaration;
  }

  /**
   * Get the highlight color for this element.
   * @returns {String} css color
   */
  get color() {
    return this.identifier.occurrence.color;
  }

  toJSON(key) {
    let json = {};

    json.type = "IdentifierOccurrence";
    json.occurrenceOf = this.identifier.id;

    return json;
  }

  changeToDeclaration() {
    let declaration;

    // TODO!!
    declaration = new IdentifierDeclarationBody(this.state, this.identifier);
    this.annotationObject.annotationBody = declaration;
    // set as new element for sidebar
    this.sidebarElement.annotationBody = declaration;
  }

  changeToDeclarationEntry() {
    let wrapper, label, button;
    let elem, callback;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-identifier-change-type');

    label = document.createElement('label');
    label.setAttribute('class', 'annotation-creation-label');
    label.textContent = 'Change Type:';
    wrapper.appendChild(label);

    button = document.createElement('button');
    button.textContent = "Change to Declaration";
    label.appendChild(button);

    elem = this;
    callback = (event) => {
      elem.changeToDeclaration();
    }
    button.addEventListener('click', callback);

    return wrapper;
  }

  createElementCreation(signalValid, signalInvalid) {
    let wrapper, hline;
    let callback;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-identifier-body');

    hline = document.createElement('div');
    hline.setAttribute('class', 'hline');
    wrapper.appendChild(hline);

    callback = (event) => {runtime.getPlugin('IdentifierBody').lastUsedIdentifier = event.target.value;};
    wrapper.appendChild(this.identifierSelection(signalValid, callback));
    
   if (this.identifier) {
      signalValid();
    } else {
      signalInvalid();
    }

    return wrapper;
  }

  createElementEdit(signalValid=null, signalInvalid=null) {
    let wrapper, hline;

    if (signalValid === null) {
      signalValid = () => {this.saveEnabled()};
    }
    if (signalInvalid === null) {
      signalInvalid = () => {this.saveDisabled()};
    }
    
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-identifier-body');

    hline = document.createElement('div');
    hline.setAttribute('class', 'hline');
    wrapper.appendChild(hline);

    wrapper.appendChild(this.changeToDeclarationEntry());
    wrapper.appendChild(this.identifierSelection(signalValid, undefined));
    
    // start state is valid
    signalValid();
    // set as element
    this.setElementContent(wrapper);
    return this.element;
  }

  createElementDisplay() {
    let wrapper, p, label, button;
    wrapper = document.createElement('div');

    p = document.createElement('p');
    p.textContent = 'Identifier-Occurrence:';
    p.style.fontWeight = "bold";
    wrapper.appendChild(p);
    
    label = document.createElement('label');
    label.setAttribute('for', this.bodyID + '-annotation-occurrence-value');
    label.setAttribute('class', 'annotation-display-label');
    label.textContent = "Occurrence of:";

    button = document.createElement('button');
    button.setAttribute('id', this.bodyID + '-annotation-occurrence-value');
    button.setAttribute('class', 'annotation-sidebar-button');
    button.textContent = this.identifier.id;
    button.dataset.customId = this.bodyID;
 
    button.addEventListener('click', (event) => {
      let val, target;
      val = document.getElementById(event.target.dataset.customId + '-annotation-occurrence-value').textContent;
      target = runtime.getPlugin('IdentifierBody').getIdentifierForId(val);
      if (target.hasDeclaration()) {
        target = target.declaration.annotation.id;
      } else {
        target = undefined;
      }
      event.target.dataset.target = target;
      runtime.gotoAnnotation(event);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(button);

    this.setElementContent(wrapper);
    return this.element;
  }

  save() {
    let identifier, occurrence;
    identifier = this.getIdentifierFromMenu();

    if (this.identifier) {
      // create new occurrence if only identifier is defined
      if (!this.#occurrence) {
        // create new occurrence and register with identifier
        this.#occurrence = new IdentifierOccurrence();
        this.identifier.addOccurrence(this.#occurrence);
        if (this.annotationObject) {
          this.#occurrence.registerAnnotation(this.annotationObject);
        }
      }
      if (this.identifier === identifier) {
        // nothing changed
        super.save();
        return;
      } else {
        // remove old occurrence
        this.remove();
      }
    }
    // set new identifier occurrence
    occurrence = new IdentifierOccurrence();
    identifier.addOccurrence(occurrence);
    if (this.annotationObject) {
      occurrence.registerAnnotation(this.annotationObject);
    }
    // save new identifier and occurrence
    this.identifier = identifier;
    this.#occurrence = occurrence;

    super.save();
  }

  edit() {
    super.edit();
  }

  cancel() {
    super.cancel();
  }

  focus() {
    if (this.state === State.Edit) {
      this.element.firstChild.focus();
      this.element.firstChild.select();
    }
  }

  clickOnElementEvent(event) {
    if (this.identifier) {
      runtime.getPlugin('IdentifierBody').lastUsedIdentifier = this.identifier.id;
    }
  }

  registerAnnotation(annotationObject) {
    super.registerAnnotation(annotationObject);
    this.#occurrence.registerAnnotation(annotationObject);
    const callback = (event) => this.clickOnElementEvent(event);
    annotationObject.registerTextClickCallback(callback);
    annotationObject.registerSidebarClickCallback(callback);
  }

  remove() {
    this.identifier.removeOccurrence(this.#occurrence);
  }

  copy() {
    let copy, elem;
    let identifier;
    // get current identifier
    elem = document.getElementById(this.bodyID + '-dropdown-select-identifier');
    if (elem) {
      if (elem.value) {
        identifier = runtime.getPlugin('IdentifierBody').getIdentifierForId(elem.value);
      } else {
        identifier = null;
      }
    } else {
      identifier = this.identifier;
    }
    // don't define occurrence to avoid duplication -> a new occurrence for the identifier will be created
    copy = new IdentifierOccurrenceBody(this.state, identifier, null);
    return copy;
  }
}
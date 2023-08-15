/**
 * A identifier declaration body containing an identifier declaration. 
 * @extends {AnnotationBody} extends the abstract AnnotationBody class. 
 */
class IdentifierDeclarationBody extends CommonIdentifierBody {
  #declaration;
  #tagBody;

  /**
   * Creates a IdentifierDeclarationBody with a given identifier.
   * @param {State} state the state of the annotation
   * @param {Identifier} identifier the identifier
   * @param {IdentifierDeclaration} declaration the declaration for the identifier
   */
  constructor(state, identifier=null, declaration=null) {
    // call super constructor
    super(state, identifier);
    // initialize private variables
    this.#declaration = declaration;
    if (!this.#declaration) {
      this.#declaration = new IdentifierDeclaration(null);
    }
    if (state === State.Display && !this.declaration.polarity) {
      throw Error('Unsupported state, missing declaration polarity.');
    }
    if (this.declaration.polarity) {
      this.#tagBody = new SimpleTagBody(state, this.declaration.polarity); 
    } else {
      this.#tagBody = new SimpleTagBody(state);
    }
  }

  get declaration() {
    return this.#declaration;
  }

  /**
   * Get the highlight color for this element.
   * @returns {String} css color
   */
  get color() {
    return this.declaration.color;
  }

  overwriteTagBody(newTagBody) {
    if (!newTagBody instanceof SimpleTagBody) {
      console.error('Argument not of type "SimpleTagBody"', newTagBody);
      return;
    }
    this.#tagBody = newTagBody;
  }

  toJSON(key) {
    let json = {};

    json.type = "IdentifierDeclaration";
    json.hasPolarity = this.declaration.polarity.id;
    json.declares = this.identifier.id;
    
    return json;
  }

  customValid(signalValid) {
    let callback;
    let bodyId, tagBody;
    bodyId = this.bodyID;
    tagBody = this.#tagBody;
    callback = () => {
      const identifierSelect = document.getElementById(bodyId + '-dropdown-select-identifier');
      if (identifierSelect && identifierSelect.value !== "" && tagBody.validState) {
        signalValid();
      }
    }
    return callback;
  }

  changeToOccurrence() {
    let occurrenceBody, occurrence;
    // remove declaration from identifier
    if (this.declaration.registered) {
      this.remove();
    }
    // create new occurrence and register with identifier
    occurrence = new IdentifierOccurrence();
    this.identifier.addOccurrence(occurrence);
    occurrence.registerAnnotation(this.annotationObject);
    // create body
    occurrenceBody = new IdentifierOccurrenceBody(this.state, this.identifier, occurrence);
    this.annotationObject.annotationBody = occurrenceBody;
    this.annotationObject.updateColor();
    // set as new element for sidebar
    this.sidebarElement.annotationBody = occurrenceBody;
  }

  changeToOccurrenceEntry() {
    let wrapper, label, button;
    let elem, callback;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-identifier-change-type');

    label = document.createElement('label');
    label.setAttribute('class', 'annotation-creation-label');
    label.textContent = 'Change Type:';
    wrapper.appendChild(label);

    button = document.createElement('button');
    button.textContent = "Change to Occurrence";
    label.appendChild(button);

    elem = this;
    callback = (event) => {
      elem.changeToOccurrence();
    }
    button.addEventListener('click', callback);

    return wrapper;
  }

  duplicateDeclarationWarning() {
    let wrapper, span;

    wrapper = document.createElement('div');
    wrapper.setAttribute('id', this.bodyID + '-identifier-duplicate-declaration-warning');
    wrapper.setAttribute('class', 'annotation-identifier-duplicate-declaration-warning');

    span = document.createElement('span');
    span.textContent = "WARNING:";
    wrapper.appendChild(span);
    span = document.createElement('span');
    span.textContent = "This identifier has already a declaration defined.";
    wrapper.appendChild(span);
    span = document.createElement('span');
    span.textContent = "The other declaration will be converted to an occurrence.";
    wrapper.appendChild(span);
    
    // hide message on creation
    wrapper.style.display = 'none';

    if (this.identifier && this.identifier.hasDeclaration() && this.identifier.declaration !== this.declaration) {
      wrapper.style.display = 'block';
    }

    return wrapper;
  }

  identifierSelectionChange(event) {
    let identifier, warning, hasOtherDecl;
    identifier = runtime.getPlugin('IdentifierBody').getIdentifierForId(event.target.value);
    warning = document.getElementById(event.target.dataset.customId + '-identifier-duplicate-declaration-warning');
    hasOtherDecl = identifier.hasDeclaration() && identifier.declaration !== this.declaration;
    warning.style.display = hasOtherDecl ? 'block' : 'none';
  }

  declarationTag(signalValid, signalInvalid) {
    let wrapper, tagBody, tag;
    let valid, invalid;
    wrapper = document.createElement('div');
    wrapper.setAttribute('id', this.bodyID + '-identifier-declaration-tag');
    wrapper.setAttribute('class', 'annotation-identifier-declaration-tag');
    
    tagBody = this.#tagBody;
    valid = () => {
      tagBody.validState = true;
      signalValid();
    }
    invalid = () => {
      tagBody.validState = false;
      signalInvalid();
    }
    if (this.#tagBody.state === State.Display) {
      this.#tagBody.edit();
      tag = this.#tagBody.createElement(valid, invalid).firstChild;
    } else {
      tag = this.#tagBody.createElement(valid, invalid);
    }
    
    
    wrapper.appendChild(tag);
    return wrapper;
  }

  createElementCreation(signalValid, signalInvalid) {
    let wrapper, hline;
    let valid, elem, identifierCallback;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-identifier-body');

    hline = document.createElement('div');
    hline.setAttribute('class', 'hline');
    wrapper.appendChild(hline);

    valid = this.customValid(signalValid);
    elem = this;
    identifierCallback = (event) => {
      elem.identifierSelectionChange(event);
      runtime.getPlugin('IdentifierBody').lastUsedIdentifier = event.target.value;
    }
    wrapper.appendChild(this.identifierSelection(valid, identifierCallback));
    wrapper.appendChild(this.duplicateDeclarationWarning());
    wrapper.appendChild(this.declarationTag(valid, signalInvalid));

    if (this.identifier && this.#tagBody.validState) {
      signalValid();
    } else {
      signalInvalid();
    }

    return wrapper;
  }

  createElementEdit(signalValid=null, signalInvalid=null) {
    let wrapper, hline;
    let valid, elem, identifierCallback;

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

    valid = this.customValid(signalValid);
    elem = this;
    identifierCallback = (event) => {
      elem.identifierSelectionChange(event);
    } 
    wrapper.appendChild(this.changeToOccurrenceEntry());
    wrapper.appendChild(this.identifierSelection(valid, identifierCallback));
    wrapper.appendChild(this.duplicateDeclarationWarning());
    wrapper.appendChild(this.declarationTag(valid, signalInvalid));
    
    // start state is valid
    signalValid();

    this.setElementContent(wrapper);
    return this.element;
  }

  createElementDisplay() {
    let wrapper, p, label, tagWrapper, button;
    wrapper = document.createElement('div');

    p = document.createElement('p');
    p.textContent = 'Identifier-Declaration:';
    p.style.fontWeight = "bold";
    wrapper.appendChild(p);
    
    label = document.createElement('label');
    label.setAttribute('for', this.bodyID + '-annotation-declaration-polarity');
    label.setAttribute('class', 'annotation-display-label');
    label.textContent = "Declaration with polarity:";

    tagWrapper = document.createElement('div');
    tagWrapper.style.overflow = "auto";
    button = this.declaration.polarity.renderTag();
    button.setAttribute('id', this.bodyID + '-annotation-declaration-polarity');
    button.style.float = "right";
    tagWrapper.append(button);
    
    wrapper.appendChild(label);
    wrapper.appendChild(tagWrapper);

    this.setElementContent(wrapper);
    return this.element;
  }

  save() {
    let identifier, polarity;
    identifier = this.getIdentifierFromMenu();

    // identifier has already another declaration
    if (identifier.hasDeclaration() && identifier.declaration !== this.declaration) {
      // change the existing declaration to an occurrence
      identifier.declaration.annotation.body.changeToOccurrence();
    }
    // identifier changed -> remove declaration from old identifier
    if (this.identifier && this.identifier !== identifier && this.declaration.registered) {
      this.remove();
    }
    // save Polarity-Tag
    this.#tagBody.save();
    // get (new) polarity
    polarity = this.#tagBody.tag;
    this.declaration.polarity = polarity;
    
    if (!this.declaration.registered) {
      identifier.setDeclaration(this.declaration);
    }
    
    if (this.annotationObject && !this.declaration.annotation) {
      this.declaration.registerAnnotation(this.annotationObject);
    }
    // save new identifier
    this.identifier = identifier;

    super.save();
  }

  edit() {
    super.edit();
  }

  cancel() {
    this.#tagBody.cancel();
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
    this.declaration.registerAnnotation(annotationObject);
    const callback = (event) => this.clickOnElementEvent(event);
    annotationObject.registerTextClickCallback(callback);
    annotationObject.registerSidebarClickCallback(callback);
  }

  remove() {
    this.identifier.removeDeclaration();
  }

  copy() {
    let copy;
    // don't define identifier to avoid duplicate declarations -> use templateIdentifierId
    copy = new IdentifierDeclarationBody(this.state, this.identifier, this.declaration);
    return copy;
  }
}
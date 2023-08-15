/**
 * A simple number input field.
 * @extends {TemplateFragment} implements a template fragment.
 */
class IdentifierDeclarationTemplateQ extends IdentifierTemplateQ {
  #declaration;

  /**
   * Creates a number input fragment.
   * 
   * @param {string} identiferId the initial value (default none)
   * @param {string} label the label of the input
   */
  constructor(name, number=-1, identiferId="", declaration=null) {
    super(name, number, identiferId);
    // initialize private variables
    this.#declaration = declaration;
    if (!this.#declaration) {
      this.#declaration = new IdentifierDeclaration(null);
    }
  }

  toJSON(key) {
    let json = {};

    json.type = "SimpleTextBody";
    json.val = this.text;
    
    return json;
  }

  duplicateDeclarationWarning() {
    let wrapper, span;

    wrapper = document.createElement('div');
    wrapper.setAttribute('id', this.uniqueFragmentId + '-identifier-duplicate-declaration-warning');
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

    if (this.identifier && this.identifier.hasDeclaration() && this.identifier.declaration !== this.#declaration) {
      wrapper.style.display = 'block';
    }

    return wrapper;
  }

  identifierSelectionChange(event) {
    let identifier, warning, hasOtherDecl;
    identifier = runtime.getPlugin('IdentifierBody').getIdentifierForId(event.target.value);
    warning = document.getElementById(event.target.dataset.customId + '-identifier-duplicate-declaration-warning');
    hasOtherDecl = identifier.hasDeclaration() && identifier.declaration !== this.#declaration;
    warning.style.display = hasOtherDecl ? 'block' : 'none';
    // change last selected identifier
    runtime.getPlugin('IdentifierBody').lastUsedIdentifier = event.target.value;
  }

  content(state, signalChange) {
    let wrapper;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-template-fragment');

    wrapper.appendChild(super.content(state, signalChange, (event) => this.identifierSelectionChange(event)));
    wrapper.appendChild(this.duplicateDeclarationWarning());

    return wrapper;
  }

  save() {
    let identifier;
    identifier = this.getIdentifierFromMenu();

    // identifier has already another declaration
    if (identifier.hasDeclaration() && identifier.declaration !== this.#declaration) {
      // change the existing declaration to an occurrence

      // TODO
      identifier.declaration.annotation.body.changeToOccurrence();
    }
    // identifier changed -> remove declaration from old identifier
    if (this.identifier && this.identifier !== identifier && this.#declaration.registered) {
      this.remove();
    }
    
    if (!this.#declaration.registered) {
      identifier.setDeclaration(this.#declaration);
    }
    if (this.body.annotationObject && !this.#declaration.annotation) {
      this.#declaration.registerAnnotation(this.body.annotationObject);
    }

    super.save();
  }

  edit() {
    // nothing to do
  }

  cancel() {
    // nothing to do
  }

  clickOnElementEvent(event) {
    if (this.identifier) {
      runtime.getPlugin('IdentifierBody').lastUsedIdentifier = this.identifier.id;
    }
  }

  registerAnnotation(annotationObject) {
    // TODO
    throw Error('Implment!');
    super.registerAnnotation(annotationObject);
    this.#declaration.registerAnnotation(annotationObject);
    const callback = (event) => this.clickOnElementEvent(event);
    annotationObject.registerTextClickCallback(callback);
    annotationObject.registerSidebarClickCallback(callback);
  }

  remove() {
    this.identifier.removeDeclaration();
  }

  focus() {
    let input;
    input = document.getElementById(this.uniqueFragmentId + '-annotation-input-value');
    input.focus();
  }

  copy() {
    // TODO
  }
}
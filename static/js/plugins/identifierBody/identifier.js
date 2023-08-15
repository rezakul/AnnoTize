class Identifier {
  #id;
  #idString;
  #declaration;
  #occurrences;
  #randomColor;

  /**
   * Identifier for declaration and occurrences.
   * @param {string} id unique identifier id
   * @param {string} idString the string the identifier belongs to
   */
  constructor(id, idString) {
    this.#id = id;
    this.#idString = idString;
    this.#declaration = null;
    this.#occurrences = [];
    this.#randomColor = "#" + ((Math.random()*0xFFFFFF<<0).toString(16)).padStart(6, '0');
  }

  /**
   * The unique identifier id.
   */
  get id() {
    return this.#id;
  }

  set id(val) {
    this.#id = val;
  }

  /**
   * The declaration of the identifier.
   * @returns {IdentifierDeclaration}
   */
  get declaration() {
    return this.#declaration;
  }

  get occurrence() {
    return {color: this.#randomColor};
  }

  /**
   * Export this identifier to json.
   * 
   * @param {any} key a key may given by JSON.stringify()
   * @returns {object} (JSON) stringifyable object
   */
  toJSON(key) {
    let json = {};

    json.type = "Identifier";
    json.id = this.id;
    if (this.#idString) {
      json.idString = this.#idString;
    }

    return json;
  }

  hasDeclaration() {
    return this.#declaration !== null;
  }

  setDeclaration(declaration) {
    if (this.hasDeclaration()) {
      console.warn('Declaration already defined for identifier: ', this.id);
    }
    this.#declaration = declaration;
    declaration.registerIdentifier(this);
    for (let occurrence of this.#occurrences) {
      occurrence.notifyDeclarationChange();
    }
  }

  removeDeclaration() {
    if (!this.hasDeclaration()) {
      return;
    }
    this.#declaration.remove();
    this.#declaration = null;
    for (let occurrence of this.#occurrences) {
      occurrence.notifyDeclarationChange();
    }
    // this.#dispatchDeclarationChangeEvent();
  }

  hasOccurrences() {
    return this.#occurrences.length !== 0;
  }

  addOccurrence(occurrence) {
    this.#occurrences.push(occurrence);
    occurrence.registerIdentifier(this);
  }

  removeOccurrence(occurrence) {
    let index;
    index = this.#occurrences.indexOf(occurrence);
    this.#occurrences.splice(index, 1);
    occurrence.remove();
  }

  registerDeclaration(annoation) {
    this.declaration.registerAnnotation(annoation);
  }

  registerOccurrence(annotation) {
    // TODO
  }

  showAllArrows() {
    for (let occurrence of this.#occurrences) {
      occurrence.showArrow("draw"); // none
    }
  }

  hideAllArrows() {
    for (let occurrence of this.#occurrences) {
      occurrence.hideArrow();
    }
  }
}

class IdentifierDeclaration {
  #polarity;
  #annotation;
  #identifier;

  /**
   * 
   * @param {Tag} polarity the polarity tag
   */
  constructor(polarity) {
    this.#polarity = polarity;
    this.#identifier = null;
  }

  get color() {
    return this.polarity.color;
  }

  get polarity() {
    return this.#polarity;
  }

  set polarity(val) {
    this.#polarity = val;
  }

  get annotation() {
    return this.#annotation;
  }

  get registered() {
    return this.#identifier !== null;
  }

  registerAnnotation(annoation) {
    let funcOver, funcOut;
    this.#annotation = annoation;
    funcOver = (event) => {this.#identifier.showAllArrows()};
    funcOut = (event) => {this.#identifier.hideAllArrows()};
    this.#annotation.registerTextHoverCallback(funcOver, funcOut);
  }

  registerIdentifier(identifier) {
    this.#identifier = identifier;
  }

  remove() {
    let funcOver, funcOut;
    funcOver = (event) => {this.#identifier.showAllArrows()};
    funcOut = (event) => {this.#identifier.hideAllArrows()};
    this.#annotation.removeTextHoverCallback(funcOver, funcOut);
    this.#identifier = null;
    this.#annotation = null;
  }
}

class IdentifierOccurrence {
  #identifier;
  #annotation;
  #arrow;
  #arrowReverse;
  #declarationChangeCallback;
  
  constructor() {
    this.#arrow = null;
    this.#arrowReverse = null;
  }

  registerAnnotation(annoation) {
    let funcOver, funcOut;
    this.#annotation = annoation;
    funcOver = (event) => {this.showArrow()};
    funcOut = (event) => {this.hideArrow()};
    this.#annotation.registerTextHoverCallback(funcOver, funcOut);
  }

  remove() {
    let funcOver, funcOut;
    funcOver = (event) => {this.showArrow()};
    funcOut = (event) => {this.hideArrow()};
    this.#annotation.removeTextHoverCallback(funcOver, funcOut);
  }

  registerIdentifier(identifier) {
    this.#identifier = identifier;
  }

  registerDeclarationChangeCallback(callback) {
    this.#declarationChangeCallback = callback;
  }

  notifyDeclarationChange() {
    if (this.#declarationChangeCallback) {
      if (this.#identifier.hasDeclaration()) {
        this.#declarationChangeCallback(this.#identifier.declaration.annotation.id);
      } else {
        this.#declarationChangeCallback(undefined);
      }
    }
    if (!this.#identifier.hasDeclaration()) {
      this.removeArrow();
    }
  }

  initializeArrow() {
    let start, end;
    start =  this.#annotation.firstTextElement;
    end = this.#identifier.declaration.annotation.firstTextElement;
    this.#arrow = new LeaderLine(start, end, {color: 'black', size: 2, path: "fluid", hide: true});
  }

  initializeArrowReverse() {
    let start, end;
    start = this.#identifier.declaration.annotation.firstTextElement;
    end = this.#annotation.firstTextElement;
    this.#arrowReverse = new LeaderLine(start, end, {color: 'black', size: 2, path: "fluid", hide: true});
  }

  removeArrow() {
    if (this.#arrow !== null) {
      this.#arrow.remove();
    }
    this.#arrow = null;
    if (this.#arrowReverse !== null) {
      this.#arrowReverse.remove();
    }
  }

  showArrow(effect="draw") {
    if (!this.#identifier.hasDeclaration()) {
      return;
    }
    if (this.#arrow === null) {
      this.initializeArrow();
    }
    this.#arrow.show(effect);
  }

  showArrowReverse(effect="draw") {
    if (!this.#identifier.hasDeclaration()) {
      return;
    }
    if (this.#arrowReverse === null) {
      this.initializeArrowReverse();
    }
    this.#arrowReverse.show(effect);
  }

  hideArrow() {
    if (!this.#identifier.hasDeclaration()) {
      return;
    }
    if (this.#arrow === null) {
      this.initializeArrow();
    }
    this.#arrow.hide("draw");
  }

  hideArrowReverse() {
    if (!this.#identifier.hasDeclaration()) {
      return;
    }
    if (this.#arrowReverse === null) {
      this.initializeArrowReverse();
    }
    this.#arrowReverse.hide("draw");
  }
}


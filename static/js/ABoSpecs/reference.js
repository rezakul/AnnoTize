class Reference {
  #id;
  #target;
  #source;
  #undirected;
  #label;

  /* the html arrow displayed to the user */
  #arrow;
  /* the event hover callback functions */
  #funcOver;
  #funcOut;
  /* emitter to signal changes to reference (source / target remove, add) */
  #emitter;

  /**
   * A reference containing a target and a source annotation + optional label.
   * 
   * @param {string} id unique identifier id
   * @param {string} source the source annotation id
   * @param {string} target the target annotation id
   * @param {string} label the reference label
   * @param {boolean} undirected true if path is undirected (default: false)
   *  
   */
  constructor(id, source, target, label='', undirected=false) {
    this.#id = id;
    // setup emitter to signal changes
    this.#emitter = new EventTarget();
    // initalize the hover function callbacks
    this.#funcOver = event => this.showArrow();
    this.#funcOut = event => this.hideArrow();
    // set private members
    this.#label = label;
    this.#undirected = undirected;
    // use set Source/Target to notify annotations about reference. Call last so label / callbacks are already defined
    this.setSource(source);
    this.setTarget(target);
    // this.#randomColor = "#" + ((Math.random()*0xFFFFFF<<0).toString(16)).padStart(6, '0');
  }

  /**
   * The unique reference id.
   */
  get id() {
    return this.#id;
  }

  set id(val) {
    this.#id = val;
  }

  /**
   * The reference source.
   * @returns {IdentifierDeclaration}
   */
  get source() {
    return this.#source;
  }

  /**
   * The reference target.
   */
  get target() {
    return this.#target;
  }

  /**
   * The emitter to listen to changes (i.e. add / removal of source / target)
   */
  get emitter() {
    return this.#emitter;
  }

  /**
   * The label of the reference.
   * @returns {string}
   */
  get label() {
    return this.#label;
  }

  /**
   * Export this identifier to json.
   * 
   * @param {any} key a key may given by JSON.stringify()
   * @returns {object} (JSON) stringifyable object
   */
  toJSON(key) {
    let json = {};

    return json;
  }

  hasSource() {
    return this.#source !== undefined;
  }

  hasTarget() {
    return this.#target !== undefined;
  }

  setSource(source) {
    if (!source) {
      return false;
    }
    // remove old source (if present)
    this.removeSource();
    // set new source
    this.#source = source;
    // initialize arrow (if source and target present)
    this.initializeArrow();
    // set reference in annotation body
    runtime.getAnnotationForId(source).annotationBody.addReference(this);
    // notify with event
    this.emitter.dispatchEvent(new CustomEvent('sourceAdd'));
    return true;
  }

  setTarget(target) {
    if (!target) {
      return false;
    }
    // remove old target (if present)
    this.removeTarget();
    // set new target
    this.#target = target;
    // initialize arrow (if source and target present)
    this.initializeArrow();
    // set reference in annotation body
    runtime.getAnnotationForId(target).annotationBody.addReference(this);
    // notify with event
    this.emitter.dispatchEvent(new CustomEvent('targetAdd'));
    return true;
  }

  removeSource() {
    if (!this.hasSource()) {
      return false;
    }
    // remove the arrows from the html document
    this.removeArrow();
    // remove reference in annotation body
    runtime.getAnnotationForId(this.#source).annotationBody.removeReference(this.id);
    // set source to undefined
    this.#source = undefined;
    // notify with event
    this.emitter.dispatchEvent(new CustomEvent('sourceRemove'));
    return true;
  }

  removeTarget() {
    if (!this.hasTarget()) {
      return false;
    }
    // remove the arrows from the html document
    this.removeArrow();
    // remove reference in annotation body
    runtime.getAnnotationForId(this.#target).annotationBody.removeReference(this.id);
    // set target to undefined
    this.#target = undefined;
    // notify with event
    this.emitter.dispatchEvent(new CustomEvent('targetRemove'));
    return true;
  }

  remove() {
    // remove source and target from the reference (also removes hover event listener)
    this.removeSource();
    this.removeTarget();
  }

  initializeArrow(suppress=false) {
    let sourceAnnotation, targetAnnotation;
    let start, end, startPlug, endPlug;
    // check if source and target defined
    if (! (this.hasSource() && this.hasTarget())) {
      return false;
    }
    // get the annotation objects
    sourceAnnotation = runtime.getAnnotationForId(this.#source);
    targetAnnotation = runtime.getAnnotationForId(this.#target);
    // set the hover callback for the annotations
    sourceAnnotation.registerTextHoverCallback(this.#funcOver, this.#funcOut);
    targetAnnotation.registerTextHoverCallback(this.#funcOver, this.#funcOut);

    // set start and end point
    start = sourceAnnotation.firstTextElement;
    end = targetAnnotation.firstTextElement;
    // set the type of plug
    if (this.#undirected) {
      startPlug = 'disc';
      endPlug = 'disc';
    } else {
      startPlug = 'behind';
      endPlug = 'arrow1';
    }
    // create arrow
    this.#arrow = new LeaderLine(start, end, {color: 'black', size: 2, path: "fluid", hide: true, startPlug: startPlug, endPlug: endPlug, middleLabel: this.#label});
    // register reference to runtime
    if (!suppress) {
      runtime.addReferenceArrow(this);
    }
    
  }


  removeArrow(suppress=false) {
    let sourceAnnotation, targetAnnotation;
    if (this.#arrow === undefined) {
      return false;
    }
    // remove html arrow
    this.#arrow.remove();
    this.#arrow = undefined;
    // get annotations
    sourceAnnotation = runtime.getAnnotationForId(this.#source);
    targetAnnotation = runtime.getAnnotationForId(this.#target);
    // remove event
    sourceAnnotation.removeTextHoverCallback(this.#funcOver, this.#funcOut);
    targetAnnotation.removeTextHoverCallback(this.#funcOver, this.#funcOut);
    // deregister reference to runtime
    if (!suppress) {
      runtime.removeReferenceArrow(this);
    }
  }

  syncArrows() {
    this.removeArrow();
    this.initializeArrow();
  }

  showArrow(effect="draw") {
    if (this.#arrow !== undefined) {
      this.#arrow.show(effect);
    }
  }

  hideArrow() {
    if (this.#arrow !== undefined) {
      this.#arrow.hide("draw");
    } 
  }

  resizeEvent(event) {
    // should work automatically but somehow sometimes doesn't
    if (this.#arrow !== undefined) {
      this.#arrow.position();
    }
  }
}
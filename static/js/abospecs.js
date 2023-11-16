class ABoSpec {
  #style;
  #styleOverwritable;
  #abospec;
  #lastInteractedAnnotation;
  #color;

  /**
   * Create a new ABoSpec object
   * @param {*} abospec 
   */
  constructor(abospec) {
    this.#abospec = abospec;
    if (abospec.style !== undefined) {
      this.#style = abospec.style;
    } else {
      this.#style = 'default';
    }
    if (abospec.styleOverwritable !== undefined && this.#style !== 'default') {
      this.#styleOverwritable = abospec.styleOverwritable;
    } else {
      this.#styleOverwritable = true;
    }
    this.#color = "#" + ((Math.random()*0xFFFFFF<<0).toString(16)).padStart(6, '0');
  }

  get concept() {
    return this.#abospec;
  }

  get style() {
    return this.#style;
  }

  set style(val) {
    if (runtime.hasStyle(val)) {
      this.#style = val;
    }
  }

  get styleOverwritable() {
    return this.#styleOverwritable;
  }

  set styleOverwritable(val) {
    this.#styleOverwritable = val;
  }

  get lastInteractedAnnotation() {
    return this.#lastInteractedAnnotation;
  } 

  set lastInteractedAnnotation(val) {
    this.#lastInteractedAnnotation = val;
  }

  get color() {
    return this.#color;
  }
}

class ABoSpecs {
  #abospecs = new Map();
  #emitter;
  #lastInteracted = new Map();

  constructor() {
    // load default concepts
    for (let abospec of default_concepts) {
      let abs = new ABoSpec(abospec);
      this.#abospecs.set(abospec.name, abs);
    }
    // setup emitter
    this.#emitter = new EventTarget();
  }

  get emitter() {
    return this.#emitter;
  }

  get abospecNames() {
    return Array.from(this.#abospecs.keys()).sort();
  }

  getABoSpecForName(name) {
    return this.#abospecs.get(name);
  }

  setLastInteraction(name, value, id) {
    if (!this.#lastInteracted.has(id)) {
      let newRuntimeMap = new Map();
      this.#lastInteracted.set(id, newRuntimeMap);
    }
    const map = this.#lastInteracted.get(id);
    map.set(name, value);
  }

  getLastInteraction(name, id) {
    if (!this.#lastInteracted.has(id)) {
      return undefined;
    }
    return  this.#lastInteracted.get(id).get(name);
  }

  addABoSpec(abospec, suppressEvent=false) {
    let newConcept = new ABoSpec(abospec);
    this.#abospecs.set(abospec.name, newConcept);
    if (!suppressEvent) {
      this.emitter.dispatchEvent(new CustomEvent("conceptListChange", {detail: {change: "add"}}));
    }
  }

  removeABoSpec(abospec) {
    let res = this.#abospecs.delete(abospec);
    this.emitter.dispatchEvent(new CustomEvent("conceptListChange", {detail: {change: "remove"}}));
    return res;
  }

  clearABoSpecs() {
    this.#abospecs = new Map();
    this.emitter.dispatchEvent(new CustomEvent("conceptListChange", {detail: {change: "removeAll"}}));
  }

  #conceptFileReaderEvent(event) {
    let result, jsonObj;
    result = event.target.result;
    jsonObj = JSON.parse(result);
      
    if (jsonObj.concepts) {
      for (let concept of jsonObj.concepts) {
        this.addABoSpec(concept, true);
      }
      this.emitter.dispatchEvent(new CustomEvent("conceptListChange", {detail: {change: "addMultiple"}}));
    }
  }

  #handleConceptUpload(evt) {
    try {
        let files = evt.target.files;
        if (!files.length) {
          console.warn('No file selected!');
            return;
        }
        let file = files[0];
        let reader = new FileReader();
        reader.addEventListener('load', event => this.#conceptFileReaderEvent(event));
        reader.readAsText(file);
    } catch (err) {
        console.error(err);
    }
  }

  uploadABoSpecs(event) {
    let uploadAnchorNode;

    uploadAnchorNode = document.createElement('input');
    uploadAnchorNode.setAttribute("type", "file");
    uploadAnchorNode.setAttribute("accept", "application/json, .jsonld");
    // add to html - required for firefox
    // document.body.appendChild(uploadAnchorNode); 
    uploadAnchorNode.addEventListener('change', event => this.#handleConceptUpload(event));
    uploadAnchorNode.click();
    // uploadAnchorNode.remove();
  }
}

const ATABoSpecs = new ABoSpecs();
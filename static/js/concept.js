class Concept {
  #style;
  #styleOverwritable;
  #concept;
  #lastInteractedAnnotation;
  #color;

  constructor(concept) {
    this.#concept = concept;
    if (concept.style !== undefined) {
      this.#style = concept.style;
    } else {
      this.#style = 'default';
    }
    if (concept.styleOverwritable !== undefined && this.#style !== 'default') {
      this.#styleOverwritable = concept.styleOverwritable;
    } else {
      this.#styleOverwritable = true;
    }
    this.#color = "#" + ((Math.random()*0xFFFFFF<<0).toString(16)).padStart(6, '0');
  }

  get concept() {
    return this.#concept;
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

class ConceptPlugin {
  #concepts = new Map();
  #emitter;
  #lastInteracted = new Map();

  constructor() {
    // load default concepts
    for (let concept of default_concepts) {
      let newConcept = new Concept(concept);
      this.#concepts.set(concept.name, newConcept);
    }
    // setup emitter
    this.#emitter = new EventTarget();
  }

  get emitter() {
    return this.#emitter;
  }

  get conceptNames() {
    return Array.from(this.#concepts.keys()).sort();
  }

  getConceptForName(concept) {
    return this.#concepts.get(concept);
  }

  setLastInteraction(concept, value, id) {
    if (!this.#lastInteracted.has(id)) {
      let newRuntimeMap = new Map();
      this.#lastInteracted.set(id, newRuntimeMap);
    }
    const map = this.#lastInteracted.get(id);
    map.set(concept, value);
  }

  getLastInteraction(concept, id) {
    if (!this.#lastInteracted.has(id)) {
      return undefined;
    }
    return  this.#lastInteracted.get(id).get(concept);
  }

  addConcept(concept, suppressEvent=false) {
    let newConcept = new Concept(concept);
    this.#concepts.set(concept.name, newConcept);
    if (!suppressEvent) {
      this.emitter.dispatchEvent(new CustomEvent("conceptListChange", {detail: {change: "add"}}));
    }
  }

  removeConcept(concept) {
    let res = this.#concepts.delete(concept);
    this.emitter.dispatchEvent(new CustomEvent("conceptListChange", {detail: {change: "remove"}}));
    return res;
  }

  removeAllConcepts() {
    this.#concepts = new Map();
    this.emitter.dispatchEvent(new CustomEvent("conceptListChange", {detail: {change: "removeAll"}}));
  }

  #conceptFileReaderEvent(event) {
    let result, jsonObj;
    result = event.target.result;
    jsonObj = JSON.parse(result);
      
    if (jsonObj.concepts) {
      for (let concept of jsonObj.concepts) {
        this.addConcept(concept, true);
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

  uploadConcepts(event) {
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

const conceptPlugin = new ConceptPlugin();
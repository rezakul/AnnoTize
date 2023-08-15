/**
 * A simple tag body containing one tag value. 
 * @extends {AnnotationBody} extends the abstract AnnotationBody class. 
 */
class GroundingBody extends AnnotationBody {
  #grounding;

  /**
   * Creates a SimpleTagBody with a given tag.
   * @param {State} state the state of the annotation
   * @param {Tag} tag the tag
   */
  constructor(state, grounding=null) {
    super(state);
    if (grounding === null) {
      this.#grounding = new Grounding("", null, null);
    } else {
      this.#grounding = grounding;
    }
  }

  /**
   * The grounding value.
   * @returns {Grounding}
   */
  get grounding() {
    return this.#grounding;
  }

  set grounding(val) {
    this.#grounding = val;
  }

  /**
   * Get the highlight color for this element.
   * @returns {String} css color
   */
  get color() {
    return AnnotationColors.HIGHLIGHT;
  }

  /**
   * Get the visibility of the tag.
   * @returns {boolean} if the element should be visible to the user
   */
  get visibility() {
    return true;
    /*if (this.state === State.Edit) {
      return true;
    }
    return this.tag.visibility;
    */
  }

  toJSON(key) {
    let json = {};

    json.type = "https://sigmathling.kwarc.info/resources/grounding-dataset/groundingBody";
    json["asa:hasGrounding"] = this.grounding.grounding;
    json["asa:hasArity"] = this.grounding.arity;
    if (this.grounding.hasSog()) {
      json["asa:hasSog"] = this.grounding.sog;
    }
    
    return json;
  }

  #getChangeCallback(signalValid, signalInvalid) {
    let callback;
    callback = (event) => {
      let input1, input2, input3, input4;
      let id;
      id = event.target.dataset.customId;
      input1 = document.getElementById(id + '-annotation-grounding-value');
      input2 = document.getElementById(id + '-annotation-arity-value');
      input3 = document.getElementById(id + '-annotation-has-sog-value');
      input4 = document.getElementById(id + '-annotation-sog-value');
      if (input1.value !== "" && input2.value !== "" && (!input3.checked || input4.value !== "")) {
        signalValid();
      } else {
        signalInvalid(); 
      }
    }
    return callback;
  }

  #setTextareaHeight(text) {
    // TODO
    document.body.appendChild(text);
    text.style.height = ( text.scrollHeight - 44 ) + "px";
    if (text.scrollWidth !== 244) {
      text.style.height = text.scrollHeight - 24 + "px";
    }
    document.body.removeChild(text);
  }

  #groundingTab(disabled) {
    let wrapper, label, text;
    wrapper = document.createElement('div');

    label = document.createElement('label');
    label.setAttribute('for', this.bodyID + '-annotation-grounding-value');
    label.setAttribute('class', 'annotation-display-label');
    label.textContent = "Grounding:";

    text = document.createElement('textarea');
    text.setAttribute('id', this.bodyID + '-annotation-grounding-value');
    text.setAttribute('class', 'annotation-sidebar-textarea');
    text.dataset.customId = this.bodyID;
    text.disabled = disabled;
    text.textContent = this.#grounding.grounding;
    this.#setTextareaHeight(text);
    wrapper.appendChild(label);
    wrapper.appendChild(text);
    return wrapper;
  }

  #arityTab(disabled) {
    let wrapper, label, input;
    wrapper = document.createElement('div');

    label = document.createElement('label');
    label.setAttribute('for', this.bodyID + '-annotation-arity-value');
    label.setAttribute('class', 'annotation-display-label');
    label.textContent = "Arity:";

    input = document.createElement('input');
    input.setAttribute('id', this.bodyID + '-annotation-arity-value');
    input.setAttribute('class', 'annotation-sidebar-input');
    input.setAttribute('type', 'number');
    input.setAttribute('step', 1);
    input.setAttribute('min', 0);
    input.dataset.customId = this.bodyID;
    input.disabled = disabled;
    input.value = this.#grounding.arity;
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return wrapper;
  }

  #displayGrounding() {
    return this.#groundingTab(true);
  }

  #displayArity() {
    return this.#arityTab(true);
  }

  #displaySog() {
    let wrapper, label, button;
    wrapper = document.createElement('div');
    if (this.#grounding.hasSog()) {
      label = document.createElement('label');
      label.setAttribute('for', this.bodyID + '-annotation-sog-value');
      label.setAttribute('class', 'annotation-display-label');
      label.textContent = "Sog:";

      button = document.createElement('button');
      button.setAttribute('id', this.bodyID + '-annotation-sog-value');
      button.setAttribute('class', 'annotation-sidebar-button');
      button.textContent = this.#grounding.sog;
      button.dataset.target = this.#grounding.sog;
      button.dataset.customId = this.bodyID;
      button.addEventListener('click', runtime.gotoAnnotation);

      wrapper.appendChild(label);
      wrapper.appendChild(button);
    } else {
      wrapper.style.display = "hidden";
    }
    return wrapper;
  }

  #editGrounding(signalValid, signalInvalid) {
    let tab, input;
    let id, changeCallback;
    tab = this.#groundingTab(false);
    id = this.bodyID + '-annotation-grounding-value';
    id = id.replaceAll('-', '\\-');
    input = tab.querySelector("#" + id);
    // callback for user input
    changeCallback = this.#getChangeCallback(signalValid, signalInvalid);
    input.addEventListener("input", changeCallback);
    return tab;
  }

  #editArity(signalValid, signalInvalid) {
    let tab, input;
    let id, changeCallback;
    tab = this.#arityTab(false);
    id = this.bodyID + '-annotation-arity-value';
    id = id.replaceAll('-', '\\-');
    input = tab.querySelector("#" + id);
    // callback for user input
    changeCallback = this.#getChangeCallback(signalValid, signalInvalid);
    input.addEventListener("input", changeCallback);
    return tab;
  }

  #selectSogFromText() {
    let wrapper, button, icon, label;
    let callbackSelect, callbackType, customId;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-menu-selection');

    button = document.createElement('button');
    button.setAttribute('id', this.bodyID + "-click-select-identifier");
    button.setAttribute('class', 'annotation-menu-selection-button');

    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined');
    icon.textContent = "point_scan";
    icon.style.padding = "0px";
    button.appendChild(icon);

    customId = this.bodyID;
    callbackSelect = (annotation) => {
      let input;
      input = document.getElementById(customId + "-annotation-sog-value");
      input.value = annotation.id;
      input.dispatchEvent(new Event('input'));
    };
    callbackType = (annotation) => {
      return annotation.annotationType.startsWith('SimpleTagBody');
    }
    button.addEventListener('click', (event) => ((callbackSelect, callbackType) => {
      runtime.selectAnnotationFromDocument(callbackSelect, callbackType);
    })(callbackSelect, callbackType));

    label = document.createElement('label');
    label.setAttribute('for', this.bodyID + "-click-select-identifier");
    label.textContent = "Select from document:";
    label.style.marginRight = "10px";
    
    wrapper.appendChild(label);
    wrapper.appendChild(button);
    wrapper.style.marginTop = "10px";
    return wrapper;
  }

  #editSog(signalValid, signalInvalid) {
    let wrapper, wrapperHide, label, input, br;
    let changeCallback;

    wrapper = document.createElement('div');
    wrapperHide = document.createElement('div');
    // callback for save
    changeCallback = this.#getChangeCallback(signalValid, signalInvalid);
    // has sog selection
    label = document.createElement('label');
    label.setAttribute('for', this.bodyID + '-annotation-has-sog-value');
    label.setAttribute('class', 'annotation-display-label');
    label.textContent = "Has-Sog:";

    input = document.createElement('input');
    input.setAttribute('id', this.bodyID + '-annotation-has-sog-value');
    input.setAttribute('class', 'annotation-sidebar-checkbox');
    input.setAttribute('type', "checkbox");
    input.dataset.customId = this.bodyID;
    if (this.#grounding.hasSog()) {
      input.checked = true;
    } else {
      input.checked = false;
      wrapperHide.hidden = true;
    }
    input.addEventListener("change", (event) => {
      if (event.target.checked) {
        wrapperHide.hidden = false;
      } else {
        wrapperHide.hidden = true;
      }
      changeCallback(event);
    });
    br = document.createElement('br');
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    wrapper.appendChild(br);


    label = document.createElement('label');
    label.setAttribute('for', this.bodyID + '-annotation-sog-value');
    label.setAttribute('class', 'annotation-display-label');
    label.textContent = "Sog:";

    input = document.createElement('input');
    input.setAttribute('id', this.bodyID + '-annotation-sog-value');
    input.setAttribute('class', 'annotation-sidebar-input');
    input.value = this.#grounding.sog;
    input.dataset.customId = this.bodyID;
    input.addEventListener("input", changeCallback);

    wrapperHide.appendChild(label);
    wrapperHide.appendChild(input);
    wrapperHide.appendChild(this.#selectSogFromText());
    wrapper.appendChild(wrapperHide);

    return wrapper;
  }

  createElementCreation(signalValid, signalInvalid) {
    let wrapper, p, hline;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'tag-wrapper');

    hline = document.createElement('div');
    hline.setAttribute('class', 'hline');
    wrapper.appendChild(hline);

    p = document.createElement('p');
    p.textContent = "Grounding:";
    p.style.fontWeight = "bold";
    wrapper.appendChild(p);

    wrapper.appendChild(this.#editGrounding(signalValid, signalInvalid));
    wrapper.appendChild(this.#editArity(signalValid, signalInvalid));
    wrapper.appendChild(this.#editSog(signalValid, signalInvalid));
    
    // start state is invalid if not all values present
    if (!this.grounding || !this.grounding.grounding || !this.grounding.arity || this.grounding.sog === '') {
      signalInvalid();
    } else {
      signalValid();
    }
    return wrapper;
  }

  createElementEdit(signalValid=null, signalInvalid=null) {
    let element;
    if (signalValid === null) {
      signalValid = () => {this.saveEnabled()};
    }
    if (signalInvalid === null) {
      signalInvalid = () => {this.saveDisabled()};
    }
    element = this.createElementCreation(signalValid, signalInvalid);
    // this.#setupTagSelection(element);
    this.setElementContent(element);
    return this.element;
  }

  createElementDisplay() {
    let wrapper, p;
  
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'tag-wrapper');
    // body description
    p = document.createElement('p');
    p.textContent = "GroundingBody:";
    p.style.fontWeight = "bold";
    wrapper.appendChild(p);
    // set tag
    wrapper.appendChild(this.#displayGrounding());
    wrapper.appendChild(this.#displayArity());
    wrapper.appendChild(this.#displaySog());
    this.setElementContent(wrapper);
    
    return this.element;
  }

  focus() {

  }

  isValue(val) {
    return null;
  }

  save() {
    let hasSog;

    this.grounding.grounding = document.getElementById(this.bodyID + '-annotation-grounding-value').value;
    this.grounding.arity = document.getElementById(this.bodyID + '-annotation-arity-value').value;
    hasSog = document.getElementById(this.bodyID + '-annotation-has-sog-value').checked;
    if (hasSog) {
      this.grounding.sog = document.getElementById(this.bodyID + '-annotation-sog-value').value;
    } else {
      this.grounding.sog = null;
    }
    super.save();
  }

  edit() {
    super.edit();
  }

  cancel() {
    super.cancel();
  }

  copy() {
    let copy, groundingObj, elem;
    let grounding, arity, sog;
    // get current grounding value
    elem = document.getElementById(this.bodyID + '-annotation-grounding-value');
    if (elem) {
      grounding = elem.value;
    } else if (this.grounding !== null) {
      grounding = this.grounding.grounding;
    }
    // get current arity value
    elem = document.getElementById(this.bodyID + '-annotation-arity-value');
    if (elem && elem.value !== '') {
      arity = elem.value;
    } else if (this.grounding !== null) {
      arity = this.grounding.arity;
    }
    // get current sog value
    elem = document.getElementById(this.bodyID + '-annotation-has-sog-value');
    if (elem && elem.checked) {
      elem = document.getElementById(this.bodyID + '-annotation-sog-value');
      sog = elem.value;
    } else if (this.grounding !== null) {
      sog = this.grounding.sog;
    }
    groundingObj = new Grounding(grounding, arity, sog);
    copy = new GroundingBody(this.state, groundingObj);
    return copy;
  }
}
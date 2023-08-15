/**
 * The template for the grounding body
 * @extends {AbstractTemplateBody} extends the abstract template structure. 
 */
class GroundingTemplate extends AbstractTemplateBody {
  #hasGrounding;
  #hasArity;
  #hasSog;

  /**
   * Creates a SimpleTagBody with a given tag.
   * @param {State} state the state of the annotation
   * @param {Tag} tag the tag
   */
  constructor(hasGrounding="", hasArity="", hasSog=null) {
    super();
    this.#hasGrounding = hasGrounding;
    this.#hasArity = hasArity;
    this.#hasSog = hasSog;
  }

  get displayName() {
    return "GroundingBody";
  }

  toJSON(key) {
    let json = {};

    json.type = "https://sigmathling.kwarc.info/resources/grounding-dataset/groundingBody";
    json["asa:hasGrounding"] = this.#hasGrounding;
    json["asa:hasArity"] = this.#hasArity;
    if (this.#hasSog !== null) {
      json["asa:hasSog"] = this.#hasSog;
    }
    
    return json;
  }

  #groundingTab() {
    let wrapper, label, text;
    wrapper = document.createElement('div');

    label = document.createElement('label');
    label.setAttribute('for', this.bodyID + '-annotation-grounding-value');
    label.setAttribute('class', 'annotation-display-label');
    label.textContent = "Grounding:";

    text = document.createElement('textarea');
    text.setAttribute('id', this.bodyID + '-annotation-grounding-value');
    text.setAttribute('class', 'annotation-sidebar-textarea');
    text.textContent = this.#hasGrounding;

    wrapper.appendChild(label);
    wrapper.appendChild(text);
    return wrapper;
  }

  #arityTab() {
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
    input.value = this.#hasArity;

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return wrapper;
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

  #sogTab() {
    let wrapper, wrapperHide, label, input, br;

    wrapper = document.createElement('div');
    wrapperHide = document.createElement('div');
    
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

    if (this.#hasSog !== null) {
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
    input.value = this.#hasSog;

    wrapperHide.appendChild(label);
    wrapperHide.appendChild(input);
    wrapperHide.appendChild(this.#selectSogFromText());
    wrapper.appendChild(wrapperHide);

    return wrapper;
  }

  content() {
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

    wrapper.appendChild(this.#groundingTab());
    wrapper.appendChild(this.#arityTab());
    wrapper.appendChild(this.#sogTab());
    
    return wrapper;
  }

  save() {
    let sog;

    this.#hasGrounding = document.getElementById(this.bodyID + '-annotation-grounding-value').value;
    this.#hasArity = document.getElementById(this.bodyID + '-annotation-arity-value').value;
    // check if has-sog
    sog = document.getElementById(this.bodyID + '-annotation-has-sog-value').checked;
    if (sog) {
      this.#hasSog = document.getElementById(this.bodyID + '-annotation-sog-value').value;
    } else {
      this.#hasSog = null;
    }
  }

  getAnnotationFromTemplate(state) {
    let body, grounding;
    grounding = new Grounding(this.#hasGrounding, this.#hasArity, this.#hasSog);
    body = new GroundingBody(state, grounding);
    return body;
  }
}
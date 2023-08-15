

/**
 * A simple text body containing one string value. 
 * @extends {AnnotationBody} extends the abstract AnnotationBody class. 
 */
class SimpleTextBody extends AnnotationBody {
  #value;

  /**
   * Creates a SimpleTextBody with a given text.
   * @param {State} state the state of the annotation
   * @param {string} value the text field (default empty string)
   */
  constructor(state, value = "") {
    super(state);
    this.value = value;
  }

  /**
   * The text value.
   * @returns {string}
   */
  get value() {
    return this.#value;
  }

  set value(val) {
    this.#value = val;
  }

  toJSON(key) {
    let json = {};

    json.type = "SimpleTextBody";
    json.val = this.value;
    
    return json;
  }

  #textBox(signalValid, signalInvalid) {
    let wrapper, p, textArea, label;
    let callback, currentValue;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-simple-text-body-selection');

    p = document.createElement('p');
    p.textContent = 'Annotation-Text:';
    p.style.fontWeight = "bold";
    wrapper.appendChild(p);

    label = document.createElement('label');
    label.textContent = 'Annotation-Description:';
    label.setAttribute('class', 'annotation-creation-label');
    label.setAttribute('for', this.bodyID + '-annotation-simple-text-body-textarea');
    wrapper.appendChild(label);

    textArea = document.createElement('textarea');
    textArea.setAttribute('id', this.bodyID + '-annotation-simple-text-body-textarea');
    textArea.setAttribute('class', 'annotation-sidebar-textarea');
    textArea.value = this.value;
    
    currentValue = this.value;
    callback = (event) => {
      if (event.target.value === "" || event.target.value === currentValue) {
        signalInvalid();
        // disabled button may not register mouse is over it
        runtime.sidebar.isMouseOverSidebar = true;
      } else {
        signalValid();
      }
    };
    // enable save only if some content
    textArea.addEventListener("input", callback);
    wrapper.appendChild(textArea);

    return wrapper;
  }

  createElementCreation(signalValid, signalInvalid) {
    let wrapper, hline;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-simple-text-body');

    hline = document.createElement('div');
    hline.setAttribute('class', 'hline');
    wrapper.appendChild(hline);

    wrapper.appendChild(this.#textBox(signalValid, signalInvalid));

    // invalid if no text
    if (!this.#value) {
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
    this.setElementContent(element);
    return this.element;
  }

  createElementDisplay() {
    let description;

    description = document.createElement('p');
    description.setAttribute('class', 'simple-text-body-description')
    description.textContent = this.value;
    
    this.setElementContent(description);
    return this.element;
  }

  save() {
    super.save();
    let textArea;
    textArea = document.getElementById(this.bodyID + '-annotation-simple-text-body-textarea');
    this.value = textArea.value;
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

  copy() {
    let copy, elem;
    let text;
    // get current grounding value
    elem = document.getElementById(this.bodyID + '-annotation-simple-text-body-textarea');
    if (elem) {
      text = elem.value;
    } else {
      text = this.#value;
    }
    copy = new SimpleTextBody(this.state, text);
    return copy;
  }
}


/**
 * A simple highlight body.
 * Lets the user highlight a textsegemnt for later annotation. 
 * @extends {AnnotationBody} extends the abstract AnnotationBody class. 
 */
class AnnotationHighlightBody extends AnnotationBody {
  #text;

  /**
   * Creates a SimpleTextBody with a given text.
   * @param {State} state the state of the annotation
   * @param {string} text the text field (default empty string)
   */
  constructor(state, text="") {
    super(state);
    this.text = text;
  }

  /**
   * The text value.
   * @returns {string}
   */
  get text() {
    return this.#text;
  }

  set text(val) {
    this.#text = val;
  }

  toJSON(key) {
    // should currently not be exported
    return super.toJSON();
  }

  #textBox() {
    let wrapper, textArea, label;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-simple-text-body-selection');

    label = document.createElement('label');
    label.textContent = 'Notes:';
    label.setAttribute('class', 'annotation-creation-label');
    label.setAttribute('for', this.bodyID + '-annotation-simple-text-body-textarea');
    label.style.marginTop = "10px";
    wrapper.appendChild(label);

    textArea = document.createElement('textarea');
    textArea.setAttribute('id', this.bodyID + '-annotation-simple-text-body-textarea');
    textArea.setAttribute('class', 'annotation-sidebar-textarea');
    textArea.value = this.text;
    
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

    wrapper.appendChild(this.#textBox());
    // always in a valid state
    signalValid();
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
    let textArea;

    if (this.text) {
      textArea = this.#textBox();
      textArea.lastChild.disabled = true;
    } else {
      textArea = document.createElement('div');
    }
    
    this.setElementContent(textArea);
    return this.element;
  }

  save() {
    let textArea;
    super.save();
    
    textArea = document.getElementById(this.bodyID + '-annotation-simple-text-body-textarea');
    if (textArea) {
      this.text = textArea.value;
    }
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
      text = this.text;
    }
    copy = new SimpleTextBody(this.state, text);
    return copy;
  }
}
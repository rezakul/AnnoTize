/**
 * The template for the grounding body
 * @extends {AbstractTemplateBody} extends the abstract template structure. 
 */
class SimpleTextBodyTemplate extends AbstractTemplateBody {
  #text;

  /**
   * Creates a SimpleTagBody with a given tag.
   * @param {State} state the state of the annotation
   * @param {string} text (optional) the text content
   */
  constructor(text="") {
    super();
    this.#text = text;
  }

  get displayName() {
    return "SimpleTextBody";
  }

  toJSON(key) {
    let json = {};

    json.type = "SimpleTextBody";
    json.text = this.#text;
    
    return json;
  }

  #textBox() {
    let wrapper, p, textArea, label;

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
    textArea.value = this.#text;
    wrapper.appendChild(textArea);

    return wrapper;
  }

  content() {
    let wrapper, hline;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-simple-text-body');

    hline = document.createElement('div');
    hline.setAttribute('class', 'hline');
    wrapper.appendChild(hline);

    wrapper.appendChild(this.#textBox());

    return wrapper;
  }

  save() {
    this.#text = document.getElementById(this.bodyID + '-annotation-simple-text-body-textarea').value;
  }

  getAnnotationFromTemplate(state) {
    let body;
    body = new SimpleTextBody(state, this.#text);
    return body;
  }
}
/**
 * The template for the grounding body
 * @extends {AbstractTemplateBody} extends the abstract template structure. 
 */
class QuantTemplate extends AbstractTemplateBody {
  #scalar;
  #unit;

  /**
   * Creates a SimpleTagBody with a given tag.
   * @param {State} state the state of the annotation
   * @param {Tag} tag the tag
   */
  constructor(scalar="", unit="") {
    super();
    this.#scalar = scalar;
    this.#unit = unit;
  }

  get displayName() {
    return "QuantBody";
  }

  toJSON(key) {
    let json = {};

    json.type = "https://sigmathling.kwarc.info/resources/quantity-expressions/quantBody";
    json["rab:hasScalar"] = this.#scalar;
    json["rab:hasUnit"] = this.#unit;
    
    return json;
  }

  /**
   * Creates the scalar input field.
   * @returns {Node}
   */
  #scalarTab() {
    let wrapper, label, input;
    wrapper = document.createElement('div');

    label = document.createElement('label');
    label.setAttribute('for', this.bodyID + '-annotation-scalar-value');
    label.setAttribute('class', 'annotation-display-label');
    label.textContent = "Scalar:";

    input = document.createElement('input');
    input.setAttribute('id', this.bodyID + '-annotation-scalar-value');
    input.setAttribute('class', 'annotation-sidebar-input');
    input.setAttribute('type', 'number');
    // also more decimal places are supported
    input.setAttribute('step', 0.1);  
    input.value = this.#scalar;

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return wrapper;
  }

  /**
   * Creates the unit input field.
   *
   * @returns {Node}
   */
  #unitTab() {
    let wrapper, label, input;
    wrapper = document.createElement('div');

    label = document.createElement('label');
    label.setAttribute('for', this.bodyID + '-annotation-unit-value');
    label.setAttribute('class', 'annotation-display-label');
    label.textContent = "Unit:";

    input = document.createElement('input');
    input.setAttribute('id', this.bodyID + '-annotation-unit-value');
    input.setAttribute('class', 'annotation-sidebar-input');
    input.setAttribute('type', 'text');
    input.value = this.#unit;

    wrapper.appendChild(label);
    wrapper.appendChild(input);
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
    p.textContent = "Quant:";
    p.style.fontWeight = "bold";
    wrapper.appendChild(p);

    wrapper.appendChild(this.#scalarTab());
    wrapper.appendChild(this.#unitTab());

    return wrapper;
  }

  save() {
    this.#scalar = document.getElementById(this.bodyID + '-annotation-scalar-value').value;
    this.#unit = document.getElementById(this.bodyID + '-annotation-unit-value').value;
  }

  getAnnotationFromTemplate(state) {
    let body, quant;
    quant = new Quant(this.#scalar, this.#unit);
    body = new QuantBody(state, quant);
    return body;
  }
}
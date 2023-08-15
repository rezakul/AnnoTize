class AbstractField {
  #body;
  #templateGenerator;
  #name;
  #atleast;
  #atmost;
  #templates;
  #HTMLDiv;
  /* save old state for cancel */
  #oldTemplates;
  // default values
  #defaultValues;

  constructor(body, generator, name, number=undefined, defaultValues) {
    this.#body = body;
    let defaultNumber;
    this.#templateGenerator = generator;
    this.#name = name;
    this.#defaultValues = defaultValues;
    this.#templates = [];
    if (number && number.atleast !== undefined) {
      this.#atleast = parseInt(number.atleast);
    } else {
      this.#atleast = 1;
    }
    if (number && number.atmost !== undefined) {
      if (!Number.isInteger(number.atmost)) {
        this.#atmost = Infinity
      } else {
        this.#atmost = parseInt(number.atmost);
      }
    } else {
      this.#atmost = 1;
    }
    if (number && number.default !== undefined) {
      defaultNumber = number.default;
    }
    if (this.#atleast > this.#atmost || defaultNumber > this.#atmost) {
      console.error('Invalid field number configuration: ', number);
      this.#atleast = 1;
      this.#atmost = 1;
    }
    this.#initialize(defaultNumber);
  }

  get name() {
    return this.#name;
  }

  /**
   * The body this field belongs to.
   * @returns {TemplateBody}
   */
  get body() {
    return this.#body;
  }

  get atleast() {
    return this.#atleast;
  }

  get atmost() {
    return this.#atmost;
  }

  get atmostString() {
    if (this.atmost === Infinity) {
      return "-";
    }
    return this.atmost;
  }

  get color() {
    if (this.#templates.length) {
      return this.#templates[0].color;
    }
  }

    /**
   * Export this annotation body to json.
   * 
   * @param {any} key a key may given by JSON.stringify()
   * @returns {object} (JSON) stringifyable object
   */
  toJSON(key) {
    let json = {};

    if (this.#templates.length === 1) {
      json.value = this.#templates[0];
    } else {
      json.values = [];
      for (let template of this.#templates) {
        json.values.push(template);
      }
    }
    
    return json;
  }

  exportAsTemplate() {
    let json, number;
    
    let tmp = this.#templateGenerator(this);
    json = tmp.exportAsTemplate();
    tmp.remove();

    json.default = [];
    for (let i = 0; i < this.#templates.length; ++i) {
      json.default.push(this.#templates[i].exportCurrentValue());
    }

    number = {};
    number.atleast = this.#atleast;
    number.atmost = this.#atmost;
    number.default = this.#templates.length;

    json.number = number;
    // json.rdfpred = this.#rdfpred;
    
    return json;
  }

  hasContent() {
    return this.#templates.length !== 0;
  }

  initalizeValues(values) {
    if (!values) {
      return;
    }
    let valArray = [];
    if (values.value !== undefined) {
      valArray.push(values.value);
    } else {
      valArray = values.values;
    }
    if (valArray.length < this.#atleast || valArray.length > this.#atmost) {
      console.log('Illegal number of values: ' + valArray.length + ' for ' + this.name);
      return;
    }
    for (let i = 0; i < valArray.length; ++i) {
      if (this.#templates.length <= i) {
        let template = this.#templateGenerator(this, i+1);
        template.initalizeValue(valArray[i]);
        this.#templates.push(template);
      } else {
        this.#templates[i].initalizeValue(valArray[i]);
      }
    }
  }

  #initialize(defaultNumber) {
    let size;
    // init the html div wrapper
    this.#HTMLDiv = document.createElement('div');

    if (defaultNumber !== undefined) {
      size = defaultNumber;
    } else {
      size = this.#atleast;
    } 
    // init the template fragments
    for (let i = 0; i < size; i++) {
      let template, defaultValue;
      if (this.#defaultValues) {
        defaultValue = this.#defaultValues[i];
      }
      if (this.#atleast !== this.#atmost) {
        template = this.#templateGenerator(this, i+1, defaultValue);
      } else {
        template = this.#templateGenerator(this, undefined, defaultValue);
      }
      
      this.#templates.push(template);
    }
  }

  #addFieldEvent(event, state) {
    let template, defaultValue;
    if (this.#templates.length >= this.#atmost) {
      // ignore event if max number
      return;
    }
    if (this.#defaultValues) {
      defaultValue = this.#defaultValues[this.#templates.length];
    }
    template = this.#templateGenerator(this, this.#templates.length + 1, defaultValue);
    this.#templates.push(template);
    this.#HTMLDiv.appendChild(template.content(state));
    // disable add button if number == atmost
    if (this.#templates.length >= this.#atmost) {
      event.target.classList.remove('material-symbols-hover');
      event.target.style.color = 'gray';
    }
    // enable remove button if number > atleast
    if (this.#templates.length > this.#atleast) {
      const add = event.target.parentNode.getElementsByClassName('remove')[0];
      add.classList.add('material-symbols-hover');
      add.style.removeProperty('color');
    }
    // set number of displayed fields
    event.target.parentNode.firstChild.textContent = this.#name + " (" + this.#templates.length + "/" + this.atmostString + ")";
    // signal change (set valid to false because new field may not be valid)
    this.body.emitter.dispatchEvent(new CustomEvent('validityChange', {detail: {valid: false}}));
  }

  #removeFieldEvent(event) {
    let template;
    if (this.#templates.length <= this.#atleast) {
      // ignore event if min number
      return;
    }
    template =  this.#templates.pop();
    this.#HTMLDiv.removeChild(this.#HTMLDiv.lastChild);
    // disable remove button if number == atleast
    if (this.#templates.length <= this.#atleast) {
      event.target.classList.remove('material-symbols-hover');
      event.target.style.color = 'gray';
    }
    // enable add button if number < atmost
    if (this.#templates.length < this.#atmost) {
      const add = event.target.parentNode.getElementsByClassName('add')[0];
      add.classList.add('material-symbols-hover');
      add.style.removeProperty('color');
    }
    // set number of displayed fields
    event.target.parentNode.firstChild.textContent = this.#name + " (" + this.#templates.length + "/" + this.atmostString + ")";
    // signal change (set valid to true because removal may make state valid)
    this.body.emitter.dispatchEvent(new CustomEvent('validityChange', {detail: {valid: true}}));
  }

  content(state) {
    let modifyNumber, span, add, remove;
    // clear old contnent
    this.#HTMLDiv.replaceChildren();
    if (state !== State.Display) {
      // add to add multiple fields (if enabled)
      modifyNumber = document.createElement('div');
      modifyNumber.setAttribute('class', 'add-concept-field');
      this.#HTMLDiv.appendChild(modifyNumber);
      // number of fields
      span = document.createElement('span');
      span.textContent = this.#name + " (" + this.#templates.length + "/" + this.atmostString + ")";
      modifyNumber.appendChild(span);
      // add input
      add = document.createElement('i');
      add.setAttribute('class', 'material-symbols-outlined material-symbols-hover add prevent-select');
      add.textContent = "add_circle";
      modifyNumber.appendChild(add);
      // remove input
      remove = document.createElement('i');
      remove.setAttribute('class', 'material-symbols-outlined material-symbols-hover remove prevent-select');
      remove.textContent = "do_not_disturb_on";
      modifyNumber.appendChild(remove);

      add.addEventListener('click', event => this.#addFieldEvent(event, state));
      remove.addEventListener('click', event => this.#removeFieldEvent(event));

      if (this.#templates.length >= this.#atmost) {
        add.classList.remove('material-symbols-hover');
        add.style.color = 'gray';
      }
      if (this.#templates.length <= this.#atleast) {
        remove.classList.remove('material-symbols-hover');
        remove.style.color = 'gray';
      }
    }    

    for (let template of this.#templates) {
      this.#HTMLDiv.appendChild(template.content(state));
    }
    
    return this.#HTMLDiv;
  }

  valid() {
    let valid = true;
    for (let template of this.#templates) {
      valid = valid & template.validState;
    }
    return valid;
  }

  save() {
    for (let template of this.#templates) {
     template.save();
    }
  }

  edit() {
    this.#oldTemplates = this.#templates.slice();
    for (let template of this.#templates) {
      template.edit();
     }
  }

  cancel() {
    this.#templates = this.#oldTemplates.slice();
    for (let template of this.#templates) {
      template.cancel();
     }
  }

  remove() {
    for (let template of this.#templates) {
      template.remove();
     }
  }
}
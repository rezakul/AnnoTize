/**
 * The base tmplate class that holds the template content. Displayed in Settings under Rapid Mode: Templates
 */
class BaseTemplateBody {
  #template;
  #templateHTML;
  #htmlElement;
  
  /**
   * Creates a base template that lets the user select between different template bodys.
   * 
   * @param {AbstractTemplateBody} template (optional) the template
   */
  constructor(template=null) {
    this.#template = template;
    this.#htmlElement = document.createElement('div');
    this.#htmlElement.setAttribute('class', 'template-body');
  }

  get template() {
    return this.#template;
  }

  set template(val) {
    this.#template = val;
  }

  hasTemplate() {
    return this.template !== null;
  }

  toJSON(key) {
    let json = {};

    if (this.hasTemplate()) {
      return this.template.toJSON();
    } 
    json.error = "No template set yet";
    
    return json;
  }

  /**
   * Change the template content.
   */
  changeTemplateContent() {
    let content;
  
    content = this.template.content();
    if (this.#templateHTML) {
      this.#htmlElement.replaceChild(content, this.#templateHTML);
    } else {
      this.#htmlElement.appendChild(content);
    }
    
    this.#templateHTML = content;
  }
  
  /**
   * Create a dropdown (select) menu for the template type
   * @returns 
   */
  #templateSelectionDropdown() {
    let wrapper, label, select, description, option;
    let annotationTypes, thisElement, callback;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-type-selection');

    // Tag selection drop-down menu
    label = document.createElement('label');
    label.textContent = 'Template-Type:';
    label.setAttribute('class', 'template-label');
    wrapper.appendChild(label);

    select = document.createElement('select');
    select.setAttribute('class', 'template-select');
    select.required = true;
    // event listener with change callback
    thisElement = this;
    callback = (event) => {
      thisElement.template =  runtime.getTemplateForName(event.target.value);
      thisElement.changeTemplateContent();
    }
    select.addEventListener("change", callback);
    label.appendChild(select);

    description = document.createElement('option');
    description.setAttribute('value', "");  
    description.disabled = true;
    description.hidden = true;
    if (!this.hasTemplate()) {
      description.selected = true;
    }
    description.textContent = "Choose Annotation Type";
    select.appendChild(description);
    
    annotationTypes = runtime.getTemplateNameList();
    for (let annotationType of annotationTypes) {
      option = document.createElement('option');
      option.setAttribute('value', annotationType);
      option.textContent = annotationType;
      if (this.hasTemplate() && this.template.displayName === annotationType) {
        option.selected = true;
      } 
      select.appendChild(option);
    }

    return wrapper;
  }

  display() {
    let wrapper, p;
    let templateSelection;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', "select-basic-wrapper");
    wrapper.style.marginBottom = "25px";

    p = document.createElement('p');
    p.textContent = 'Template:';
    p.style.fontWeight = "bold";
    wrapper.appendChild(p);

    templateSelection = this.#templateSelectionDropdown();
    wrapper.appendChild(templateSelection);

    // clear element
    this.#htmlElement.replaceChildren();
    // add selection dropdown
    this.#htmlElement.appendChild(wrapper);
    // add template content
    if (this.hasTemplate()) {
      this.#templateHTML = this.template.content();
      this.#htmlElement.appendChild(this.#templateHTML);
    }

    return this.#htmlElement;
  }

  reset() {
    let select;
    this.template = null;
    if (this.#templateHTML) {
      this.#htmlElement.removeChild(this.#templateHTML);
    }
    this.#templateHTML = null;
    // reset select
    select = this.#htmlElement.getElementsByTagName('select')[0];
    select.options[0].selected = true; 

  }

  save() {
    if (!document.body.contains(this.#htmlElement)) {
      return;
    }
    if (this.hasTemplate()) {
      this.template.save();
    }
  }
}
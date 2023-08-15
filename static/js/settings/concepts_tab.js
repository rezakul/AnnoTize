class ConceptsTab extends AbstractSettingsTab {
  #eventListenerInit = false;

  constructor () {
    super();
  }

  createContent() {
    let content;
    content = document.createElement('div');
    content.setAttribute('class', 'settings-tab-content');
    content.appendChild(this.#importConcepts());
    content.appendChild(this.#showConcepts());
    content.appendChild(this.#removeAllConcepts());
    // only register eventListser once
    if (this.#eventListenerInit === false) {
      // react to concept changes
      conceptPlugin.emitter.addEventListener('conceptListChange', event => this.#conceptChange(event));
      this.#eventListenerInit = true;
    }
    return content;
  }

  #importConcepts() {
    let div, title, wrapper, span, button, icon;

    div = document.createElement('div');
    div.setAttribute('class', 'entry');

    title = document.createElement('h3');
    title.textContent = "Import:";
    div.appendChild(title);

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'settings-entry-wrapper');
    wrapper.style.overflow = 'visible';
    div.appendChild(wrapper);

    span = document.createElement('span');
    span.style.marginRight = "35px";
    span.textContent = "Import ABoSpecs form JSON-File:"
    wrapper.appendChild(span);

    button = document.createElement('button');
    button.setAttribute('class', 'settings-button');
    button.addEventListener('click', event => conceptPlugin.uploadConcepts(event));
    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined prevent-select settings-button-icon');
    icon.textContent = "upload";
    button.appendChild(icon);
    wrapper.appendChild(button);


    return div;
  }

  
  #getAnnotationTypeListEnty(conceptName) {
    let tr, td;
    let del;

    let concept = runtime.getConceptForName(conceptName).concept;

    tr = document.createElement('tr');

    td = document.createElement('td');
    tr.appendChild(td);
    td.textContent = "•";
    
    td = document.createElement('td');
    tr.appendChild(td);
    td.textContent = concept.name;

    td = document.createElement('td');
    tr.appendChild(td);
    td.textContent = concept.description;

    td = document.createElement('td');
    tr.appendChild(td);
    // delete symbol    
    del = document.createElement('i');
    del.setAttribute('class', 'material-symbols-outlined material-symbols-hover');
    // del.style.float = "right";
    del.textContent = "delete";
    del.addEventListener("click", event => conceptPlugin.removeConcept(concept.name));
    td.appendChild(del);

    return tr;
  }

  #conceptsList() {
    let wrapper, table, tr, th;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'settings-table-list');
    table = document.createElement('table');
    wrapper.appendChild(table);
    // table heading
    tr = document.createElement('tr');
    table.appendChild(tr);
    // bullet point -> empty
    th = document.createElement('th');
    tr.appendChild(th);
    // annotation type
    th = document.createElement('th');
    tr.appendChild(th);
    th.textContent = "ABoSpec-Name";
    // select
    th = document.createElement('th');
    tr.appendChild(th);
    th.textContent = "Description"
    // overwrite
    th = document.createElement('th');
    tr.appendChild(th);
    th.textContent = "Remove";


    for (let concept of runtime.conceptNames) {
      let tr;
      tr = this.#getAnnotationTypeListEnty(concept);
      table.appendChild(tr);
    }
    return wrapper;
  }

  /**
   * 
   * @param {Event} event 
   * @param {HTMLDivElement} list 
   */
  #conceptChange(event) {
    const list = document.getElementById('app-settings-concept-list');
    if (!list) {
      return;
    }
    // remove old concepts from list
    list.replaceChildren();
    // create new list
    list.appendChild(this.#conceptsList());
  }

  #showConcepts() {
    let div, title, description, wrapper, list;

    div = document.createElement('div');
    div.setAttribute('class', 'entry');

    title = document.createElement('h3');
    title.textContent = "ABoSpecs:";
    div.appendChild(title);

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'settings-entry-wrapper');
    div.appendChild(wrapper);

    description = document.createElement('span');
    description.setAttribute('class', 'description');
    description.textContent = "All currently defined ABoSpecs:";
    wrapper.appendChild(description);

    list = document.createElement('div');
    list.setAttribute('class', 'list-wrapper');
    list.setAttribute('id', 'app-settings-concept-list');
    list.appendChild(this.#conceptsList());
    div.appendChild(list);
    return div;
  }

  #removeAllConcepts() {
    let div, title, wrapper, span, button, icon;

    div = document.createElement('div');
    div.setAttribute('class', 'entry');

    title = document.createElement('h3');
    title.textContent = "Clear ABoSpecs:";
    div.appendChild(title);

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'settings-entry-wrapper');
    wrapper.style.overflow = 'visible';
    div.appendChild(wrapper);

    span = document.createElement('span');
    span.style.marginRight = "35px";
    span.textContent = "Remove all currently defined ABoSpecs:"
    wrapper.appendChild(span);

    button = document.createElement('button');
    button.setAttribute('class', 'settings-button');
    button.addEventListener('click', event => conceptPlugin.removeAllConcepts(event));
    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined prevent-select settings-button-icon');
    icon.textContent = "delete";
    button.appendChild(icon);
    wrapper.appendChild(button);


    return div;
  }
}
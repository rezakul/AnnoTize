class StyleTab extends AbstractSettingsTab {

  constructor () {
    super();
  }

  createContent() {
    let content;
    content = document.createElement('div');
    content.setAttribute('class', 'settings-tab-content');
    content.appendChild(this.#setStyleForImport());
    content.appendChild(this.#setStyleAccordingToCreator());
    content.appendChild(this.#setStyleAccordingToType());
    content.appendChild(this.#setPriority());
    content.appendChild(this.#updateDocument());
    return content;
  }

  #toggleSwitch(changeCallback, checked=false) {
    let label, input, span;
    label = document.createElement('label');
    label.setAttribute('class', 'switch');

    input = document.createElement('input');
    input.setAttribute('type', 'checkbox');
    input.addEventListener('change', changeCallback);
    if (checked) {
      input.checked = true;
    }

    span = document.createElement('span');
    span.setAttribute('class', 'slider round');

    label.appendChild(input);
    label.appendChild(span);
    return label;
  }

  /**
   * Selection menu for the annotation style.
   * @returns {Node} a custom-selection menu
   */
  #styleSelectionMenu(changeCallback, hasLabel=true) {
    let wrapper, label, select, defaultValue;
    let styles;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-style-selection');

    // Tag selection drop-down menu
    if (hasLabel) {
      label = document.createElement('label');
      label.textContent = 'Annotation-Style:';
      label.setAttribute('class', 'annotation-creation-label');
      label.setAttribute('for', this.bodyID + '-annotation-style-selection');
      wrapper.appendChild(label);
    }
    

    styles = [];
    defaultValue = document.createElement('div');
    defaultValue.textContent = 'Default Style';
    defaultValue.setAttribute("value", 'default');
    styles.push(defaultValue);
    Array.from(runtime.annotationStyles.values()).forEach(element => {
      styles.push(element.preview());
    });
    select = CustomSelect.getCustomSelect(styles);
    select.style.width = "250px";
    select.addEventListener('change', changeCallback);

    wrapper.appendChild(select);
    return wrapper;
  }

  #setStyleForImport() {
    let div, title, toggle, description, selection, wrapper1, wrapper2;
    let changeCallback, items;

    div = document.createElement('div');
    div.setAttribute('class', 'entry');

    title = document.createElement('h3');
    title.textContent = "Import:";
    div.appendChild(title);

    wrapper1 = document.createElement('div');
    wrapper1.setAttribute('class', 'settings-entry-wrapper');
    div.appendChild(wrapper1);

    description = document.createElement('span');
    description.setAttribute('class', 'description');
    description.textContent = "Overwrite styles for import:";
    wrapper1.appendChild(description);

    // style selection menu
    wrapper2 = document.createElement('div');
    wrapper2.style.display = settingsPlugin.options.useImportAnnotationStyle ? 'block' : 'none';
    wrapper2.setAttribute('class', 'settings-entry-wrapper');
    wrapper2.style.overflow = "visible";
    div.appendChild(wrapper2);
    // the style selection
    changeCallback = (event) => {
      settingsPlugin.options.importAnnotationStyle = event.target.firstChild.getAttribute('value');
    }
    selection = this.#styleSelectionMenu(changeCallback);
    // set current import style
    CustomSelect.setValueWithoutEvent(selection.lastChild, settingsPlugin.options.importAnnotationStyle);
    // selection.classList.add('selection-item');
    wrapper2.appendChild(selection);
    // callback for user input
    changeCallback = (event) => {
      settingsPlugin.options.useImportAnnotationStyle = event.currentTarget.checked;
      wrapper2.style.display = event.currentTarget.checked ? 'block' : 'none';
    }
    toggle = this.#toggleSwitch(changeCallback, settingsPlugin.options.useImportAnnotationStyle);
    wrapper1.appendChild(toggle);


    return div;
  }

  #getCreatorListEnty(creator) {
    let tr, td, select, checkbox;
    let callback;
    let items;

    tr = document.createElement('tr');

    td = document.createElement('td');
    tr.appendChild(td);
    td.textContent = "•";
    
    td = document.createElement('td');
    tr.appendChild(td);
    td.textContent = creator.id;

    td = document.createElement('td');
    tr.appendChild(td);
    // overwrite checkbox
    checkbox = document.createElement('input');
    // style selection menu
    callback = (event) => {
      let style;
      style = event.target.firstChild.getAttribute('value');
      creator.annotationStyle = style;
      // runtime.changeAnnotationStyleForCreator(creator);
      // disable checkbox on default
      if (style === 'default') {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
        checkbox.disabled = true;
      } else {
        checkbox.disabled = false;
      }
    }
    select = this.#styleSelectionMenu(callback, false);
    CustomSelect.setValueWithoutEvent(select.lastChild, creator.annotationStyle);
    /*
    items = select.getElementsByClassName("select-item-entry");
    for (let item of items) {
      if (item.firstChild.getAttribute('value') === creator.annotationStyle) {
        item.click();
        break;
      }
    }
    */
    select.classList.add('settings-style-select');
    td.appendChild(select);

    td = document.createElement('td');
    tr.appendChild(td);
    // overwrite
    if (creator.annotationStyle === 'default') {
      checkbox.disabled = true;
      creator.annotationStyleOverwritable = true;
    }
    checkbox.setAttribute('type', 'checkbox');
    checkbox.checked = creator.annotationStyleOverwritable;
    // change event
    callback = (event) => {
      creator.annotationStyleOverwritable = event.target.checked;
    }
    checkbox.addEventListener('change', callback);
    td.appendChild(checkbox);

    return tr;
  }

  #getCreatorsList() {
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
    th.textContent = "Creator";
    // select
    th = document.createElement('th');
    tr.appendChild(th);
    th.textContent = "Annotation-Style"
    // overwrite
    th = document.createElement('th');
    tr.appendChild(th);
    th.textContent = "Overwritable";


    for (let creator of settingsPlugin.options.creators.values()) {
      let tr;
      tr = this.#getCreatorListEnty(creator);
      table.appendChild(tr);
    }
    return wrapper;
  }

  #setStyleAccordingToCreator() {
    let div, title, toggle, description, wrapper, list;
    let changeCallback;

    div = document.createElement('div');
    div.setAttribute('class', 'entry');

    title = document.createElement('h3');
    title.textContent = "Creator:";
    div.appendChild(title);

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'settings-entry-wrapper');
    div.appendChild(wrapper);

    description = document.createElement('span');
    description.setAttribute('class', 'description');
    description.textContent = "Set style for creators:";
    wrapper.appendChild(description);
    // creator list
    list = this.#getCreatorsList();
    list.style.display = settingsPlugin.options.useCreatorAnnotationStyle ? 'block' : 'none';
    // callback for user input
    changeCallback = (event) => {
      settingsPlugin.options.useCreatorAnnotationStyle = event.currentTarget.checked;
      list.style.display = event.currentTarget.checked ? 'block' : 'none';
    }
    toggle = this.#toggleSwitch(changeCallback, settingsPlugin.options.useCreatorAnnotationStyle);
    wrapper.appendChild(toggle);

    div.appendChild(list);
    return div;
  }

  #getAnnotationTypeListEnty(conceptName) {
    let tr, td, select, checkbox;
    let callback;

    const concept = runtime.getConceptForName(conceptName);

    tr = document.createElement('tr');

    td = document.createElement('td');
    tr.appendChild(td);
    td.textContent = "•";
    
    td = document.createElement('td');
    tr.appendChild(td);
    td.textContent = conceptName;

    td = document.createElement('td');
    tr.appendChild(td);
    // checkbox - overwrite
    checkbox = document.createElement('input');
    // style selection menu
    callback = (event) => {
      let style;
      style = event.target.firstChild.getAttribute('value');
      concept.style = style;
      if (style === 'default') {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
        checkbox.disabled = true;
      } else {
        checkbox.disabled = false;
      }
      // runtime.changeAnnotationStyleForType(annoType);
    }
    select = this.#styleSelectionMenu(callback, false);
    if (concept.style !== 'default') {
      CustomSelect.setValueWithoutEvent(select.lastChild, concept.style);
    } else {
      checkbox.disabled = true;
    }
  
    select.classList.add('settings-style-select');
    td.appendChild(select);

    td = document.createElement('td');
    tr.appendChild(td);

    checkbox.setAttribute('type', 'checkbox');
    checkbox.checked = concept.styleOverwritable;
    
    // change event
    callback = (event) => {
      concept.styleOverwritable = event.target.checked;
    }
    checkbox.addEventListener('change', callback);
    td.appendChild(checkbox);

    return tr;
  }

  #getAnnotationStyleList() {
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
    th.textContent = "ABoSpec";
    th.style.width = "350px";
    // select
    th = document.createElement('th');
    tr.appendChild(th);
    th.textContent = "Annotation-Style"
    // overwrite
    th = document.createElement('th');
    tr.appendChild(th);
    th.textContent = "Overwritable";


    for (let concept of runtime.conceptNames) {
      let tr;
      tr = this.#getAnnotationTypeListEnty(concept);
      table.appendChild(tr);
    }
    return wrapper;
  }

  #setStyleAccordingToType() {
    let div, title, toggle, description, wrapper, list;
    let changeCallback;

    div = document.createElement('div');
    div.setAttribute('class', 'entry');

    title = document.createElement('h3');
    title.textContent = "Annotation-Type:";
    div.appendChild(title);

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'settings-entry-wrapper');
    div.appendChild(wrapper);

    description = document.createElement('span');
    description.setAttribute('class', 'description');
    description.textContent = "Set style for types:";
    wrapper.appendChild(description);

    list = this.#getAnnotationStyleList();
    list.style.display = settingsPlugin.options.useTypeAnnotationStyle ? 'block' : 'none';
    // callback for user input
    changeCallback = (event) => {
      settingsPlugin.options.useTypeAnnotationStyle = event.currentTarget.checked;
      list.style.display = event.currentTarget.checked ? 'block' : 'none';
    }
    toggle = this.#toggleSwitch(changeCallback, settingsPlugin.options.useTypeAnnotationStyle);
    wrapper.appendChild(toggle);

    div.appendChild(list);
    return div;
  }

  #priorityCreatorEntry(nr) {
    let tr, td, up, down;
    // table element
    tr = document.createElement('tr');
    // priority number
    td = document.createElement('td');
    td.textContent = nr + ".";
    tr.appendChild(td);
    // content
    td = document.createElement('td');
    td.textContent = "Creator";
    tr.appendChild(td);
    // arrow up
    td = document.createElement('td');
    up = document.createElement('i');
    up.setAttribute('class', 'material-symbols-outlined material-symbols-hover prevent-select arrow-up');
    up.style.padding = 0;
    up.textContent = "arrow_upward";
    td.appendChild(up);
    tr.appendChild(td);
    // arrow down
    td = document.createElement('td');
    down = document.createElement('i');
    down.setAttribute('class', 'material-symbols-outlined material-symbols-hover prevent-select arrow-down');
    down.style.padding = 0;
    down.textContent = "arrow_downward";
    td.appendChild(down);
    tr.appendChild(td);
    
    // event change -> set runtime var
    tr.addEventListener('change', (event) => {
      if (event.target.firstChild.textContent === '1.') {
        settingsPlugin.options.creatorPriority = true;
      } else {
        settingsPlugin.options.creatorPriority = false;
      }
    })
    return tr;
  }

  #priorityTypeEntry(nr) {
    let tr, td, up, down;
    // table element
    tr = document.createElement('tr');
    // priority number
    td = document.createElement('td');
    td.textContent = nr + ".";
    tr.appendChild(td);
    // content
    td = document.createElement('td');
    td.textContent = "Annotation-Type";
    tr.appendChild(td);
    // arrow up
    td = document.createElement('td');
    up = document.createElement('i');
    up.setAttribute('class', 'material-symbols-outlined material-symbols-hover prevent-select arrow-up');
    up.style.padding = 0;
    up.textContent = "arrow_upward";
    td.appendChild(up);
    tr.appendChild(td);
    // arrow down
    td = document.createElement('td');
    down = document.createElement('i');
    down.setAttribute('class', 'material-symbols-outlined material-symbols-hover prevent-select arrow-down');
    down.style.padding = 0;
    down.textContent = "arrow_downward";
    td.appendChild(down);
    tr.appendChild(td);
    
    return tr;
  }

  #setPriority() {
    let div, title, table;

    div = document.createElement('div');
    div.setAttribute('class', 'entry');

    title = document.createElement('h3');
    title.textContent = "Set Priority:";
    div.appendChild(title);

    table = document.createElement('table');
    table.setAttribute('class', 'priority-table-list');
    div.appendChild(table);

    if (settingsPlugin.options.creatorPriority) {
      table.appendChild(this.#priorityCreatorEntry(1));
      table.appendChild(this.#priorityTypeEntry(2));
    } else {
      table.appendChild(this.#priorityTypeEntry(1));
      table.appendChild(this.#priorityCreatorEntry(2));
    }

    table.addEventListener('click', (event) => {
      const target = event.target;
      if (target.matches('.arrow-up')) {
        let item, prev, nr;
        item = target.parentNode.parentNode;
        prev = item.previousElementSibling;
        if (prev) {
          nr = item.firstChild.innerHTML;
          item.firstChild.innerHTML = prev.firstChild.innerHTML;
          prev.firstChild.innerHTML = nr;
          table.insertBefore(item, prev);
          item.dispatchEvent(new Event('change'));
          prev.dispatchEvent(new Event('change'));
        }
      } else if (target.matches('.arrow-down')) {
        let item, next, nr;
        item = target.parentNode.parentNode;
        next = item.nextElementSibling;
        if (next) {
          nr = item.firstChild.innerHTML;
          item.firstChild.innerHTML = next.firstChild.innerHTML;
          next.firstChild.innerHTML = nr;
          table.insertBefore(next, item);
          item.dispatchEvent(new Event('change'));
          next.dispatchEvent(new Event('change'));
        }
      }
    });

    return div;
  }

  #updateDocument() {
    let div, title, wrapper, span, button, icon;

    div = document.createElement('div');
    div.setAttribute('class', 'entry');

    title = document.createElement('h3');
    title.textContent = "Update Document:";
    div.appendChild(title);

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'settings-entry-wrapper');
    wrapper.style.overflow = 'visible';
    div.appendChild(wrapper);

    span = document.createElement('span');
    span.style.marginRight = "35px";
    span.textContent = "Update the existing annotations in the document with the defined annotation-styles:"
    wrapper.appendChild(span);

    button = document.createElement('button');
    button.setAttribute('class', 'settings-button');
    button.addEventListener('click', runtime.syncAnnotationStyle);
    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined prevent-select settings-button-icon');
    icon.textContent = "sync";
    button.appendChild(icon);
    wrapper.appendChild(button);


    return div;
  }
}
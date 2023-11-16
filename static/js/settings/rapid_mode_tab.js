class RapidModeTab extends AbstractSettingsTab {
  #conceptTemplates = [];
  #conceptTemplatesShowHeader = [];
  #conceptTemplatesSaveOnCreation = [];
  // temporary array to hold templates
  #temporaryTemplates;

  constructor () {
    super();
    for (let i = 0; i < 5; ++i) {
      this.#conceptTemplates.push(undefined);
      this.#conceptTemplatesSaveOnCreation.push(false);
    }
  }

  /**
   * The 5 concept templates.
   * @returns {Array<Object>}
   */
  get conceptTemplates() {
    return this.#conceptTemplates;
  }

  /**
   * Flag if header should be displayed.
   * @returns {Array<boolean>}
   */
  get conceptTemplatesShowHeader() {
    return this.#conceptTemplatesShowHeader;
  }

  get conceptTemplatesSaveOnCreation() {
    return this.#conceptTemplatesSaveOnCreation;
  }

  createContent() {
    let content;
    content = document.createElement('div');
    content.setAttribute('class', 'settings-tab-content');
    content.appendChild(this.#general());
    content.appendChild(this.#templates());
    content.appendChild(this.#importExportTemplates());
    return content;
  }

  close() {
    if (!this.#temporaryTemplates) {
      return;
    }
    for (let i = 0; i < 5; ++i) {
      const template = this.#temporaryTemplates[i];
      this.conceptTemplates[i] = template.exportAsTemplate();
      this.conceptTemplatesShowHeader[i] = template.showHeader;
      template.remove();
      
      // don't disable first template
      if (i !== 0) {
        if (this.conceptTemplates[i]) {
          runtime.sidebar.enableTemplateNumber(i+1);
        } else {
          runtime.sidebar.disableTemplateNumber(i+1);
        }
      }
    }
    if (ATSettings.useAnnotationTemplate) {
      runtime.sidebar.selectTemplate(1, true);
    }
    this.#temporaryTemplates = undefined;
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

  #removeTrailingWhitespaces() {
    let div, toggle, description;
    let changeCallback;

    div = document.createElement('div');
    div.setAttribute('class', 'settings-entry-wrapper');

    description = document.createElement('span');
    description.setAttribute('class', 'description');
    description.textContent = "Remove trailing whitespaces:";
    div.appendChild(description);
    // callback for user input
    changeCallback = (event) => {
      ATSettings.removeTrailingWhitespaces = event.currentTarget.checked;
    }
    toggle = this.#toggleSwitch(changeCallback, ATSettings.removeTrailingWhitespaces);
    div.appendChild(toggle);

    return div;
  }

  #annotateOnSelection() {
    let div, toggle, description;
    let changeCallback;

    div = document.createElement('div');
    div.setAttribute('class', 'settings-entry-wrapper');

    description = document.createElement('span');
    description.setAttribute('class', 'description');
    description.textContent = "Add annotation immediately (without Popup):";
    div.appendChild(description);
    // callback for user input
    changeCallback = (event) => {
      ATSettings.showAnnotationPopup = !event.currentTarget.checked;
    }
    toggle = this.#toggleSwitch(changeCallback, !ATSettings.showAnnotationPopup);
    div.appendChild(toggle);

    return div;
  }

  #general() {
    let div, title;
  
    div = document.createElement('div');
    div.setAttribute('class', 'entry');
  
    title = document.createElement('h3');
    title.textContent = "General:";
    div.appendChild(title);
  
    div.appendChild(this.#removeTrailingWhitespaces());
    div.appendChild(this.#annotateOnSelection());
  
    return div;
  }

  #replaceTemplateEntry(i, concept, showHeader, autoSave) {
    this.conceptTemplates[i-1] = concept;
    this.#temporaryTemplates[i-1].remove();
    this.#temporaryTemplates[i-1] = new TemplateBody(State.Template, this.conceptTemplates[i-1], showHeader);
    const entry = document.getElementById(this.bodyId + '-template-entry-' + i);
    entry.replaceChildren();
    entry.appendChild(this.#temporaryTemplates[i-1].createElement());
  }

  #createAnnotationTemplates() {
    let wrapper, div, content, footer;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'template-menu');

    div = document.createElement('div');
    div.setAttribute('class', 'settings-template-bar');
    wrapper.appendChild(div);

    content = document.createElement('div');
    content.setAttribute('class', 'settings-template-content');
    wrapper.appendChild(content);

    footer = document.createElement('div');
    footer.setAttribute('class', 'settings-template-footer');
    wrapper.appendChild(footer);

    this.#temporaryTemplates = [];

    for (let i = 1; i < 6; ++i) {
      let button, entry, clear;
      let autosave, toggle, description;
      let changeCallback;

      button = document.createElement('button');
      button.setAttribute('class', 'settings-template-bar-item');
      button.textContent = "Template " + i;
      if (i === 1) {
        button.classList.add('selected');
      }
      div.appendChild(button);
      // tab content
      entry = document.createElement('div');
      entry.setAttribute('class', 'settings-template-entry');
      entry.setAttribute('id', this.bodyId + '-template-entry-' + i);
      if (i !== 1) {
        entry.style.display = 'none';
      }
      // create the template from the concept
      this.#temporaryTemplates[i-1] = new TemplateBody(State.Template, this.conceptTemplates[i-1], this.conceptTemplatesShowHeader[i-1]);
      entry.appendChild(this.#temporaryTemplates[i-1].createElement());
      content.appendChild(entry);

      // autosave template
      autosave = document.createElement('div');
      autosave.setAttribute('class', 'settings-autosave-template');

      description = document.createElement('span');
      description.setAttribute('class', 'description');
      description.textContent = "Autosave:";
      description.style.marginRight = "25px";
      autosave.appendChild(description);
      // callback for user input
      changeCallback = (event) => {
        this.conceptTemplatesSaveOnCreation[i-1] = event.currentTarget.checked;
      }
      toggle = this.#toggleSwitch(changeCallback, this.conceptTemplatesSaveOnCreation[i-1]);
      autosave.appendChild(toggle);

      if (i !== 1) {
        autosave.style.display = 'none';
      }
      footer.appendChild(autosave);

      // clear template
      clear = document.createElement('button');
      clear.setAttribute('class', 'settings-clear-template');
      clear.textContent = 'Clear Template';
      if (i !== 1) {
        clear.style.display = 'none';
      }
      clear.addEventListener('click', event => this.#replaceTemplateEntry(i, undefined, true));
      footer.appendChild(clear);
      // switch tab
      button.addEventListener('click', (event) => {
        const tabs = document.getElementsByClassName('settings-template-entry');
        const buttons = document.getElementsByClassName('settings-template-bar-item');
        const clearButtons = document.getElementsByClassName('settings-clear-template');
        const autoSaveSwitchs = document.getElementsByClassName('settings-autosave-template');

        for (let tab of tabs) {
          tab.style.display = 'none';
        }
        entry.style.display = 'block';
        for (let but of buttons) {
          but.classList.remove('selected');
        }
        event.target.classList.add('selected');
        for (let cl of clearButtons) {
          cl.style.display = 'none';
        }
        clear.style.display = 'block';
        for (let autoSwitch of autoSaveSwitchs) {
          autoSwitch.style.display = 'none';
        }
        autosave.style.display = 'block';
      });
    }
    return wrapper;
  }

  #useTemplate() {
    let wrapper, div, toggle, description, template, ieTemps;
    let changeCallback;

    div = document.createElement('div');
    div.setAttribute('class', 'settings-entry-wrapper');

    wrapper =  document.createElement('div');
    wrapper.appendChild(div);

    description = document.createElement('span');
    description.setAttribute('class', 'description');
    description.textContent = "Use an annotation template:";
    div.appendChild(description);

    template = this.#createAnnotationTemplates();
    
    // callback for user input
    changeCallback = (event) => {
      if (event.currentTarget.checked) {
        ATSettings.currentTemplateNumber = 0;
      } else {
        ATSettings.currentTemplateNumber = null;
      }
      template.style.display = event.currentTarget.checked ? 'block' : 'none';
      if (event.currentTarget.checked) {
        runtime.sidebar.showTemplateMenu();
      } else {
        runtime.sidebar.hideTemplateMenu();
      }
      
    }
    toggle = this.#toggleSwitch(changeCallback, ATSettings.useAnnotationTemplate);
    div.appendChild(toggle);
    
    // template
    template.style.display = ATSettings.useAnnotationTemplate ? 'block' : 'none';
    wrapper.appendChild(template);

    return wrapper;
  }

  #refreshLastAnnotationOnCLick() {
    let div, toggle, description;
    let changeCallback;

    div = document.createElement('div');
    div.setAttribute('class', 'settings-entry-wrapper');

    description = document.createElement('span');
    description.setAttribute('class', 'description');
    description.textContent = "Update last interacted annotation (for auto-reference) with click-on-element:";
    div.appendChild(description);
    // callback for user input
    changeCallback = (event) => {
      ATSettings.updateInteractedAnnotationsWithClick = event.currentTarget.checked;
    }
    toggle = this.#toggleSwitch(changeCallback, ATSettings.updateInteractedAnnotationsWithClick);
    div.appendChild(toggle);

    return div;
  }

  #templates() {
    let div, title;
  
    div = document.createElement('div');
    div.setAttribute('class', 'entry');
  
    title = document.createElement('h3');
    title.textContent = "Templates:";
    div.appendChild(title);
  
    div.appendChild(this.#useTemplate());
    div.appendChild(this.#refreshLastAnnotationOnCLick());
  
    return div;
  }

  #importExportTemplates() {
    let wrapper, heading, importTemplate, exportTemplate, icon, span;
    let thisElem, callback;
    thisElem = this;

    // wrapper for import export buttons
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'entry');
    wrapper.style.overflow = "auto";
    // heading
    heading = document.createElement('h3');
    heading.textContent = "Save/Restore Templates";
    wrapper.appendChild(heading);
    // import wrapper
    importTemplate = document.createElement('div');
    importTemplate.setAttribute('class', 'app-settings-template-import');
    callback = (event) => {
      thisElem.#uploadTemplates(event);
    }
    importTemplate.addEventListener("click", callback);
    wrapper.appendChild(importTemplate);
    // import button icon
    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined');
    icon.textContent = "upload";
    // description
    span = document.createElement('span');
    span.setAttribute('class', 'text-element');
    span.textContent = "Import Templates";
    // append to wrapper
    importTemplate.appendChild(icon);
    importTemplate.appendChild(span);

    exportTemplate = document.createElement('div');
    exportTemplate.setAttribute('class', 'app-settings-template-export');
    callback = (event) => {
      thisElem.#downloadTemplates(event);
    }
    exportTemplate.addEventListener("click", callback);
    wrapper.appendChild(exportTemplate);
    // import button icon
    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined');
    icon.textContent = "download";
    // description
    span = document.createElement('span');
    span.setAttribute('class', 'text-element');
    span.textContent = "Export Templates";
    // append to wrapper
    exportTemplate.appendChild(icon);
    exportTemplate.appendChild(span);

    return wrapper;
  }

  #addTemplateFromJson(element) {
    const i = element.templateNumber - 1;
    if (i >= this.conceptTemplates.length || i < 0) {
      console.warn('Template number to big: ' + element.templateNumber);
      return false;
    }
    // restore autosave
    this.conceptTemplatesSaveOnCreation[i] = element.autosave;
    // restore template
    this.#replaceTemplateEntry(element.templateNumber, element, element.showHeader);
  }

  #fileReaderEvent(event) {
    let result, jsonObj;

    try {
      result = event.target.result;
      jsonObj = JSON.parse(result);
      if (!Array.isArray(jsonObj)) {
        console.error('JSON file has wrong format (should be an array');
        return;
      }
    } catch (err) {
      // TODO: show ui warning to user
      console.error(err);
      return;
    }
    for (let element of jsonObj) {
      switch (element.type) {
        case "template":
          this.#addTemplateFromJson(element);
          break;
        default:
          // ignore rest
      }
    }
    // refresh settings
    runtime.settings.refresh();
  }

  #handleFileUpload(evt) {
    try {
        let files = evt.target.files;
        if (!files.length) {
          console.warn('No file selected!');
            return;
        }
        let file = files[0];
        let reader = new FileReader();
        reader.onload = event => this.#fileReaderEvent(event);
        reader.readAsText(file);
    } catch (err) {
        console.error(err);
    }
  }

  #exportJSON() {
    let result = [];
    for (let i = 0; i < 5; ++i) {
      let json;
      // save current status
      const template = this.#temporaryTemplates[i];
      this.conceptTemplates[i] = template.exportAsTemplate();
      this.conceptTemplatesShowHeader[i] = template.showHeader;
      if (!this.conceptTemplates[i]) {
        continue;
      }

      json = this.conceptTemplates[i];
      json.type = "template";
      json.templateNumber = i + 1;
      json.autosave = this.conceptTemplatesSaveOnCreation[i];
      json.showHeader = this.conceptTemplatesShowHeader[i];
      result.push(json);
    }
    return result;
  }

  #uploadTemplates() {
    let uploadAnchorNode;

    uploadAnchorNode = document.createElement('input');
    uploadAnchorNode.setAttribute("type", "file");
    uploadAnchorNode.setAttribute("accept", "application/json, application/ld+json");
    // add to html - required for firefox
    // document.body.appendChild(uploadAnchorNode); 
    uploadAnchorNode.addEventListener('change', event => this.#handleFileUpload(event));
    uploadAnchorNode.click();
    // uploadAnchorNode.remove();
  }

  #downloadTemplates() {
    let jsonTemplates;
    let dataStr, downloadAnchorNode;
    // create export values
    let array;
    array = this.#exportJSON();
    // export to json
    jsonTemplates = JSON.stringify(array, null, " ");
    // create download
    dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonTemplates);
    downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "templates.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
}
/**
 * The template for the grounding body
 * @extends {AbstractTemplateBody} extends the abstract template structure. 
 */
class SimpleTagBodyTemplate extends AbstractTemplateBody {
  #tagSet;
  #tag;

  /**
   * Creates a SimpleTagBody with a given tag.
   * @param {State} state the state of the annotation
   * @param {string} tagSet (optional) the tagSet
   * @param {string} tag (optional) the tag
   */
  constructor(tagSet, tag) {
    super();
    this.#tagSet = tagSet;
    this.#tag = tag;
  }

  get displayName() {
    return "SimpleTagBody";
  }

  get tag() {
    return this.#tag;
  }

  toJSON(key) {
    let json = {};

    json.type = "SimpleTagBody";
    if (this.#tag) {
      json.tag = this.#tag;
    } else if (this.#tagSet) {
      json.tagSet = this.#tagSet;
    }
    
    return json;
  }

  #changeTagSetSelection(event) {
    let selection, button;
    // enable Tag selection and initialize with Tags
    selection = document.getElementById(event.target.dataset.customId + '-annotation-tag-selection');
    selection.disabled = false;
    selection.replaceChildren();
    selection.click();
    // enable "add new Tag" button
    button = document.getElementById(event.target.dataset.customId + '-create-new-tag');
    button.disabled = false;
  }

  #dynamicallyCreateTagSetSelectionContent(event) {
    let val;
    // get current selected value
    val = event.target.value;
    // remove all content from select
    event.target.replaceChildren();
    // add default value if nothing selected yet
    if (val === '') {
      let description;
      description = document.createElement('option');
      description.setAttribute('value', "");
      description.selected = true;
      description.disabled = true;
      description.hidden = true;
      description.textContent = "Choose TagSet";
      event.target.appendChild(description);
    }
    // add all registerd TagSets to select
    for (let tagSet of runtime.getPlugin("SimpleTagBody").tagSets.values()) {
      let group, option;
      // use group to show id
      group = document.createElement('optgroup');
      group.setAttribute('label', tagSet.id);
      event.target.appendChild(group);
      option = document.createElement('option');
      option.setAttribute('value', tagSet.id);
      option.textContent = tagSet.label;
      if (val === tagSet.id) {
        option.selected = true;
      }
      group.appendChild(option);
    }
  }

  #dynamicallyCreateTagSelectionContent(event) {
    let val, tagSetId, tagSet;
    // get TagSet id and current Tag id
    tagSetId = document.getElementById(event.target.dataset.customId + '-annotation-tagset-selection').value;
    val = event.target.value;
    // remove content from select
    event.target.replaceChildren();
    // add default value if nothing selected yet
    if (val === '') {
      let description;
      description = document.createElement('option');
      description.setAttribute('value', "");
      description.selected = true;
      description.disabled = true;
      description.hidden = true;
      description.textContent = "Choose Tag";
      event.target.appendChild(description);
    }
    // tagSetSelection should have a valid tag otherwise element is disabled
    if (tagSetId === '' || !runtime.getPlugin("SimpleTagBody").tagSets.has(tagSetId)) {
      return;
    }
    // add Tags of TagSet to select
    tagSet = runtime.getPlugin("SimpleTagBody").tagSets.get(tagSetId);
    for (let tag of tagSet.tags) {
      let group, option;
      // use group to show id
      group = document.createElement('optgroup');
      group.setAttribute('label', tag.id);
      event.target.appendChild(group);
      option = document.createElement('option');
      option.setAttribute('value', tag.id);
      option.textContent = tag.label;
      if (val === tag.id) {
        option.selected = true;
      }
      group.appendChild(option);
    }
  }

  #newTagSetButtonEvent(event) {
    let callback, customId;

    // callback function that will be executed if new TagSet was created
    customId = event.currentTarget.dataset.customId;
    callback = (tagSet) => {
      let select, changeEvent;
      // set value for TagSet selection
      select = document.getElementById(customId + '-annotation-tagset-selection');
      // update content in select to add new TagSet
      select.click();
      // set new TagSet as value
      select.value = tagSet.id;
      // signal change
      changeEvent = new Event("change");
      select.dispatchEvent(changeEvent);
      // close the user menu
      runtime.closeMenu();
    }
    // open user menu
    runtime.openUserMenuCreateNewTagSet(callback);
  }

  #newTagSetButton() {
    let wrapper, button, icon, label;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-menu-selection');

    button = document.createElement('button');
    button.setAttribute('id', this.bodyID + "-create-new-tagset");
    button.setAttribute('class', 'annotation-menu-selection-button');
    button.dataset.customId = this.bodyID;

    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined');
    icon.textContent = "add";
    icon.style.padding = "0px";
    button.appendChild(icon);
    // click event -> create new tag set
    button.addEventListener('click', this.#newTagSetButtonEvent);

    label = document.createElement('label');
    label.setAttribute('for', this.bodyID + "-create-new-tagset");
    label.textContent = "Create a new TagSet:";
    label.style.marginRight = "10px";
    
    wrapper.appendChild(label);
    wrapper.appendChild(button);
    return wrapper;
  }

  #newTagButtonEvent(event) {
    let callback, customId, tagSetId;

    // callback function that will be executed if new TagSet was created
    customId = event.currentTarget.dataset.customId;
    tagSetId = document.getElementById(customId + '-annotation-tagset-selection').value;

    callback = (tag) => {
      let select;
      // set value for TagSet selection
      select = document.getElementById(customId + '-annotation-tag-selection');
      // update content in select to add new TagSet
      select.click();
      // set new TagSet as value
      select.value = tag.id;
      // signal change
      select.dispatchEvent(new Event("change"));
      // close the user menu
      runtime.closeMenu();
    }
    // open user menu
    runtime.openUserMenuCreateNewTag(tagSetId, callback);
  }

  #newTagButton() {
    let wrapper, button, icon, label;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-menu-selection');

    button = document.createElement('button');
    button.setAttribute('id', this.bodyID + "-create-new-tag");
    button.setAttribute('class', 'annotation-menu-selection-button');
    button.dataset.customId = this.bodyID;
    if (!this.#tagSet) {
      button.disabled = true;
    }    

    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined');
    icon.textContent = "add";
    icon.style.padding = "0px";
    button.appendChild(icon);
    // click event -> create new tag for TagSet
    button.addEventListener('click', this.#newTagButtonEvent);

    label = document.createElement('label');
    label.setAttribute('for', this.bodyID + "-create-new-tag");
    label.textContent = "Create a new Tag:";
    label.style.marginRight = "10px";
    
    wrapper.appendChild(label);
    wrapper.appendChild(button);
    return wrapper;
  }

  #tagSetSelection() {
    let wrapper, select, label;

    wrapper = document.createElement('div');

    // TagSet selection drop-down menu
    label = document.createElement('label');
    label.textContent = 'TagSet-ID:';
    label.setAttribute('class', 'annotation-creation-label');
    label.setAttribute('for', this.bodyID + '-annotation-tagset-selection');
    wrapper.appendChild(label);

    select = document.createElement('select');
    select.setAttribute('id', this.bodyID + '-annotation-tagset-selection');
    select.setAttribute('class', 'annotation-sidebar-select');
    select.required = true;
    select.style.marginBottom = "15px";
    select.dataset.customId = this.bodyID;
    select.addEventListener("click", this.#dynamicallyCreateTagSetSelectionContent);
    select.addEventListener("change", this.#changeTagSetSelection);
    
    wrapper.appendChild(select);
    select.click();
    
    if (this.#tagSet) {
      for (let option of select.options) {
        if (option.value === this.#tagSet) {
          option.selected = true;
        }
      }
    }
    return wrapper;
  }

  #tagSelection() {
    let wrapper, select, label;

    wrapper = document.createElement('div');
    
    // Tag selection drop-down menu
    label = document.createElement('label');
    label.textContent = 'Tag-ID:';
    label.setAttribute('class', 'annotation-creation-label');
    label.setAttribute('for', this.bodyID + '-annotation-tag-selection');
    wrapper.appendChild(label);

    select = document.createElement('select');
    select.setAttribute('id', this.bodyID + '-annotation-tag-selection');
    select.setAttribute('class', 'annotation-sidebar-select');
    select.required = true;
    select.style.marginBottom = "15px";
    select.dataset.customId = this.bodyID;
    select.addEventListener("click", this.#dynamicallyCreateTagSelectionContent);
    wrapper.appendChild(select);
    
    if (!this.#tag) {
      let description;
      description = document.createElement('option');
      description.setAttribute('value', "");
      description.selected = true;
      description.disabled = true;
      description.hidden = true;
      description.textContent = "Choose Tag";
      select.appendChild(description);
    }
    // add Tags of TagSet to select
    if (this.#tagSet) {
      const tagSet = runtime.getPlugin('SimpleTagBody').getTagSetForId(this.#tagSet);
      for (let tag of tagSet.tags) {
        let group, option;
        // use group to show id
        group = document.createElement('optgroup');
        group.setAttribute('label', tag.id);
        select.appendChild(group);
        option = document.createElement('option');
        option.setAttribute('value', tag.id);
        option.textContent = tag.label;
        if (this.#tag === tag.id) {
          option.selected = true;
        }
        group.appendChild(option);
      }
    } else {
      select.disabled = true;
    }
  
    return wrapper;
  }

  #tagSetMenu() {
    let wrapper;

    wrapper = document.createElement('div');
    
    wrapper.appendChild(this.#tagSetSelection());
    wrapper.appendChild(this.#newTagSetButton());
    return wrapper;
  }

  #tagMenu() {
    let wrapper;

    wrapper = document.createElement('div');
    
    wrapper.appendChild(this.#tagSelection());
    wrapper.appendChild(this.#newTagButton());
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
    p.textContent = "Annotation-Tag:";
    p.style.fontWeight = "bold";
    wrapper.appendChild(p);

    wrapper.appendChild(this.#tagSetMenu());
    wrapper.appendChild(this.#tagMenu());
    
    return wrapper;
  }

  save() {
    this.#tagSet = document.getElementById(this.bodyID + '-annotation-tagset-selection').value;
    this.#tag = document.getElementById(this.bodyID + '-annotation-tag-selection').value;
  }

  getAnnotationFromTemplate(state) {
    let body;
    if (this.#tag) {
      const tag = runtime.getPlugin('SimpleTagBody').getTagForId(this.#tag);
      body = new SimpleTagBody(state, tag);
    } else if (this.#tagSet) {
      const tagSet = runtime.getPlugin('SimpleTagBody').getTagSetForId(this.#tagSet);
      body = new SimpleTagBody(state, null, tagSet);
    } else {
      body = new SimpleTagBody(state, null, null);
    }
    return body;
  }
}
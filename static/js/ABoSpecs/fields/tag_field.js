/**
 * A tag input field.
 * @extends {FieldTemplate} implements a field in the body.
 */
class TagField extends FieldTemplate {
  #tagId;
  #tagSetId;
  #tagSetFixed;

  #colorChangeCallback;
  #tagButton;

  /**
   * Creates a number input fragment.
   * 
   * @param {string} tagId the tagId (default None)
   * @param {string} tagSetId the tagSetId (default None)
   * @param {boolean} tagSetFixed if the tagSet is fiexed (default: false)
   */
  constructor(field, name, number=-1, defaultValue) {
    super(field, name, number, false);
    if (defaultValue) {
      this.#tagId = defaultValue.tag;
      this.#tagSetId = defaultValue.tagSet;
      this.#tagSetFixed = defaultValue.fixed;
    } else {
      this.#tagId = "";
      this.#tagSetId = "";
      this.#tagSetFixed = false;
    }
    if (this.#tagId && !tagSetPlugin.hasTagForId(this.#tagId)) {
      // create a new Tag with the id and no Tag-Set
      tagSetPlugin.createTagForUndefinedTagSet(this.#tagId);
    }
    if (this.#tagSetId && !tagSetPlugin.hasTagSetForId(this.#tagSetId)) {
      console.warn('Unknown TagSet-Id: ', this.#tagSetId);
      this.#tagSetId = undefined;
    }
    if (this.#tagId) {
      let tag = tagSetPlugin.getTagForId(this.#tagId);
      if (this.#tagSetId && this.#tagSetId !== tag.tagSet.id) {
        console.warn('TagSet-Id (' + this.#tagSetId + ') does not match the given Tag-Id (' + this.#tagId +')');
      } else {
        this.#tagSetId = tag.tagSet.id;
      }
    }
    if (this.#tagSetFixed && !this.#tagSetId) {
      console.warn("Parameter 'fixed' will be ignored because no TagSet is defined");
      this.#tagSetFixed = false;
    }
    this.#colorChangeCallback = event => this.#colorChangeEvent(event);
  }

  /**
   * The Tag belonigng to the Tag-ID
   * @returns {Tag}
   */
  get tag() {
    if (this.hasTag()) {
      return tagSetPlugin.getTagForId(this.#tagId);
    }
    return null;
  }

  hasTag() {
    return this.#tagId !== "" && tagSetPlugin.hasTagForId(this.#tagId);
  }

  /**
   * Get the highlight color for this element.
   * @returns {String} css color
   */
  get color() {
    if (this.hasTag()) {
      return this.tag.color;
    }
    return null
  }

  /**
   * Get the visibility of the tag.
   * @returns {boolean} if the element should be visible to the user
   */
  get visibility() {
    if (this.hasTag()) {
      return this.tag.visibility;
    }
    return true;
  }

  toJSON(key) {   
    return this.#tagId;
  }

  exportAsTemplate() {
    let json = {};
    
    json.type = "tag";
    json.name = this.name;

    return json;
  }

  exportCurrentValue() {
    let result = {};

    result.fixed = this.#tagSetFixed;
    const input1 = document.getElementById(this.uniqueFragmentId + "-annotation-tagset-selection");
    if (input1 && input1.value) {
      result.tagSet = input1.value;
    }
    const input2 = document.getElementById(this.uniqueFragmentId + "-annotation-tag-selection");
    if (input2 && input2.value) {
      result.tag = input2.value;
    }
    return result;
  }

  initializeValue(value) {
    this.#tagId = value;
    if (!tagSetPlugin.hasTagForId(this.#tagId)) {
      // create a new Tag with the id and no Tag-Set
      tagSetPlugin.createTagForUndefinedTagSet(this.#tagId);
    }
    this.#tagSetId = this.tag.tagSet.id;
    // listen to color changes
    this.tag.emitter.addEventListener('change', this.#colorChangeCallback);
  }

  #colorChangeEvent(event) {
    let luminance;
    if (!this.#tagButton) {
      return;
    }
    // update color
    this.#tagButton.style.backgroundColor = event.detail.color;
    luminance = computeLuminance(event.detail.color);
    if (luminance > 0.179) {
      this.#tagButton.style.color = '#000000';
    } else {
      this.#tagButton.style.color = '#ffffff';
    }
    this.body.annotationObject.updateColor(event.detail.color, event.detail.distributor);
  }

  /**
   * Input event handler for the input
   */
  #inputChange(event) {
    this.validState = event.target.matches(".tag-selection") && event.target.value !== "";
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
    for (let tagSet of tagSetPlugin.tagSets.values()) {
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
    if (tagSetId === '' || !tagSetPlugin.tagSets.has(tagSetId)) {
      return;
    }
    // add Tags of TagSet to select
    tagSet = tagSetPlugin.tagSets.get(tagSetId);
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
    }
    runtime.settings.quickTagSetCreation(callback);
  }

  #newTagSetButton() {
    let wrapper, button, icon, label;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-menu-selection');

    button = document.createElement('button');
    button.setAttribute('id', this.uniqueFragmentId + "-create-new-tagset");
    button.setAttribute('class', 'annotation-menu-selection-button');
    button.dataset.customId = this.uniqueFragmentId;

    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined');
    icon.textContent = "add";
    icon.style.padding = "0px";
    button.appendChild(icon);
    // click event -> create new tag set
    button.addEventListener('click', this.#newTagSetButtonEvent);

    label = document.createElement('label');
    label.setAttribute('for', this.uniqueFragmentId + "-create-new-tagset");
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
    }
    // open user menu
    const tagSet = tagSetPlugin.getTagSetForId(tagSetId);
    runtime.settings.quickTagCreation(tagSet, callback);
  }

  #newTagButton() {
    let wrapper, button, icon, label;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-menu-selection');

    button = document.createElement('button');
    button.setAttribute('id', this.uniqueFragmentId + "-create-new-tag");
    button.setAttribute('class', 'annotation-menu-selection-button');
    button.dataset.customId = this.uniqueFragmentId;
    if (!this.#tagSetId) {
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
    label.setAttribute('for', this.uniqueFragmentId + "-create-new-tag");
    label.textContent = "Create a new Tag:";
    label.style.marginRight = "10px";
    
    wrapper.appendChild(label);
    wrapper.appendChild(button);
    return wrapper;
  }

  #tagSetSelection(state) {
    let wrapper, select, label;

    wrapper = document.createElement('div');

    // TagSet selection drop-down menu
    label = document.createElement('label');
    if (this.number !== -1) {
      label.textContent = 'TagSet-ID [' + this.number + ']:';
    } else {
      label.textContent = 'TagSet-ID:';
    }
    label.setAttribute('class', 'annotation-creation-label');
    label.setAttribute('for', this.uniqueFragmentId + '-annotation-tagset-selection');
    wrapper.appendChild(label);

    select = document.createElement('select');
    select.setAttribute('id', this.uniqueFragmentId + '-annotation-tagset-selection');
    select.setAttribute('class', 'annotation-sidebar-select');
    select.required = true;
    select.style.marginBottom = "15px";
    select.dataset.customId = this.uniqueFragmentId;
    select.addEventListener("click", this.#dynamicallyCreateTagSetSelectionContent);
    select.addEventListener("change", this.#changeTagSetSelection);
    select.addEventListener("change", event => this.#inputChange(event));
    
    wrapper.appendChild(select);
    select.click();
    
    if (this.#tagSetId) {
      for (let option of select.options) {
        if (option.value === this.#tagSetId) {
          option.selected = true;
        }
      }
    }
    select.disabled = this.#tagSetFixed && state !== State.Template; 

    return wrapper;
  }

  #tagSelection() {
    let wrapper, select, label;

    wrapper = document.createElement('div');
    
    // Tag selection drop-down menu
    label = document.createElement('label');
    if (this.number !== -1) {
      label.textContent = 'Tag-ID [' + this.number + ']:';
    } else {
      label.textContent = 'Tag-ID:';
    }
    label.setAttribute('class', 'annotation-creation-label');
    label.setAttribute('for', this.uniqueFragmentId + '-annotation-tag-selection');
    wrapper.appendChild(label);

    select = document.createElement('select');
    select.setAttribute('id', this.uniqueFragmentId + '-annotation-tag-selection');
    select.setAttribute('class', 'annotation-sidebar-select tag-selection');
    select.required = true;
    select.style.marginBottom = "15px";
    select.dataset.customId = this.uniqueFragmentId;
    select.addEventListener("click", this.#dynamicallyCreateTagSelectionContent);
    select.addEventListener("change", event => this.#inputChange(event));
    wrapper.appendChild(select);
    
    
    if (!this.#tagId) {
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
    if (this.#tagSetId) {
      const tagSet = tagSetPlugin.getTagSetForId(this.#tagSetId);
      for (let tag of tagSet.tags) {
        let group, option;
        // use group to show id
        group = document.createElement('optgroup');
        group.setAttribute('label', tag.id);
        select.appendChild(group);
        option = document.createElement('option');
        option.setAttribute('value', tag.id);
        option.textContent = tag.label;
        if (this.#tagId === tag.id) {
          option.selected = true;
        }
        group.appendChild(option);
      }
      // signal change that may have occurred
      select.dispatchEvent(new Event('change'));
    } else {
      select.disabled = true;
    }
  
    return wrapper;
  }

  #tagSetMenu(state) {
    let wrapper;
    
    wrapper = document.createElement('div');
    if (state == State.Template) {
      wrapper.appendChild(this.#templateFixTagsSet());
    }
    wrapper.appendChild(this.#tagSetSelection(state));
    if (!this.#tagSetFixed || state == State.Template) {
      wrapper.appendChild(this.#newTagSetButton());
    }
    return wrapper;
  }

  #tagMenu() {
    let wrapper;

    wrapper = document.createElement('div');
    
    wrapper.appendChild(this.#tagSelection());
    wrapper.appendChild(this.#newTagButton());
    return wrapper;
  }

  #createNewTagSelection(state) {
    let wrapper;

    wrapper = document.createElement('div');
    wrapper.appendChild(this.#tagSetMenu(state));
    wrapper.appendChild(this.#tagMenu());
  
    return wrapper;
  }

  #displayBodyTag() {
    let wrapper, tagWrapper, label, button;
    wrapper = document.createElement('div');
    
    label = document.createElement('label');
    label.setAttribute('for', this.uniqueFragmentId + '-annotation-tag');
    label.setAttribute('class', 'annotation-display-label');
    if (this.number !== -1) {
      label.textContent = this.name + ' [' + this.number + ']:';
    } else {
      label.textContent = this.name + ':';
    }

    tagWrapper = document.createElement('div');
    tagWrapper.style.overflow = "auto";
    tagWrapper.style.padding = "5px";
    button = this.tag.renderTag();
    button.setAttribute('id', this.uniqueFragmentId + '-annotation-tag');
    button.style.float = "right";
    tagWrapper.append(button);
    // save button for color change event
    this.#tagButton = button;
    
    wrapper.appendChild(label);
    wrapper.appendChild(tagWrapper);

    return wrapper;
  }

  #templateFixTagsSetEvent(event) {
    this.#tagSetFixed = event.target.checked;
  }

  #templateFixTagsSet() {
    let wrapper, label, checkbox;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-template-advanced');

    label = document.createElement('label');
    if (this.number !== -1) {
      label.textContent = "Fix TagSet [" + this.number + "]:";
    } else {
      label.textContent = "Fix TagSet:";
    }
    label.setAttribute('class', 'annotation-creation-label');
    wrapper.appendChild(label);
    
    checkbox = document.createElement('input');
    checkbox.setAttribute('id', this.bodyID + '-show-header');
    checkbox.setAttribute('type', 'checkbox');
    checkbox.dataset.customId = this.bodyID;
    label.appendChild(checkbox);

    checkbox.addEventListener('change', event => this.#templateFixTagsSetEvent(event));
    checkbox.checked = this.#tagSetFixed;

    return wrapper;
  }

  content(state) {
    let wrapper;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-template-fragment');

    if (state === State.Display) {
      wrapper.appendChild(this.#displayBodyTag());
    } else {
      wrapper.appendChild(this.#createNewTagSelection(state));
    }

    return wrapper;
  }

  save() {
    let tagSet, tag, oldTag;
    tagSet = document.getElementById(this.uniqueFragmentId + "-annotation-tagset-selection");
    tag = document.getElementById(this.uniqueFragmentId + "-annotation-tag-selection");
    // save ald tag id
    oldTag = this.#tagId;
    this.#tagSetId = tagSet.value;
    this.#tagId = tag.value;
    // siganal color change if tag changed
    if (this.#tagId !== oldTag) {
      this.body.annotationObject.updateColor(this.color, null);
    }
    // listen to color changes
    this.tag.emitter.addEventListener('change', this.#colorChangeCallback);
  }

  edit() {
    this.tag.emitter.removeEventListener('change', this.#colorChangeCallback);
    // nothing to do
  }

  cancel() {
    this.tag.emitter.addEventListener('change', this.#colorChangeCallback);
    // nothing to do
  }

  remove() {
    if (this.tag) {
      this.tag.emitter.removeEventListener('change', this.#colorChangeCallback);
    }
  }

  focus() {
    let tagSet, tag;
    tagSet = document.getElementById(this.uniqueFragmentId + "-annotation-tagset-selection");
    if (tagSet.value === "") {
      tagSet.focus();
      return;
    }
    tag = document.getElementById(this.uniqueFragmentId + "-annotation-tag-selection");
    tag.focus();
  }

  copy() {
    // TODO
  }
}
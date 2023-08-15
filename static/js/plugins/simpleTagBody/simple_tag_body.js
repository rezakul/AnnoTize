/**
 * A simple tag body containing one tag value. 
 * @extends {AnnotationBody} extends the abstract AnnotationBody class. 
 */
class SimpleTagBody extends AnnotationBody {
  #tag;
  #tagSet;

  /**
   * Creates a SimpleTagBody with a given tag.
   * @param {State} state the state of the annotation
   * @param {Tag} tag the tag
   * @param {tagSet} tagSet the tag set
   */
  constructor(state, tag=null, tagSet=null) {
    super(state);
    this.#tag = tag;
    this.#tagSet = tagSet;
  }

  /**
   * The tag value.
   * @returns {Tag}
   */
  get tag() {
    return this.#tag;
  }

  set tag(tag) {
    this.#tag = tag;
  }

  /**
   * Get the highlight color for this element.
   * @returns {String} css color
   */
  get color() {
    if (this.state === State.Edit) {
      return AnnotationColors.HIGHLIGHT;
    }
    return this.tag.color;
  }

  /**
   * Get the visibility of the tag.
   * @returns {boolean} if the element should be visible to the user
   */
  get visibility() {
    if (this.state === State.Edit) {
      return true;
    }
    return this.tag.visibility;
  }

  toJSON(key) {
    let json = {};

    json.type = "SimpleTagBody";
    json.val = this.tag.id;
    
    return json;
  }

  getHighlightClass() {
    // TODO
    return this.tag.tagSet.id + " " + this.tag.id;
  }

  updateColor() {
    let button;
    let luminance;
    // get button
    button = document.getElementById(this.bodyID + '-annotation-tag');
    // update color
    button.style.backgroundColor = this.tag.color;
    luminance = computeLuminance(this.tag.color);
    if (luminance > 0.179) {
      button.style.color = '#000000';
    } else {
      button.style.color = '#ffffff';
    }
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

  #changeTagSelection(event) {
    // TODO: nothing to do?
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
    button.disabled = true;

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

  #tagSetSelection(signalInvalid) {
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
    select.addEventListener("change", signalInvalid);
    
    wrapper.appendChild(select);
    select.click();
    return wrapper;
  }

  #tagSelection(signalValid) {
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
    select.addEventListener("change", this.#changeTagSelection);
    select.addEventListener("change", signalValid);
    wrapper.appendChild(select);
    
    // add default value if nothing selected yet
    let description;
    description = document.createElement('option');
    description.setAttribute('value', "");
    description.selected = true;
    description.disabled = true;
    description.hidden = true;
    description.textContent = "Choose Tag";
    select.appendChild(description);
    // disable select 
    select.disabled = true;
  
    return wrapper;
  }

  #tagSetMenu(signalInvalid) {
    let wrapper;

    wrapper = document.createElement('div');
    
    wrapper.appendChild(this.#tagSetSelection(signalInvalid));
    wrapper.appendChild(this.#newTagSetButton());
    return wrapper;
  }

  #tagMenu(signalValid) {
    let wrapper;

    wrapper = document.createElement('div');
    
    wrapper.appendChild(this.#tagSelection(signalValid));
    wrapper.appendChild(this.#newTagButton());
    return wrapper;
  }

  #createNewTagSelection(signalValid, signalInvalid) {
    let wrapper;

    wrapper = document.createElement('div');
    wrapper.appendChild(this.#tagSetMenu(signalInvalid));
    wrapper.appendChild(this.#tagMenu(signalValid));
  
    return wrapper;
  }

  #setupTagSelection(element) {
    let select, button;
    let id, tagSet;
    // set value for TagSet selection
    id = this.bodyID + '-annotation-tagset-selection';
    id = id.replaceAll('-', '\\-');
    select = element.querySelector("#" + id);
    // set new TagSet as value
    tagSet = this.tag ? this.tag.tagSet : this.#tagSet;
    select.value = tagSet.id;

    // set value for Tag selection
    id = this.bodyID + '-annotation-tag-selection';
    id = id.replaceAll('-', '\\-');
    select = element.querySelector("#" + id);
    select.disabled = false;
    select.replaceChildren();
    // default text if no Tag
    if (!this.tag) {
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
    for (let tag of tagSet.tags) {
      let group, option;
      // use group to show id
      group = document.createElement('optgroup');
      group.setAttribute('label', tag.id);
      select.appendChild(group);
      option = document.createElement('option');
      option.setAttribute('value', tag.id);
      option.textContent = tag.label;
      if (this.tag && tag.id === this.tag.id) {
        option.selected = true;
      }
      group.appendChild(option);
    }
    // enable "add new Tag" button
    id = this.bodyID + '-create-new-tag';
    id = id.replaceAll('-', '\\-');
    button = element.querySelector("#" + id);
    button.disabled = false;
  }

  #displayBodyTag() {
    let wrapper, tagWrapper, label, button;
    wrapper = document.createElement('div');
    
    label = document.createElement('label');
    label.setAttribute('for', this.bodyID + '-annotation-tag');
    label.setAttribute('class', 'annotation-display-label');
    label.textContent = "Annotation-Tag:";

    tagWrapper = document.createElement('div');
    tagWrapper.style.overflow = "auto";
    button = this.tag.renderTag();
    button.setAttribute('id', this.bodyID + '-annotation-tag');
    button.style.float = "right";
    tagWrapper.append(button);
    
    wrapper.appendChild(label);
    wrapper.appendChild(tagWrapper);

    return wrapper;
  }

  createElementCreation(signalValid, signalInvalid) {
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

    wrapper.appendChild(this.#createNewTagSelection(signalValid, signalInvalid));
    if (this.#tag || this.#tagSet) {
      this.#setupTagSelection(wrapper);
    }
    // start state is invalid
    if (!this.#tag) {
      signalInvalid();
    } else {
      signalValid();
    }
    
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
    this.#setupTagSelection(element);
    this.setElementContent(element);
    return this.element;
  }

  createElementDisplay() {
    let wrapper, p, body;
  
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-tag-wrapper');
    // body description
    p = document.createElement('p');
    p.textContent = "SimpleTagBody:";
    p.style.fontWeight = "bold";
    wrapper.appendChild(p);
    // body content
    body = this.#displayBodyTag();
    wrapper.appendChild(body);
    this.setElementContent(wrapper);
    
    return this.element;
  }

  focus() {
    if (this.state === State.Edit) {
      this.element.firstChild.focus();
      this.element.firstChild.select();
    }
  }

  isValue(val) {
    return this.tag.id === val;
  }

  save() {
    super.save();
    let id;
    id = document.getElementById(this.bodyID + "-annotation-tag-selection").value;
    this.#tag = runtime.getPlugin("SimpleTagBody").getTagForId(id);
  }

  edit() {
    super.edit();
  }

  cancel() {
    super.cancel();
  }

  copy() {
    // TODO
  }
}
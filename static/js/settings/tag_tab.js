class TagSetTabState {
  /**
   * The current state:
   *  - 1: Main screen that shows tag sets
   *  - 2: Display a tag set
   *  - 3: Display a tag
   *  - 4: Create a new tag set
   *  - 5: Create a new tag
   *  - 6: Create a new tag set from an annotation body (quick mode)
   *  - 7: Create a new tag from an annotation body (quick mode)
   */
  #state;

  constructor() {
    this.#state = 1;
  }

  get inDefaultState() {
    return this.#state === 1;
  }

  get inTagSetDisplayState() {
    return this.#state === 2;
  }

  get inTagDisplayState() {
    return this.#state === 3;
  }

  get inTagSetCreationState() {
    return this.#state === 4;
  }
  get inTagCreationState() {
    return this.#state === 5;
  }

  get inRapidTagSetCreationState() {
    return this.#state === 6;
  }

  get inRapidTagCreationState() {
    return this.#state === 7;
  }

  get inTagSetState() {
    return this.inTagSetDisplayState || this.inTagSetCreationState || this.inRapidTagSetCreationState;
  }

  get inTagState() {
    return this.inTagDisplayState || this.inTagCreationState || this.inRapidTagCreationState;
  }

  setToDefaultState() {
    this.#state = 1;
  }

  setToTagSetDisplayState() {
    this.#state = 2;
  }

  setToTagDisplayState() {
    this.#state = 3;
  }

  setToTagSetCreationState() {
    this.#state = 4;
  }

  setToTagCreationState() {
    this.#state = 5;
  }

  setToRapidTagSetCreationState() {
    this.#state = 6;
  }

  setToRapidTagCreationState() {
    this.#state = 7;
  }
}


class TagSetTab extends AbstractSettingsTab {
  #state;
  #contentDiv;
  #tagSet = null;
  #tag = null;
  #callback = null;
  
  constructor() {
    super();
    this.#state = new TagSetTabState();
  }

  createContent() {
    let content, wrapper;
    content = document.createElement('div');
    content.setAttribute('class', 'settings-tab-tagset');
    content.appendChild(this.#header());

    wrapper = document.createElement('div');
    content.appendChild(wrapper);
    wrapper.setAttribute('class', 'content');
    wrapper.appendChild(this.#content());
    // save div to change screen
    this.#contentDiv = wrapper;

    return content;
  }

  /**
   * Menus closes - reset state
   * @param {boolean} cmf true if menu closes
   */
  close(cmf) {
    if (cmf) {
      this.#tag = null;
      this.#tagSet = null;
      this.#state.setToDefaultState();
    }
  }

  /**
   * Open the tag set menu from a annotation body.
   * @param {*} callback the callback to notify about new tag set.
   */
  setupQuickTagSetCreation(callback) {
    // reset values
    this.#tag = null;
    this.#tagSet = null;
    // set state
    this.#state.setToRapidTagSetCreationState();
    // save callback
    this.#callback = callback;
  }

  /**
   * Open the tag menu from a annotation body to create new tag for tag set.
   * @param {TagSet} tagSet the tag set for which to create the tag
   * @param {*} callback the callback to notify about new tag set.
   */
  setupQuickTagCreation(tagSet, callback) {
    // reset values
    this.#tag = null;
    this.#tagSet = tagSet;
    // set state
    this.#state.setToRapidTagCreationState();
    // save callback
    this.#callback = callback;
  }

  /**
   * Setupt to display a tag
   * @param {Tag} tag the tag to display
   */
  setupDisplayTag(tag) {
    this.#tagSet = tag.tagSet;
    this.#tag = tag;
    this.#state.setToTagDisplayState();
  }

  #updateContent() {
    // clear content
    this.#contentDiv.replaceChildren();
    // set new content
    this.#contentDiv.appendChild(this.#content());
  }

  #backEvent() {
    if (this.#state.inDefaultState) {
      // nothing to do
      return;
    } else if (this.#state.inTagSetDisplayState || this.#state.inTagSetCreationState) {
      this.#tagSet = null;
      this.#state.setToDefaultState();
    } else if (this.#state.inTagDisplayState || this.#state.inTagCreationState) {
      this.#tag = null;
      this.#state.setToTagSetDisplayState();
    } else if (this.#state.inRapidTagSetCreationState || this.#state.inRapidTagCreationState) {
      // ignore back in this state
      return;
    }
    this.#updateContent();
  }
  
  #createNewTagSetEvent() {
    // clear content
    this.#contentDiv.replaceChildren();
    // reset values
    this.#tagSet = null;
    this.#tag = null;
    // set state
    this.#state.setToTagSetCreationState();
    // open menu
    this.#contentDiv.appendChild(this.#tagSetContent());
  }

  #createNewTagEvent() {
    // clear content
    this.#contentDiv.replaceChildren();
    // reset tag value
    this.#tag = null;
    // set state
    this.#state.setToTagCreationState();
    // open menu
    this.#contentDiv.appendChild(this.#tagContent());
  }

  /**
   * Click on a tag set in the menu
   * @param {TagSet} tagSet 
   */
  #clickOnTagSet(tagSet) {
    this.#tagSet = tagSet;
    // set state
    this.#state.setToTagSetDisplayState();
    this.#updateContent();
  }

  /**
   * Click on a tag in the menu
   * @param {Tag} tag 
   */
  #clickOnTag(tag) {
    this.#tag = tag;
    // set state
    this.#state.setToTagDisplayState();
    this.#updateContent();
  }

  #addNewTagSetButton() {
    let footer, entry, text, add;
    footer = document.createElement('div');
    footer.setAttribute('class', 'footer');
    entry = document.createElement('div');
    entry.setAttribute('class', 'new-entry');
    add = document.createElement('i');
    add.setAttribute('class', 'material-symbols-outlined material-symbols-hover prevent-select add');
    add.textContent = "add_box";
    // click event
    add.addEventListener("click", (event) => this.#createNewTagSetEvent());
    text = document.createElement('span');
    text.setAttribute('class', 'add-text');
    text.textContent = "Add a new TagSet";
    // join
    entry.appendChild(text);
    entry.appendChild(add);
    footer.appendChild(entry);
    return footer;
  }

  #addNewTagButton() {
    let footer, entry, text, add;
    footer = document.createElement('div');
    footer.setAttribute('class', 'footer');
    entry = document.createElement('div');
    entry.setAttribute('class', 'new-entry');
    add = document.createElement('i');
    add.setAttribute('class', 'material-symbols-outlined material-symbols-hover prevent-select add');
    add.textContent = "add_box";
    add.addEventListener("click", (event) => this.#createNewTagEvent());
    text = document.createElement('span');
    text.setAttribute('class', 'add-text');
    text.textContent = "Add a new Tag";
    // join
    entry.appendChild(text);
    entry.appendChild(add);
    footer.appendChild(entry);
    return footer;
  }

  #header() {
    let div, back;

    div = document.createElement('div');
    div.setAttribute('class', 'entry-header');

    back = document.createElement('i');
    back.setAttribute('class', 'material-symbols-outlined material-symbols-hover prevent-select back');
    back.textContent = "arrow_back_ios";
    back.addEventListener("click", (event) => this.#backEvent());
    div.appendChild(back);

    return div;
  }

  #content() {
    if (this.#state.inDefaultState) {
      return this.#contentDefault();
    } else if (this.#state.inTagSetState) {
      return this.#tagSetContent();
    } else if (this.#state.inTagState) {
      return this.#tagContent();
    }
    // error
    console.error('Unknown state');
    return this.#contentDefault();
  }

  #contentDefault() {
    let div, title, wrapper, table;

    div = document.createElement('div');
    div.setAttribute('class', 'entry');

    title = document.createElement('h3');
    title.textContent = "TagSets:";
    div.appendChild(title);

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'settings-entry-wrapper');
    div.appendChild(wrapper);

    /* --- TagsSets  --- */
    table = document.createElement('table');
    wrapper.appendChild(table);
    for (let tagSet of tagSetPlugin.tagSets.values()) {
      let tr, td, visibility, text;
      tr = document.createElement('tr');
      table.appendChild(tr);
      visibility = document.createElement('i');
      visibility.setAttribute('class', 'material-symbols-outlined material-symbols-hover visibility');
      visibility.textContent = tagSet.visibility ? "visibility_off" : "visibility";
      visibility.style.paddingLeft = "20px";
      visibility.addEventListener('click', (event) => {
        // runtime.filterAnnotations(SimpleTagBody.name, FilterWildcars.ALL);
        if (event.target.textContent === "visibility_off") {
          // turn visibility off
          event.target.textContent = "visibility";
          tagSet.visibility = false;
        } else if (event.target.textContent === "visibility") {
          // turn visibility on
          event.target.textContent = "visibility_off";
          tagSet.visibility = true;
        }
        runtime.updateVisibility();
      });
      text = document.createElement('span');
      text.setAttribute('class', 'content-text');
      text.textContent = tagSet.label;
      // join togther
      td = document.createElement('td');
      td.appendChild(visibility);
      td.style.width = "100px";
      tr.appendChild(td);
      td = document.createElement('td');
      td.appendChild(text);
      // add click event
      td.addEventListener('click', (event) => this.#clickOnTagSet(tagSet));
      tr.appendChild(td);
    }

    div.appendChild(this.#addNewTagSetButton());

    return div;
  }

  /**
   * Update the enable state of the save button.
   */
  #updateSaveButton() {
    let val = true;
    if (this.#state.inTagCreationState || this.#state.inRapidTagCreationState) {
      let id, label;
      id = document.getElementById('tag-creation-id').value;
      label = document.getElementById('tag-creation-label').value;
      val = id == '' || label == '';
    } else if (this.#state.inTagSetCreationState || this.#state.inRapidTagSetCreationState) {
      let id, label;
      id = document.getElementById('tag-set-creation-id').value;
      label = document.getElementById('tag-set-creation-label').value;
      val = id == '' || label == '';
    } else {
      console.log('Invalid state of tag set tab');
    }
    // disable / enable button
    document.getElementById('menu-create-save').disabled = val;
  }

  /**
   * Refresh the uuid of the id input.
   */
  #refreshUUID() {
    let rnd = self.crypto.randomUUID();
    if (this.#state.inTagCreationState || this.#state.inRapidTagCreationState) {
      document.getElementById('tag-creation-id').value = rnd;
    } else if (this.#state.inTagSetCreationState || this.#state.inRapidTagSetCreationState) {
      document.getElementById('tag-set-creation-id').value = rnd;
    } else {
      console.log('Invalid state of tag set tab');
      return;
    }
    this.#updateSaveButton();
  }

  #cancelEvent() {
    // handle quick mode from body
    if (this.#state.inRapidTagCreationState || this.#state.inRapidTagSetCreationState) {
      runtime.settings.closeSettingsMenu();
    }
    // handle normal tag (set) creation
    if (this.#state.inTagCreationState) {
      this.#state.setToTagSetDisplayState();
    } else if (this.#state.inTagSetCreationState) {
      this.#state.setToDefaultState();
    }
    this.#updateContent();
  }

  #creationFooter() {
    let footer, save, cancel;

    /* --- footer  --- */
    footer = document.createElement('div');
    footer.setAttribute('class', 'footer');

    save = document.createElement('button');
    save.setAttribute('id', 'menu-create-save');
    save.setAttribute('class', 'menu-create-save');
    save.textContent = 'Save';
    save.disabled = true;
    // set event handler
    if (this.#state.inTagState) {
      save.addEventListener('click', (event) => this.#saveTag());
    } else if (this.#state.inTagSetState) {
      save.addEventListener('click', (event) => this.#saveTagSet());
    } else {
      console.error('Invalid state of tag set tab.');
    }

    cancel = document.createElement('button');
    cancel.setAttribute('class', 'menu-create-cancel');
    cancel.textContent = 'Cancel';
    // go back to previous screen
    cancel.addEventListener('click', (event) => this.#cancelEvent());
    
    footer.appendChild(save);
    footer.appendChild(cancel);

    return footer;
  }

  #saveTagSet() {
    let id, label, comment;
    id = document.getElementById('tag-set-creation-id').value;
    label = document.getElementById('tag-set-creation-label').value;
    comment = document.getElementById('tag-set-creation-comment').value;

    this.#tagSet = new TagSet(id, [], label, comment);
    tagSetPlugin.addNewTagSet(this.#tagSet);

    if (this.#state.inRapidTagSetCreationState) {
      // notify about new tag set
      this.#callback(this.#tagSet);
      // close menu
      runtime.settings.closeSettingsMenu();
      return;
    }
    this.#state.setToTagSetDisplayState();

    this.#updateContent();
  }

  #saveTag() {
    let id, label, comment, color, tagSet;
    id = document.getElementById('tag-creation-id').value;
    label = document.getElementById('tag-creation-label').value;
    comment = document.getElementById('tag-creation-comment').value;
    color = document.getElementById('tag-creation-color').value;
    tagSet = document.getElementById('tag-creation-belongs').value;

    this.#tag = new Tag(id, label, comment, color);
    tagSetPlugin.addNewTag(this.#tag, tagSet);

    if (this.#state.inRapidTagCreationState) {
      // notify about new tag set
      this.#callback(this.#tag);
      // close menu
      runtime.settings.closeSettingsMenu();
      return;
    }
    this.#state.setToTagDisplayState();
    this.#updateContent();
  }

  #tagSetContent() {
    let div, title;
    let body, row, col25, col75, label, input, table, elem, wrapper;

    div = document.createElement('div');
    div.setAttribute('class', 'entry');

    title = document.createElement('h3');
    if (this.#state.inTagSetDisplayState) {
      title.textContent = this.#tagSet.label;
    } else {
      title.textContent = "Create new tag set:"
    }
    div.appendChild(title);
    
    /* --- body  --- */
    body = document.createElement('div');
    body.setAttribute('class', 'settings-entry-wrapper');
    div.appendChild(body);
    /* --- TagSet Information  --- */
    // id
    row = document.createElement('div');
    row.setAttribute('class', 'row');
    body.appendChild(row);
    col25 = document.createElement('div');
    col25.setAttribute('class', 'col-25');
    row.appendChild(col25);
    label = document.createElement('label');
    label.setAttribute('for', 'tag-set-creation-id');
    label.textContent = "TagSet-ID";
    col25.appendChild(label);
    col75 = document.createElement('div');
    col75.setAttribute('class', 'col-75');
    row.appendChild(col75);
    input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('id', 'tag-set-creation-id');
    col75.appendChild(input);
    if (this.#state.inTagSetDisplayState) {
      // set id value
      input.setAttribute('value', this.#tagSet.id);
      input.disabled = true;
    } else {
      // create new random id and generate button
      let rnd = self.crypto.randomUUID();
      input.setAttribute('value', rnd);
      input.setAttribute('placeholder', 'Universally Unique Identifier');
      input.style.width = "90%";
      input.addEventListener('keyup', (event) => this.#updateSaveButton());
      // button to generate new id
      elem = document.createElement('i');
      elem.setAttribute('class', 'material-symbols-outlined material-symbols-hover refresh-id prevent-select');
      elem.textContent = "autorenew";
      elem.addEventListener('click', (event) => this.#refreshUUID());
      col75.appendChild(elem);
    }
    // label
    row = document.createElement('div');
    row.setAttribute('class', 'row');
    body.appendChild(row);
    col25 = document.createElement('div');
    col25.setAttribute('class', 'col-25');
    row.appendChild(col25);
    label = document.createElement('label');
    label.setAttribute('for', 'tag-set-creation-label');
    label.textContent = "Label";
    col25.appendChild(label);
    col75 = document.createElement('div');
    col75.setAttribute('class', 'col-75');
    row.appendChild(col75);
    input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('id', 'tag-set-creation-label');
    if (this.#state.inTagSetDisplayState) {
      // set label text
      input.setAttribute('value', this.#tagSet.label);
      input.disabled = true;
    } else {
      input.setAttribute('placeholder', 'TagSet label');
      input.addEventListener('keyup', (event) => this.#updateSaveButton());
    }
    col75.appendChild(input);
    // comment
    row = document.createElement('div');
    row.setAttribute('class', 'row');
    body.appendChild(row);
    col25 = document.createElement('div');
    col25.setAttribute('class', 'col-25');
    row.appendChild(col25);
    label = document.createElement('label');
    label.setAttribute('for', 'tag-set-creation-comment');
    label.textContent = "Comment";
    col25.appendChild(label);
    col75 = document.createElement('div');
    col75.setAttribute('class', 'col-75');
    row.appendChild(col75);
    input = document.createElement('textarea');
    input.setAttribute('id', 'tag-set-creation-comment');
    if (this.#state.inTagSetDisplayState) {
      input.textContent = this.#tagSet.comment;
      input.disabled = true;
      input.style.height = "75px";
    } else {
      input.setAttribute('placeholder', 'Optional tag comment...');
      input.style.height = "100px";
    }
    col75.appendChild(input);

    if (this.#state.inTagSetDisplayState) {
      /* --- Tags in the TagSet  --- */
      row = document.createElement('div');
      row.setAttribute('class', 'row');
      body.appendChild(row);
      col25 = document.createElement('div');
      col25.setAttribute('class', 'col-25');
      row.appendChild(col25);
      label = document.createElement('span');
      label.textContent = "Tag List";
      col25.appendChild(label);
      col75 = document.createElement('div');
      col75.setAttribute('class', 'col-75');
      row.appendChild(col75);

      wrapper = document.createElement('div');
      col75.appendChild(wrapper);
      wrapper.setAttribute('class', 'wrapper-content');
      table = document.createElement('table');
      wrapper.appendChild(table);

      for (let tag of this.#tagSet.tags) {
        let tr, td, visibility, text, colorWrapper, colorDiv, colorButton, colorInput;
        tr = document.createElement('tr');
        table.appendChild(tr);
        // table content
        visibility = document.createElement('i');
        visibility.setAttribute('class', 'material-symbols-outlined material-symbols-hover visibility');
        visibility.textContent = tag.visibility ? "visibility_off" : "visibility";
        visibility.style.paddingLeft = "20px";
        visibility.addEventListener('click', (event) => {
          if (event.target.textContent === "visibility_off") {
            // turn visibility off
            event.target.textContent = "visibility";
            tag.visibility = false;
          } else if (event.target.textContent === "visibility") {
            // turn visibility on
            event.target.textContent = "visibility_off";
            tag.visibility = true;
          }
          runtime.updateVisibility();
        });
        text = document.createElement('span');
        text.setAttribute('class', 'content-text');
        text.textContent = tag.label;
        colorWrapper = document.createElement('div');
        colorWrapper.setAttribute('class', 'tag-color');
        colorDiv = document.createElement('div');
        colorDiv.setAttribute('class', 'clr-field tag-color-wrapper');
        colorDiv.style.color = tag.color;
        colorButton = document.createElement('button');
        colorButton.setAttribute('type', 'button');
        colorButton.setAttribute('aria-labelledby', 'clr-open-label');
        colorButton.setAttribute('class', 'tag-color-button');
        colorInput = document.createElement('input');
        colorInput.setAttribute('type', 'text');
        colorInput.setAttribute('class', 'coloris instance3 tag-color-input');
        colorInput.setAttribute('value', tag.color);
        colorInput.addEventListener('input', (event) => {tag.color = event.target.value});
        // join elements to table
        td = document.createElement('td');
        td.appendChild(visibility);
        td.style.width = "100px";
        tr.appendChild(td);
        td = document.createElement('td');
        td.appendChild(text);
        td.addEventListener('click', (event) => this.#clickOnTag(tag));
        tr.appendChild(td);
        colorWrapper.appendChild(colorDiv);
        colorDiv.appendChild(colorButton);
        colorDiv.appendChild(colorInput);
        td = document.createElement('td');
        td.appendChild(colorWrapper);
        tr.appendChild(td);
      }
      div.appendChild(this.#addNewTagButton());
    } else {
      // show different footer and don't display any tags
      div.appendChild(this.#creationFooter());
    }
    return div;
  }

  #tagContent() {
    let div, title;
    let body, row, col25, col75, label, input, elem;
    // setup
    div = document.createElement('div');
    div.setAttribute('class', 'entry');

    title = document.createElement('h3');
    if (this.#state.inTagDisplayState) {
      title.textContent = this.#tag.label;
    } else {
      title.textContent = "Create new tag:";
    }
    
    div.appendChild(title);
    // menu body
    body = document.createElement('div');
    body.setAttribute('class', 'settings-entry-wrapper');
    div.appendChild(body);
    // id
    row = document.createElement('div');
    row.setAttribute('class', 'row');
    body.appendChild(row);
    col25 = document.createElement('div');
    col25.setAttribute('class', 'col-25');
    row.appendChild(col25);
    label = document.createElement('label');
    label.setAttribute('for', 'tag-creation-id');
    label.textContent = "Tag-ID";
    col25.appendChild(label);
    col75 = document.createElement('div');
    col75.setAttribute('class', 'col-75');
    row.appendChild(col75);
    input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('id', 'tag-creation-id');
    col75.appendChild(input);
    if (this.#state.inTagDisplayState) {
      input.setAttribute('value', this.#tag.id);
      input.disabled = true;
    } else {
      // create new random id and generate button
      let rnd = self.crypto.randomUUID();
      input.setAttribute('value', rnd);
      input.setAttribute('placeholder', 'Universally Unique Identifier');
      input.style.width = "90%";
      input.addEventListener('keyup', (event) => this.#updateSaveButton());
      // button to generate new id
      elem = document.createElement('i');
      elem.setAttribute('class', 'material-symbols-outlined material-symbols-hover refresh-id prevent-select');
      elem.textContent = "autorenew";
      elem.addEventListener('click', (event) => this.#refreshUUID());
      col75.appendChild(elem);
    }
    // label
    row = document.createElement('div');
    row.setAttribute('class', 'row');
    body.appendChild(row);
    col25 = document.createElement('div');
    col25.setAttribute('class', 'col-25');
    row.appendChild(col25);
    label = document.createElement('label');
    label.setAttribute('for', 'tag-creation-label');
    label.textContent = "Label";
    col25.appendChild(label);
    col75 = document.createElement('div');
    col75.setAttribute('class', 'col-75');
    row.appendChild(col75);
    input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('id', 'tag-creation-label');
    if (this.#state.inTagDisplayState) {
      input.setAttribute('value', this.#tag.label);
      input.disabled = true;
    } else {
      input.setAttribute('placeholder', 'Tag label');
      input.addEventListener('keyup', (event) => this.#updateSaveButton());
    }
    col75.appendChild(input);
    // comment
    row = document.createElement('div');
    row.setAttribute('class', 'row');
    body.appendChild(row);
    col25 = document.createElement('div');
    col25.setAttribute('class', 'col-25');
    row.appendChild(col25);
    label = document.createElement('label');
    label.setAttribute('for', 'tag-creation-comment');
    label.textContent = "Comment";
    col25.appendChild(label);
    col75 = document.createElement('div');
    col75.setAttribute('class', 'col-75');
    row.appendChild(col75);
    input = document.createElement('textarea');
    input.setAttribute('id', 'tag-creation-comment');
    if (this.#state.inTagDisplayState) {
      input.textContent = this.#tag.comment;
      input.disabled = true;
    } else {
      input.setAttribute('placeholder', 'Optional tag comment...');
      input.style.height = "100px";
    }
    col75.appendChild(input);
    // belongsTo
    row = document.createElement('div');
    row.setAttribute('class', 'row');
    body.appendChild(row);
    col25 = document.createElement('div');
    col25.setAttribute('class', 'col-25');
    row.appendChild(col25);
    label = document.createElement('label');
    label.setAttribute('for', 'tag-creation-belongs');
    label.textContent = "Belongs to TagSet";
    col25.appendChild(label);
    col75 = document.createElement('div');
    col75.setAttribute('class', 'col-75');
    row.appendChild(col75);

    if (this.#state.inTagDisplayState) {
      input = document.createElement('input');
      input.setAttribute('type', 'text');
      input.setAttribute('value', this.#tag.tagSet.label);
      input.disabled = true;
    } else {
      input = document.createElement('select');
      for (let tagSet of tagSetPlugin.tagSets.values()) {
        let group, option;
        // use group to show id
        group = document.createElement('optgroup');
        group.setAttribute('label', tagSet.id);
        input.appendChild(group);
        option = document.createElement('option');
        option.setAttribute('value', tagSet.id);
        option.textContent = tagSet.label;
        if (this.#tagSet.id !== null && this.#tagSet.id === tagSet.id) {
          option.setAttribute('selected', 'selected');
        }
        group.appendChild(option);
      }
    }
    input.setAttribute('id', 'tag-creation-belongs');
    col75.appendChild(input);
    // color
    let tagColor;
    if (this.#state.inTagDisplayState) {
      tagColor = this.#tag.color;
    } else {
      // random color
      tagColor = "#" + ((Math.random()*0xFFFFFF<<0).toString(16)).padStart(6, '0');
    }
    row = document.createElement('div');
    row.setAttribute('class', 'row');
    body.appendChild(row);
    col25 = document.createElement('div');
    col25.setAttribute('class', 'col-25');
    row.appendChild(col25);
    label = document.createElement('label');
    label.setAttribute('for', 'tag-creation-color');
    label.textContent = "Highlight-Color";
    col25.appendChild(label);
    col75 = document.createElement('div');
    col75.setAttribute('class', 'col-75');
    row.appendChild(col75);
    elem = document.createElement('div');
    elem.setAttribute('class', 'clr-field');
    elem.style.color = tagColor;
    col75.appendChild(elem);
    input = document.createElement('button');
    input.setAttribute('type', 'button');
    input.setAttribute('aria-labelledby', 'clr-open-label');
    elem.appendChild(input);
    input = document.createElement('input');
    input.setAttribute('id', 'tag-creation-color');
    input.setAttribute('type', 'text');
    input.setAttribute('class', 'coloris instance3');
    input.setAttribute('value', tagColor);
    if (this.#state.inTagDisplayState) {
      input.disabled = true;
    }
    elem.appendChild(input);

    if (this.#state.inTagCreationState || this.#state.inRapidTagCreationState) {
      // show save/cancel footer
      div.appendChild(this.#creationFooter());
    }

    return div;
  }
}
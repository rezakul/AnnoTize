class Settings {
  #openMenu
  #backQueue = [];

  constructor() {
    this.#openMenu = null;
  }

  #openMenuTODO() {
    this.sidebar.closeSidebar();
    document.body.setAttribute('class', 'stop-scrolling');
  }

  #defaultOpenMenu(lastMenu) {
    //runtime.sidebar.closeSidebar();
    //document.body.setAttribute('class', 'stop-scrolling');

    if (lastMenu === undefined) {
      this.#backQueue = [];
    } else if (lastMenu !== null) {
      this.#backQueue.push(lastMenu);
    }
    if (this.#openMenu !== null) {
      try {
        document.body.removeChild(this.#openMenu);
      } catch (DOMException) {
        // set openMenu to null anyway
      }
      this.#openMenu = null;
    }
  }

  closeMenu() {
    document.body.setAttribute('class', '');
    if (this.#openMenu !== null) {
      document.body.removeChild(this.#openMenu);
      this.#backQueue = [];
      this.#openMenu = null;
    }
  }

  cancel(event) {
    if (this.#backQueue.length !== 0) {
      this.back();
    } else {
      this.closeMenu();
    }
  }

  back() {
    let prev;
    if (this.#backQueue.length === 0) {
      return;
    }
    prev = this.#backQueue.pop();
    if (this.#openMenu !== null) {
      document.body.removeChild(this.#openMenu);
      this.#openMenu = null;
    }
    this.#openMenu = prev.show();
    document.body.appendChild(this.#openMenu);
  }

  openTagSetsMenu(lastMenu=null) {
    let menu;
    this.#defaultOpenMenu(lastMenu);
    
    menu = new TagSetsMenu(this);
    this.#openMenu = menu.show();
    document.body.appendChild(this.#openMenu);
  }

  openTagSetMenu(tagSet, lastMenu=null) {
    let menu;
    this.#defaultOpenMenu(lastMenu);

    menu = new TagSetMenu(this, tagSet);
    this.#openMenu = menu.show();
    document.body.appendChild(this.#openMenu);
  }

  openTagSetCreationMenu(lastMenu=null, callbackSave=null) {
    let menu;
    this.#defaultOpenMenu(lastMenu);

    menu = new TagSetMenu(this, null, callbackSave);
    this.#openMenu = menu.create();
    document.body.appendChild(this.#openMenu);
  }

  openTagMenu(tag, lastMenu=null) {
    let menu;
    this.#defaultOpenMenu(lastMenu);

    menu = new TagMenu(this, tag);
    this.#openMenu = menu.show();
    document.body.appendChild(this.#openMenu);
  }

  openTagCreationMenu(tagSetId, lastMenu=null, callbackSave=null) {
    let menu;
    this.#defaultOpenMenu(lastMenu);

    menu = new TagMenu(this, null, callbackSave);
    this.#openMenu = menu.create(tagSetId);
    document.body.appendChild(this.#openMenu);
  }

  openImportMenu() {
    let menu;
    this.#defaultOpenMenu(null);

    menu = new ImportMenu(this);
    this.#openMenu = menu.show();
    document.body.appendChild(this.#openMenu);
  }
}

class MenuUI {
  constructor() {
    // nothing to do

  }

  /**
   * Create a basic header for the menu.
   * @param {Settings} menuInstance the running istance of the menu
   * @param {string} name the menu name 
   * @param {boolean} hasBack menu has back button
   * @returns {Node} the header node
   */
  static #createMenuHeader(menuInstance, name, hasBack) {
    let header, close, heading;
    
    header = document.createElement('div');
    header.setAttribute('class', 'header');
    // back button to get to the previous menu
    if (hasBack) {
      let back;
      back = document.createElement('i');
      back.setAttribute('class', 'material-symbols-outlined material-symbols-hover back');
      back.textContent = "arrow_back_ios";
      back.addEventListener("click", (event) => ((menu) => {
        menu.back();
      })(menuInstance));
      header.appendChild(back);
    }
    // the menu name
    heading = document.createElement('span');
    heading.setAttribute('class', 'heading');
    heading.textContent = name;
    header.appendChild(heading);
    // close button for the menu
    close = document.createElement('i');
    close.setAttribute('class', 'material-symbols-outlined material-symbols-hover close');
    close.textContent = "close";
    close.addEventListener("click", (event) => ((menu) => {
      menu.closeMenu();
    })(menuInstance));
    header.appendChild(close);

    return header;
  }

  /**
   * Create an menu from the given body and footer.
   * @param {Settings} menuInstance the running istance of the menu
   * @param {string} name the menu name 
   * @param {boolean} back menu has back button
   * @param {Node} body the body of the menu
   * @param {Node} footer the footer of the menu
   */
  static #getAbstractMenu(menuInstance, name, back, body, footer) {
    let menu, header;
    // create base div for menu
    menu = document.createElement('div');
    menu.setAttribute('class', 'tag-set-menu');
    // create the header
    header = this.#createMenuHeader(menuInstance, name, back);
    menu.appendChild(header);
    // append body to the menu
    menu.appendChild(body);
    // append footer to the bottom of the menu
    menu.appendChild(footer);
    
    return menu;
  }

  static getAbstractCreateMenu(menuInstance, name, body, instance) {
    let footer, save, cancel;

    /* --- footer  --- */
    footer = document.createElement('div');
    footer.setAttribute('class', 'footer');

    save = document.createElement('button');
    save.setAttribute('id', 'menu-create-save');
    save.setAttribute('class', 'menu-create-save');
    save.textContent = 'Save';
    save.addEventListener('click', (event) => ((instance) => {
      instance.save();
    })(instance));
    save.disabled = true;

    cancel = document.createElement('button');
    cancel.setAttribute('class', 'menu-create-cancel');
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', (event) => {
      menuInstance.cancel(event);
    });
    
    footer.appendChild(save);
    footer.appendChild(cancel);

    return this.#getAbstractMenu(menuInstance, name, true, body, footer);
  }

  static getAbstractInformationMenu(menuInstance, name, body, footer=null) {
    /* --- footer  --- */
    if (footer === null) {
      footer = document.createElement('div');
      footer.setAttribute('class', 'footer');
    }

    return this.#getAbstractMenu(menuInstance, name, true, body, footer);
  }
}

class TagSetsMenu {
  #menu;

  constructor(menu) {
    this.#menu = menu;
  }

  #footer() {
    let footer, entry, text, add;
    footer = document.createElement('div');
    footer.setAttribute('class', 'footer');
    entry = document.createElement('div');
    entry.setAttribute('class', 'new-entry');
    add = document.createElement('i');
    add.setAttribute('class', 'material-symbols-outlined material-symbols-hover add');
    add.textContent = "add_box";
    add.addEventListener("click", (event) => ((menu, back) => {
      menu.openTagSetCreationMenu(back);
    })(this.#menu, this));
    text = document.createElement('span');
    text.setAttribute('class', 'add-text');
    text.textContent = "Add a new TagSet";
    // join
    entry.appendChild(text);
    entry.appendChild(add);
    footer.appendChild(entry);
    return footer;
  }

  show() {
    let body, wrapper, table;
    /* --- body  --- */
    body = document.createElement('div');
    body.setAttribute('class', 'menu-body');
    /* --- TagsSets  --- */
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'wrapper-content');
    body.appendChild(wrapper);
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
      td.addEventListener('click', (event) => ((menu, tagSet) => {
        menu.openTagSetMenu(tagSet, this);
      })(this.#menu, tagSet));
      tr.appendChild(td);
    }
    // return menu   
    return MenuUI.getAbstractInformationMenu(this.#menu, 'TagSets', body, this.#footer());
  }

/*
  openTagSetsMenu() {
    this.#insertTagSetsIntoMenu();
    document.body.appendChild(this.#tagSetsMenu);
  }

  closeTagSetsMenu() {
    document.body.removeChild(this.#tagSetsMenu);
  }
  */
}

class TagSetMenu {
  #menu;
  #tagSet;
  #callbackSave;

  constructor(menu, tagSet, callbackSave=null) {
    this.#menu = menu;
    this.#tagSet = tagSet;
    this.#callbackSave = callbackSave;
  }

  #footer() {
    let footer, entry, text, add;
    footer = document.createElement('div');
    footer.setAttribute('class', 'footer');
    entry = document.createElement('div');
    entry.setAttribute('class', 'new-entry');
    add = document.createElement('i');
    add.setAttribute('class', 'material-symbols-outlined material-symbols-hover add');
    add.textContent = "add_box";
    add.addEventListener("click", (event) => ((menu, setID, back) => {
      menu.openTagCreationMenu(setID, back);
    })(this.#menu, this.#tagSet.id, this));
    text = document.createElement('span');
    text.setAttribute('class', 'add-text');
    text.textContent = "Add a new Tag";
    // join
    entry.appendChild(text);
    entry.appendChild(add);
    footer.appendChild(entry);
    return footer;
  }

  show() {
    let body, row, col25, col75, label, input, table, wrapper;
    /* --- body  --- */
    body = document.createElement('div');
    body.setAttribute('class', 'menu-body');
    /* --- TagSet Information  --- */
    // id
    row = document.createElement('div');
    row.setAttribute('class', 'row');
    body.appendChild(row);
    col25 = document.createElement('div');
    col25.setAttribute('class', 'col-25');
    row.appendChild(col25);
    label = document.createElement('label');
    label.setAttribute('for', 'tag-creation-id');
    label.textContent = "TagSet-ID";
    col25.appendChild(label);
    col75 = document.createElement('div');
    col75.setAttribute('class', 'col-75');
    row.appendChild(col75);
    input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('id', 'tag-creation-id');
    input.setAttribute('value', this.#tagSet.id);
    input.disabled = true;
    col75.appendChild(input);
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
    input.setAttribute('value', this.#tagSet.label);
    input.disabled = true;
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
    input.textContent = this.#tagSet.comment;
    // input.style.height = "100px";
    input.disabled = true;
    input.style.height = "75px";
    col75.appendChild(input);

    /* --- Tags in the TagSet  --- */
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'wrapper-content');
    body.appendChild(wrapper);
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
      visibility.addEventListener('click', (event) => ((tag) => {
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
      })(tag));
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
      td.addEventListener('click', (event) => ((menu, tag, back) => {
        menu.openTagMenu(tag, back);
      })(this.#menu, tag, this));
      tr.appendChild(td);
      colorWrapper.appendChild(colorDiv);
      colorDiv.appendChild(colorButton);
      colorDiv.appendChild(colorInput);
      td = document.createElement('td');
      td.appendChild(colorWrapper);
      tr.appendChild(td);
    }

    return MenuUI.getAbstractInformationMenu(this.#menu, this.#tagSet.label, body, this.#footer());
  }

  /**
   * Create a new TagSet - menu
   * @returns {Node} the creation menu
   */
  create() {
    let body, row, col25, col75, label, input, elem;
    /* --- body  --- */
    body = document.createElement('div');
    body.setAttribute('class', 'menu-body');
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
    input.setAttribute('value', TagSetMenu.#createUUID());
    input.style.width = "90%";
    input.addEventListener('keyup', (event) => ((instance) => {
      document.getElementById('menu-create-save').disabled = instance.inputSaveDisabled();
    })(this));
    col75.appendChild(input);
    elem = document.createElement('i');
    elem.setAttribute('class', 'material-symbols-outlined material-symbols-hover');
    elem.textContent = "autorenew";
    elem.addEventListener('click', (event) => ((instance) => {
      document.getElementById('tag-set-creation-id').value = TagSetMenu.#createUUID();
      document.getElementById('menu-create-save').disabled = instance.inputSaveDisabled();
    })(this));
    col75.appendChild(elem);
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
    input.setAttribute('placeholder', 'TagSet label');
    input.addEventListener('keyup', (event) => ((instance) => {
      document.getElementById('menu-create-save').disabled = instance.inputSaveDisabled();
    })(this));
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
    input.setAttribute('placeholder', 'Optional tag comment...');
    input.style.height = "100px";
    col75.appendChild(input);

    return MenuUI.getAbstractCreateMenu(this.#menu, "Create a new TagSet", body, this);
  }

  static #createUUID() {
    return self.crypto.randomUUID();
  }

  save() {
    let id, label, comment;
    id = document.getElementById('tag-set-creation-id').value;
    label = document.getElementById('tag-set-creation-label').value;
    comment = document.getElementById('tag-set-creation-comment').textContent;

    if (this.#tagSet === null) {
      this.#tagSet = new TagSet(id, [], label, comment);
      tagSetPlugin.addNewTagSet(this.#tagSet);
    } else {
      // TODO
    }
    if (this.#callbackSave !== null) {
      this.#callbackSave(this.#tagSet);
    } else {
      this.#menu.openTagSetMenu(this.#tagSet, null);
    }
    //this.#menu.openTagMenu(this.#tag, null);
  }

  inputSaveDisabled() {
    let id, label;
    id = document.getElementById('tag-set-creation-id').value;
    label = document.getElementById('tag-set-creation-label').value;
    return id == '' || label == '';
  }
}

class TagMenu {
  #menu
  #tag;
  #callbackSave;

  constructor(menu, tag=null, callbackSave=null) {
    this.#menu = menu;
    this.#tag = tag;
    this.#callbackSave = callbackSave;
  }

  /**
   * Show information about an existing tag.
   * 
   * @returns {Node} the tag menu
   */
  show() {
    let body, row, col25, col75, label, input, elem;
    // check if tag is set
    if (this.#tag === null) {
      console.warn('No tag defined to show...');
      return;
    }
    // menu body
    body = document.createElement('div');
    body.setAttribute('class', 'menu-body');
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
    input.setAttribute('value', this.#tag.id);
    input.disabled = true;
    col75.appendChild(input);
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
    input.setAttribute('value', this.#tag.label);
    input.disabled = true;
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
    input.textContent = this.#tag.comment;
    // input.style.height = "100px";
    input.disabled = true;
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
    input = document.createElement('input');
    input.setAttribute('id', 'tag-creation-belongs');
    input.setAttribute('type', 'text');
    input.setAttribute('value', this.#tag.tagSet.label);
    input.disabled = true;
    col75.appendChild(input);
    // color
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
    elem.style.color = this.#tag.color;
    col75.appendChild(elem);
    input = document.createElement('button');
    input.setAttribute('type', 'button');
    input.setAttribute('aria-labelledby', 'clr-open-label');
    elem.appendChild(input);
    input = document.createElement('input');
    input.setAttribute('id', 'tag-creation-color');
    input.setAttribute('type', 'text');
    input.setAttribute('class', 'instance3');
    input.setAttribute('value', this.#tag.color);
    input.disabled = true;
    elem.appendChild(input);

    return MenuUI.getAbstractInformationMenu(this.#menu, this.#tag.label, body);
  }

  /**
   * Create a new tag - menu
   * @param {string} tagSetId (optional) the tag-set id the tag belongs to
   * @returns {Node} the creation menu
   */
  create(tagSetId = null) {
    let body, row, col25, col75, label, input, elem;
    let randomColor;
    // menu body
    body = document.createElement('div');
    body.setAttribute('class', 'menu-body');
    // id input
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
    input.setAttribute('placeholder', 'Universally Unique Identifier');
    input.setAttribute('value', TagMenu.#createUUID());
    input.style.width = "90%";
    input.addEventListener('keyup', (event) => ((instance) => {
      document.getElementById('menu-create-save').disabled = instance.inputSaveDisabled();
    })(this));
    col75.appendChild(input);
    elem = document.createElement('i');
    elem.setAttribute('class', 'material-symbols-outlined material-symbols-hover');
    elem.textContent = "autorenew";
    elem.addEventListener('click', (event) => ((instance) => {
      document.getElementById('tag-creation-id').value = TagMenu.#createUUID();
      document.getElementById('menu-create-save').disabled = instance.inputSaveDisabled();
    })(this));
    col75.appendChild(elem);
    // label input
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
    input.setAttribute('placeholder', 'Tag label');
    input.addEventListener('keyup', (event) => ((instance) => {
      document.getElementById('menu-create-save').disabled = instance.inputSaveDisabled();
    })(this));
    col75.appendChild(input);
    // comment input
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
    input.setAttribute('placeholder', 'Optional tag comment...');
    input.style.height = "100px";
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
    input = document.createElement('select');
    input.setAttribute('id', 'tag-creation-belongs');
    col75.appendChild(input);
    for (let tagSet of tagSetPlugin.tagSets.values()) {
      let group, option;
      // use group to show id
      group = document.createElement('optgroup');
      group.setAttribute('label', tagSet.id);
      input.appendChild(group);
      option = document.createElement('option');
      option.setAttribute('value', tagSet.id);
      option.textContent = tagSet.label;
      if (tagSetId !== null && tagSetId === tagSet.id) {
        option.setAttribute('selected', 'selected');
      }
      group.appendChild(option);
    }
    // color
    randomColor = "#" + ((Math.random()*0xFFFFFF<<0).toString(16)).padStart(6, '0');
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
    elem.style.color = randomColor;
    col75.appendChild(elem);
    input = document.createElement('button');
    input.setAttribute('type', 'button');
    input.setAttribute('aria-labelledby', 'clr-open-label');
    elem.appendChild(input);
    input = document.createElement('input');
    input.setAttribute('id', 'tag-creation-color');
    input.setAttribute('type', 'text');
    input.setAttribute('class', 'coloris instance3');
    input.setAttribute('value', randomColor);
    elem.appendChild(input);

    return MenuUI.getAbstractCreateMenu(this.#menu, 'Create a new tag', body, this);
  }

  static #createUUID() {
    return self.crypto.randomUUID();
  }

  save() {
    let id, label, comment, color, tagSet;
    id = document.getElementById('tag-creation-id').value;
    label = document.getElementById('tag-creation-label').value;
    comment = document.getElementById('tag-creation-comment').textContent;
    color = document.getElementById('tag-creation-color').value;
    tagSet = document.getElementById('tag-creation-belongs').value;

    console.log(id, label, comment, color, tagSet);
    if (this.#tag === null) {
      this.#tag = new Tag(id, label, comment, color);
      tagSetPlugin.addNewTag(this.#tag, tagSet);
    } else {
      // TODO
    }
    if (this.#callbackSave !== null) {
      this.#callbackSave(this.#tag);
    } else {
      this.#menu.openTagMenu(this.#tag, null);
    }
  }

  inputSaveDisabled() {
    let id, label;
    id = document.getElementById('tag-creation-id').value;
    label = document.getElementById('tag-creation-label').value;
    return id == '' || label == '';
  }
}

class ImportMenu {
  #menu

  constructor(menu) {
    this.#menu = menu;
  }

  /**
   * Import selection (file or database)
   * 
   * @returns {Node} the import menu
   */
  show() {
    let body, row, styles, label, input, elem, icon;
    
    // menu body
    body = document.createElement('div');
    body.setAttribute('class', 'menu-body');
    // annotation style
    row = document.createElement('div');
    row.setAttribute('class', 'row');
    body.appendChild(row);
    label = document.createElement('label');
    label.setAttribute('for', 'import-menu-annotation-style');
    label.textContent = "Select an annotation sytle";
    row.appendChild(label);
    
    styles = [];
    Array.from(runtime.annotationStyles.values()).forEach(element => {
      styles.push(element.preview());
    });

    input = CustomSelect.getCustomSelect(styles, 'Select Style');
    input.setAttribute('id', "import-menu-annotation-style");
    row.appendChild(input);

    // upload button
    row = document.createElement('div');
    row.setAttribute('class', 'row');
    body.appendChild(row);
    elem = document.createElement('button');
    elem.setAttribute('class', 'file-upload-button');
    elem.style.marginTop = "20px"; 
    elem.disabled = true;
    row.appendChild(elem);

    // Enable button on style selection
    input.addEventListener('change', (event) => {
      elem.disabled = false;
    })

    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined material-symbols-hover');
    icon.textContent = "upload_file";
    elem.appendChild(icon);

    input = document.createElement('div');
    input.textContent = "Upload File";
    elem.appendChild(input);
    // Callback to upload file
    elem.addEventListener('click', (event) => {
      runtime.uploadAnnotation();
    })

    return MenuUI.getAbstractInformationMenu(this.#menu, "Import Annotations", body);
  }
}
function holdit(btn, annoationId, border, direction) {
  var t;

  var repeat = function () {
      runtime.adjustSelection(null, annoationId, border, direction);
      t = setTimeout(repeat, start);
      if (start > 25) {
        start = start / 2;
      }   
  }

  btn.onmousedown = function() {
    start = 750;
    repeat();
  }

  btn.onmouseup = function () {
      clearTimeout(t);
  }
};

/**
 * Sidbar for the annotation tool.
 * The sidebar displays all currently annotated elements and provides tools to edit them.
 */
class AnnotationSidebar {
  #sidebar;
  #heading;
  #sidebarContent;
  #sidebarToggleButton;
  #isMouseOverSidebar = false;
  #sidebarCollapsed = true;
  #menu;
  #menuContent;
  #elements;
  #hideabel;

  #headerHeight = 50;   // inital height of the header

  /**
   * 
   * @param {boolean} hideable indicates whether the sidebar can be hidden. 
   */
  constructor(hideable) {
    let templates
    
    this.#hideabel = hideable;
    /** @private @const {Map<number, AnnotationObject>} */
    this.#elements = new Map();
    // Create sidebar element
    /** @private @const {Node} */
    this.#sidebar = document.createElement('div');
    // Set class and id
    this.#sidebar.setAttribute('class', 'annotation-sidebar');
    this.#sidebar.setAttribute('id', 'annotationSidebar');
  
    // Register if mouse over element
    // Add the mouseover event listener
    this.#sidebar.addEventListener('mouseenter', (event) => {
      runtime.sidebar.isMouseOverSidebar = true;
    });
    // Add the mouseout event listener
    this.#sidebar.addEventListener('mouseleave', (event) => {
      runtime.sidebar.isMouseOverSidebar = false;
    });
    // Create button to toggle sidebar
    this.#heading = document.createElement('div');
    this.#heading.setAttribute('class', 'annotation-sidebar-heading prevent-select');
    
    this.#sidebarToggleButton = this.#createToggle();
    
    var heading = document.createElement('span');
    heading.setAttribute('class', 'sidebar-heading');
    heading.textContent = "AnnoTize";

    templates = document.createElement('div');
    templates.setAttribute('id', 'app-sidebar-templates-selection');
    templates.setAttribute('class', 'annotation-sidebar-templates');
    templates.style.display = 'none';
    for (let i = 1; i < 6; ++i) {
      let button;
      button = document.createElement('button');
      button.setAttribute('class', 'template-selector');
      button.textContent = i;
      templates.appendChild(button);
      button.addEventListener('click', (event) => {
        runtime.sidebar.selectTemplate(i);
      });
    }
  
    this.#sidebarContent = document.createElement('div');
    this.#sidebarContent.setAttribute('class', 'annotation-sidebar-content');
    this.#sidebarContent.setAttribute('id', 'annotationSidebarContent');
    
    this.#menu = this.#createMenu();
    /*
    upload = this.#createUpload();
    download = this.#createDownload();
    search = this.#createSearch();
    sort = this.#createSort();
    */

    this.#heading.appendChild(this.#sidebarToggleButton);
    this.#heading.appendChild(heading);
    this.#heading.appendChild(this.#menu);
    this.#sidebar.appendChild(this.#heading);
    this.#sidebar.appendChild(templates);
    this.#sidebar.appendChild(this.#sidebarContent);
    document.body.appendChild(this.#sidebar);

    if (!this.#hideabel) {
      this.#sidebarToggleButton.style.visibility = "hidden";
      this.openSidebar();
    }
  }

  /**
   * Check if mouse currently over sidebar.
   * @returns {boolean} true if mouse is over sidebar, false if not
   */
  get isMouseOverSidebar() {
    return this.#isMouseOverSidebar;
  }

  /**
   * Check if mouse currently over sidebar.
   * @param {boolean} value the value to set
   */
  set isMouseOverSidebar(value) {
    this.#isMouseOverSidebar = value;
  }

    /**
   * Check if the sidebar is currently collapsed.
   * @returns {boolean} true if sidebar is collapsed, false if not
   */
  get isSidebarCollapsed() {
    return this.#sidebarCollapsed;
  }

  activate() {
    // set text width
    document.body.style.removeProperty('width');
    document.body.style.width = document.body.clientWidth - 425 + 'px';
    // set sidebar
    document.body.appendChild(this.#sidebar);
    // update template menu
    if (settingsPlugin.options.useAnnotationTemplate) {
      this.showTemplateMenu();
      for (let i = 0; i < 5; ++i) {
        const ct = settingsPlugin.rapidTab.conceptTemplates[i];
        if (ct || i === 0) {
          this.enableTemplateNumber(i+1);
        } else {
          this.disableTemplateNumber(i+1);
        }
      }
      this.selectTemplate(settingsPlugin.options.currentTemplateNumber + 1);
    } else {
      this.hideTemplateMenu();
    }
  }

  deactivate() {
    if (document.body.contains(this.#sidebar)) {
      document.body.removeChild(this.#sidebar);
    }
    document.body.style.width = document.body.clientWidth - 425 + 'px';
  }

  /**
   * Open the sidebar.
   */
  openSidebar() {
    if (!this.isSidebarCollapsed) {
      return;
    }
    this.#sidebar.style.width = "400px";
    this.#sidebarToggleButton.textContent = "chevron_right";
    this.#sidebarCollapsed = false;
    document.body.style.width = document.body.clientWidth - 425 + 'px';
  }
  
  /**
   * Closes the sidebar.
   */
  closeSidebar() {
    if (!this.#hideabel) {
      return;
    }
    this.#sidebarCollapsed = true;
    this.#sidebar.style.width = "50px";
    this.#sidebarToggleButton.textContent = "chevron_left";
    this.#sidebarCollapsed = true;
    document.body.style.removeProperty('width');
  }

  /**
   * Closes the sidebar, if the mouse is not currently over it.
   */
  closeSidebarIfNotUsed() {
    if (!this.isMouseOverSidebar && !runtime.mouseOverHighlight) {
      this.closeSidebar();
    }
  }

  #documentBackArrow(number) {
    let icon;
    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined material-symbols-hover document_back');
    if (number === 1) {
      icon.classList.add('deactive');
    }
    icon.textContent = "arrow_back";
    if (number !== 1) {
      icon.addEventListener('click', (event) => indexView.switchDocument(number - 1));
    }
    return icon;
  }

  #documentForwardArrow(number, last=false) {
    let icon;
    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined material-symbols-hover document_forward');
    if (last) {
      icon.classList.add('deactive');
    }
    icon.textContent = "arrow_forward";
    if (!last) {
      icon.addEventListener('click', (event) => indexView.switchDocument(number + 1));
    }
    return icon;
  }

  #documentNumber(number) {
    let span;
    span = document.createElement('span');
    span.setAttribute('class', 'document_number');
    span.textContent = "Document [" + number + "]";
    return span;
  }

  addDocumentNavigator(number, total) {
    let back, forward, text;
    back = this.#documentBackArrow(number);
    forward = this.#documentForwardArrow(number, number === total);
    text = this.#documentNumber(number);
    this.#heading.style.height = "70px";
    this.#menuContent.style.top = "70px";
    this.#headerHeight += 20;
    this.#sidebarContent.style.height = `calc(100% - ${this.#headerHeight}px)`;
    this.#heading.appendChild(back);
    this.#heading.appendChild(text);
    this.#heading.appendChild(forward); 
  }

  /**
   * Get the sidebar element for the given annotation-id
   * @param {string} annotationID the annotation id of the element
   * @returns {AnnotationSidbarElement}
   */
  getElement(annotationID) {
    let elem;
    if (!this.#elements.has(annotationID)) {
      console.error('Element with id not found', annotationID);
      return;
    }
    elem = this.#elements.get(annotationID);
    return elem;
  }

  /**
   * Scroll to the element with the given annotation id.
   * 
   * @param {number} annotationID 
   */
  scrollTo(annotationID) {
    let elem;
    if (!this.#elements.has(annotationID)) {
      console.warn('Error: element with id not found', annotationID);
      return;
    }
    elem = this.#elements.get(annotationID);
    // let textarea = sidebar_element.getElementsByTagName('textarea');
    this.openSidebar();
    elem.focus();
    return;
    /*
    if (textarea.length != 0) {
      textarea[0].focus()
      textarea[0].select()
    } else {
      sidebar_element.focus();
    }
    */
  }

  /**
   * Highlight a sidebar element for the user.
   * 
   * @param {number} annotationID
   * @param {boolean} hover true to add highlight, false removes highlight
   */
  highlightElement(annotationID, hover) {
    let elem;
    if (!this.#elements.has(annotationID)) {
      console.error('Element with id not found', annotationID);
      return;
    }
    elem = this.#elements.get(annotationID);
    if (hover) {
      elem.addGUIHighlight();
    } else {
      elem.removeGUIHighlight();
    }
  }

  /**
   * Adds an element to the sidebar
   * @param {number} annotationID the annotation ID for this annotation
   * @param {Node} quoteContent the quoted text
   * @param {AnnotationBody} the annotation body
   * @param {Boolean} silent add the element silent (i.e. does not open sidebar / focus)
   */
  addElement(annotationID, quoteContent, annotationBody, silent=false) {
    let element;
    // open the sidebar so user can save/cancel annotation
    if (!silent) {
      this.openSidebar();
    }
    // create the object
    element = new AnnotationSidbarElement(annotationID, quoteContent, annotationBody);
    //link element to sidebar
    this.#sidebarContent.appendChild(element.toNode());
    element.setQuote(quoteContent);
    this.#elements.set(annotationID, element);
    // select new element
    if (!silent) {
      element.focus();
    }
  }

  /**
   * Checks if the sidebar html element contains the given node.
   * 
   * @param {Node} node the node to check 
   * @returns {boolean} checks if sidebar html node contains given node
   */
  contains(node) {
    return this.#sidebar.contains(node);
  }

  /**
   * Check if the node is before the sidebar
   * @param {Node} node the node to compare to
   * @returns {boolean} true if before
   */
  isNodeBefore(node) {
    return node.compareDocumentPosition(this.#sidebar) === Node.DOCUMENT_POSITION_FOLLOWING;
  }

  /**
   * Removes an element from the sidebar.
   * 
   * @param {number} annotationID the annotation id of the element
   */
  remove(annotationID) {
    let elem;
    if (!this.#elements.has(annotationID)) {
      console.error('Element with id not found', annotationID);
      return;
    }
    elem = this.#elements.get(annotationID);
    elem.remove();
    this.#elements.delete(annotationID);
  }

  /**
   * Saves an element in the sidebar.
   * 
   * @param {number} annotationID the annotation id of the element
   */
  save(annotationID) {
    let elem;
    if (!this.#elements.has(annotationID)) {
      console.error('Element with id not found', annotationID);
      return;
    }
    elem = this.#elements.get(annotationID);
    elem.save();
  }

  /**
   * Set an element in the sidebar into edit state.
   * 
   * @param {number} annotationID the annotation id of the element
   */
  edit(annotationID) {
    let elem;
    if (!this.#elements.has(annotationID)) {
      console.error('Element with id not found', annotationID);
      return;
    }
    elem = this.#elements.get(annotationID);
    elem.edit();
  }

  /**
   * Cancel the edit process of an element in the sidebar.
   * 
   * @param {number} annotationID the annotation id of the element
   */
  cancelEdit(annotationID) {
    let elem;
    if (!this.#elements.has(annotationID)) {
      console.error('Element with id not found', annotationID);
      return;
    }
    elem = this.#elements.get(annotationID);
    elem.cancelEdit();
  }

  /**
   * Hide a annotation in the sidebar.
   * 
   * @param {number} annotationID the annotation id of the element
   */
  hide(annotationID) {
    let elem;
    if (!this.#elements.has(annotationID)) {
      console.error('Element with id not found', annotationID);
      return;
    }
    elem = this.#elements.get(annotationID);
    elem.hide();
  }

  /**
   * Unhide / show a annotation in the sidebar.
   * 
   * @param {number} annotationID the annotation id of the element
   */
  unhide(annotationID) {
    let elem;
    if (!this.#elements.has(annotationID)) {
      console.error('Element with id not found', annotationID);
      return;
    }
    elem = this.#elements.get(annotationID);
    elem.unhide();
  }

  showTemplateMenu() {
    let templates;
    templates = document.getElementById('app-sidebar-templates-selection');
    if (templates.style.display === 'block') {
      return;
    }
    templates.style.display = 'block';
    // increase header height and set cocntent height accordingly
    this.#headerHeight += 50;
    this.#sidebarContent.style.height = `calc(100% - ${this.#headerHeight}px)`;
    document.addEventListener('keyup', runtime.keyupEventTemplateSelection);
  }

  hideTemplateMenu() {
    let templates;
    templates = document.getElementById('app-sidebar-templates-selection');
    if (templates.style.display === 'none') {
      return;
    }
    templates.style.display = 'none';
     // decrease header height and set cocntent height accordingly
     this.#headerHeight -= 50;
     this.#sidebarContent.style.height = `calc(100% - ${this.#headerHeight}px)`;
    document.removeEventListener('keyup', runtime.keyupEventTemplateSelection);
  }

  selectTemplate(number, force=false) {
    let buttons;
    buttons = document.getElementsByClassName("template-selector");
    if (!force && buttons[number-1].matches('.selected') || buttons[number-1].disabled) {
      return;
    }
    for (let button of buttons) {
      button.classList.remove('selected');
    }
    buttons[number-1].classList.add('selected');
    // set current template number
    settingsPlugin.options.currentTemplateNumber = number - 1;
  }

  enableTemplateNumber(number) {
    let buttons;
    buttons = document.getElementsByClassName("template-selector");
    buttons[number-1].disabled = false;
  }

  disableTemplateNumber(number) {
    let buttons;
    buttons = document.getElementsByClassName("template-selector");
    buttons[number-1].disabled = true;
  }

  /**
   * Creates open/close button.
   * 
   * @returns {Node} toggle button
   */
  #createToggle() {
    let toggle;
    toggle = document.createElement('i');
    toggle.setAttribute('class', 'material-symbols-outlined material-symbols-hover toggle');
    toggle.setAttribute('id', 'sidebar-toggle-button');
    toggle.textContent = "chevron_left";
    toggle.addEventListener("click", (event) => {
      if (runtime.sidebar.isSidebarCollapsed) {
        runtime.sidebar.openSidebar();
      } else {
        runtime.sidebar.closeSidebar();
      }
    });
    return toggle;
  }

  #initializeMenu() {
    let wrapper;

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-menu-content');
    this.#menuContent = wrapper;
    wrapper.appendChild(this.#createUpload());
    wrapper.appendChild(this.#createDownload());
    wrapper.appendChild(this.#uploadConcepts());
    wrapper.appendChild(this.#createTagSetMenuButton());
    wrapper.appendChild(this.#createSettingsButton());
    return wrapper;
  }

  /**
   * Creates an menu button.
   * 
   * @returns {Node} menu
   */
  #createMenu() {
    let wrapper, wrapperMenu, menu, content;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-menu');
    wrapperMenu = document.createElement('div');
    wrapperMenu.setAttribute('class', 'annotation-menu-button');

    menu = document.createElement('i');
    menu.setAttribute('class', 'material-symbols-outlined material-symbols-hover');
    menu.textContent = "menu";
    menu.addEventListener("click", (event) => runtime.sidebar.toggleMenu(event));
    document.addEventListener("click", (event) => runtime.sidebar.closeMenu(event));
    wrapperMenu.appendChild(menu);
    wrapper.appendChild(wrapperMenu);
    content = this.#initializeMenu();
    wrapper.appendChild(content);
    return wrapper;
  }


  /**
   * Creates an upload button.
   * 
   * @returns {Node} upload
   */
  #createUpload() {
    let upload, text, wrapper;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'menu-content-element');
    wrapper.addEventListener("click", (event) => {
      runtime.uploadAnnotation();
    });

    upload = document.createElement('i');
    upload.setAttribute('class', 'material-symbols-outlined');
    upload.textContent = "upload";
    
    text = document.createElement('span');
    text.setAttribute('class', 'menu-content-element-text');
    text.textContent = "Import Annotations";

    wrapper.appendChild(upload);
    wrapper.appendChild(text);
    return wrapper;
  }

  /**
   * Creates an download button.
   * 
   * @returns {Node} download
   */
  #createDownload() {
    let download, text, wrapper;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'menu-content-element');
    wrapper.addEventListener("click", (event) => {
      runtime.downloadAnnotation();
    });

    download = document.createElement('i');
    download.setAttribute('class', 'material-symbols-outlined');
    download.textContent = "download";

    text = document.createElement('span');
    text.setAttribute('class', 'menu-content-element-text');
    text.textContent = "Export Annotations";

    wrapper.appendChild(download);
    wrapper.appendChild(text);
    return wrapper;
  }

    /**
   * Creates an upload button for concepts.
   * 
   * @returns {HTMLDivElement} concept upload entry
   */
    #uploadConcepts() {
      let upload, text, wrapper;
      wrapper = document.createElement('div');
      wrapper.setAttribute('class', 'menu-content-element');
      wrapper.addEventListener("click", event => conceptPlugin.uploadConcepts(event));
  
      upload = document.createElement('i');
      upload.setAttribute('class', 'material-symbols-outlined');
      upload.textContent = "upload";
      
      text = document.createElement('span');
      text.setAttribute('class', 'menu-content-element-text');
      text.textContent = "Upload ABoSpecs";
  
      wrapper.appendChild(upload);
      wrapper.appendChild(text);
      return wrapper;
    }

  /**
   * Creates an TagSet menu button.
   * 
   * @returns {Node} download
   */
  #createTagSetMenuButton() {
    let tagset, text, wrapper;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'menu-content-element');
    wrapper.addEventListener("click", (event) => {
      runtime.openTagSetsMenu();
    });

    tagset = document.createElement('i');
    tagset.setAttribute('class', 'material-symbols-outlined');
    tagset.textContent = "settings";
    
    text = document.createElement('span');
    text.setAttribute('class', 'menu-content-element-text');
    text.textContent = "Edit Tag-Sets";

    wrapper.appendChild(tagset);
    wrapper.appendChild(text);
    return wrapper;
  }

  /**
   * Creates an option to open the settings.
   * 
   * @returns {Node}
   */
  #createSettingsButton() {
    let wrapper, icon, text;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'menu-content-element');
    wrapper.addEventListener("click", (event) => { runtime.settings.openSettingsMenu(); });

    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined');
    icon.textContent = "settings";
    wrapper.appendChild(icon);
    
    text = document.createElement('span');
    text.setAttribute('class', 'menu-content-element-text');
    text.textContent = "Settings";
    wrapper.appendChild(text);

    return wrapper;
  }

  /**
   * Creates an search button.
   * 
   * @returns {Node} search
   */
  #createSearch() {
    let search;
    search = document.createElement('i');
    search.setAttribute('class', 'material-symbols-outlined');
    search.textContent = "manage_search";
    search.addEventListener("click", (event) => {
      runtime.searchAnnotation();
    });
    return search;
  }

  /**
   * Creates an sort button.
   * 
   * @returns {Node} sort
   */
  #createSort() {
    let sortWrapper, sort, tooltip, menu, menuEntry;
    sortWrapper = document.createElement('div');
    sortWrapper.setAttribute('class', 'tooltip dropdown');
    // create icon
    sort = document.createElement('i');
    sort.setAttribute('class', 'material-symbols-outlined');
    sort.textContent = "sort";
    sort.addEventListener("click", (event) => {
      document.getElementById("sortSelectionMenu").style.display = "block";
      //runtime.sortAnnotation();
    });
    // create tooltip on hover
    tooltip = document.createElement('div');
    tooltip.setAttribute('class', 'tooltiptext');
    tooltip.textContent = "sort by";
    // menu
    menu = document.createElement('div');
    menu.setAttribute('id', 'sortSelectionMenu');
    menu.setAttribute('class', 'dropdown-content');
    // menu entries
    for (const name of ['Annotation ID asc.', 'Annotation ID desc.']) {
      let menuEntryWrapper, menuEntry;
      menuEntryWrapper = document.createElement('div');
      menuEntryWrapper.setAttribute('class', 'sort-content');
      menuEntry = document.createElement('span');
      menuEntry.textContent = name;
      menuEntryWrapper.appendChild(menuEntry);
      menu.appendChild(menuEntryWrapper);
    }
    // set wrapper
    sortWrapper.appendChild(sort);
    sortWrapper.appendChild(tooltip);
    sortWrapper.appendChild(menu);
    return sortWrapper;
  }

  toggleMenu(event) {
    this.#menu.childNodes[1].classList.toggle("show");
    event.stopPropagation();
  }

  closeMenu(event) {
    this.#menu.childNodes[1].classList.remove("show");
  }

  /**
   * Sorts the sidebar
   */
  sort() {
    let sidebarElements = Array.from(this.#elements.values());
    sidebarElements.sort(this.cmp);
    // replace content with new order
    this.#sidebarContent.replaceChildren();
    sidebarElements.forEach(element => {
      this.#sidebarContent.appendChild(element.toNode());
    });
  }

  cmp(a, b) {
   return b.annotationID - a.annotationID;
  }
}

/**
 * An concrete annotation element in the annotation sidbar.
 * The element contains a quote of the annotated text, a description field and so control structures.
 */
class AnnotationSidbarElement {
  #element;
  #sidebarElementId;
  #displayElement;
  #hideElement;
  #selectionPreview;
  #annotationID;
  #annotationBody;
  #controls1 = null;
  #controls2 = null;
  #adjust = null;
  #body;
  /* Hover and Click callbacks */
  #mouseoverFunctions = [];
  #mouseoutFunctions = [];
  #clickFunctions = [];

  /**
   * @param {number} annotationID the annotation id
   * @param {Node} quoteContent the selected text in a node.
   * @param {AnnotationSidbar} sidebar the annotation sidebar this element will belong to
   * @param {AnnotationBody} annotationBody annotation body
   */
  constructor(annotationID, quoteContent, annotationBody) {
    // Set id
    this.#annotationID = annotationID;
    this.#sidebarElementId = 'id-' + self.crypto.randomUUID();
    // Create a new element
    this.#element = document.createElement('div');
    this.#element.setAttribute('class', 'annotation-content-element');
    this.#element.setAttribute('id', 'annotationSidebarElement_' + this.annotationID);
    this.#element.setAttribute('tabindex', "-1");
    
    this.#displayElement = document.createElement('div');
    this.#displayElement.setAttribute('class', 'annotation-display-element');

    this.#element.appendChild(this.#displayElement);

    var quote = document.createElement('blockquote');
    // set the content of the quoute
    quote.appendChild(quoteContent);
    this.#displayElement.appendChild(quote);
    // create inner layer for flip-cart
    let inner = document.createElement('div');
    inner.setAttribute('class', 'inner-layer');
    this.#displayElement.appendChild(inner);
    // init controls
    this.#createControlsState1();
    this.#createControlsState2();

    this.#annotationBody = annotationBody;
    annotationBody.registerSidebarElement(this);
    this.#body = this.#annotationBody.createElement();
    // link annotation element
    inner.appendChild(this.#body);

    // set selection adjust
    this.#adjust = this.#selectionAdjust();
    this.#adjust.style.display = "none";
    inner.appendChild(this.#adjust);

    // add Event Handler
    let eventHandler;
    // set annotation id as custom data
    this.#element.dataset.customId = this.annotationID;
    // setup event listener
    this.#element.addEventListener("click", (event) => this.eventCallbackClick(event));
    this.#element.addEventListener("mouseover", (event) => this.eventCallbackMouseover(event));
    this.#element.addEventListener("mouseout", (event) => this.eventCallbackMouseout(event));
    // default click event
    eventHandler = (event) => {
      runtime.clickOnSidebarElement(event);
    };
    this.#clickFunctions.push(eventHandler);
    // default mouse enter event
    eventHandler = (event) => {
      // change color of text highlight
      runtime.eventMouseOverSidebarElement(event, event.currentTarget.dataset.customId);
    };
    this.#mouseoverFunctions.push(eventHandler);
    // default mouse leave event
    eventHandler = (event) => {
      // change color of text highlight back
      runtime.eventMouseOutSidebarElement(event, event.currentTarget.dataset.customId);
    };
    this.#mouseoutFunctions.push(eventHandler);

    if (annotationBody.state === State.Display) {
      this.#displayElement.appendChild(this.#controls2);
    } else {
      this.#displayElement.appendChild(this.#controls1);
    }
  }

  /**
   * Get the coresponding annotation ID
   * 
   * @returns {number} the annotation id
   */
  get annotationID() {
    return this.#annotationID;
  }

  /**
   * Get the save button associated with this element
   * 
   * @returns {Node | null} the save button node or null if not present
   */
  get saveButton() {
    let id, button;
    if (this.#controls1 == null) {
      return null;
    }
    id = this.#sidebarElementId + '-sidebar-save-button';
    id = id.replaceAll('-', '\\-');
    button = this.#controls1.querySelector("#" + id);
    return button;
  }

  /**
   * Get the cancel button for this element
   * 
   * @returns {Node | null} the cancel button node or null if not present
   */
  get cancelButton() {
    let id, button;
    if (this.#controls1 == null) {
      return null;
    }
    id = this.#sidebarElementId + '-sidebar-cancel-button';
    id = id.replaceAll('-', '\\-');
    button = this.#controls1.querySelector("#" + id);
    return button;
  }

  /**
   * Get value for thumb up.
   * 
   * @returns {boolean} true if thumb up, false otherwise
   */
  get thumbUp() {
    if (this.#controls2 == null) {
      return false;
    }
    return this.#controls2.childNodes[0];
  }

  /**
   * Get value for thumb down.
   * 
   * @returns {boolean} true if thumb down, false otherwise
   */
  get thumbDown() {
    if (this.#controls2 == null) {
      return false;
    }
    return this.#controls2.childNodes[1];
  }

  /**
   * @param {AnnotationBody} val 
   */
  set annotationBody(val) {
    let oldBody, newBody;
    // get old body
    oldBody = document.getElementById(this.#annotationBody.bodyID + "-annotation-body");
    // save new body
    this.#annotationBody = val;
    this.#annotationBody.registerSidebarElement(this);

    newBody = this.#annotationBody.createElement();
    this.#displayElement.replaceChild(newBody, oldBody);
  }

  registerHoverCallback(funcOver, funcOut) {
    this.#mouseoverFunctions.push(funcOver);
    this.#mouseoutFunctions.push(funcOut);
  }

  removeHoverCallback(funcOver, funcOut) {
    let index;
    index = this.#mouseoverFunctions.indexOf(funcOver);
    this.#mouseoverFunctions.splice(index, 1);
    index = this.#mouseoutFunctions.indexOf(funcOut);
    this.#mouseoutFunctions.splice(index, 1);
  }

  registerClickCallback(func) {
    this.#clickFunctions.push(func);
  }

  removeClickCallback(func) {
    let index;
    index = this.#clickFunctions.indexOf(func);
    this.#clickFunctions.splice(index, 1);
  }

  eventCallbackMouseover(event){
    this.#mouseoverFunctions.forEach(func => {
      func(event);
    });
  }

  eventCallbackMouseout(event){
    this.#mouseoutFunctions.forEach(func => {
      func(event);
    });
  }

  eventCallbackClick(event){
    this.#clickFunctions.forEach(func => {
      func(event);
    });
  }

  highlight(durationMs) { 
    let elem = this.#element;
    elem.classList.add('highlighted');
    setTimeout(function() {
      elem.classList.remove('highlighted')
    }, durationMs || 2500);
  }

  /**
   * Focus on the text area
   */
  focus() {
    // set focus to annotation body
    this.#element.focus();
    this.highlight();
    // TODO: maybe nicer way?
    runtime.lastFocus = this.#element;
  }

  /**
   * Informs about a target change of the corresponding annotation.
   */
  informFragmentTargetChange() {
    let oldPreview, newPreview;
    // update preview
    oldPreview = this.#selectionPreview;
    newPreview = this.#getCurrentSelectionPreview();
    
    this.#selectionPreview.parentElement.replaceChild(newPreview, oldPreview);
    this.#selectionPreview = newPreview;
  }

  #abstractButtonElement(iconContent, labelContent, callback) {
    let wrapper, button, icon, label, id;

    id = "id-" + self.crypto.randomUUID();

    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-menu-selection');

    button = document.createElement('button');
    button.setAttribute('id', id);
    button.setAttribute('class', 'annotation-menu-selection-button');

    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined');
    icon.textContent = iconContent;
    icon.style.padding = "0px";
    button.appendChild(icon);
    // set callback
    if (callback) {
      button.addEventListener('click', callback);
    }
    
    label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = labelContent;
    label.style.marginRight = "10px";
    label.appendChild(button);
    wrapper.appendChild(label);
    wrapper.appendChild(button);
    return wrapper;
  }

  #reselectText() {
    let iconContent, labelContent, callback;

    iconContent = "select";
    labelContent = "Reselect text fragment:";
    callback = event => runtime.reselectTextFragment(this.#annotationID);
    return this.#abstractButtonElement(iconContent, labelContent, callback);
  }

  #addDiscontinuity() {
    let iconContent, labelContent, callback;

    iconContent = "text_select_start";
    labelContent = "Add a discontinued range:";
    callback = event => runtime.addDiscontinuesTextFragment(this.#annotationID)
    return this.#abstractButtonElement(iconContent, labelContent, callback);
  }

  #adjustLeftBorder1() {
    let wrapper, button, iconContent, labelContent;

    iconContent = "text_select_jump_to_beginning";
    labelContent = "Increase left border";
    wrapper = this.#abstractButtonElement(iconContent, labelContent, null);
    button = wrapper.getElementsByTagName('button')[0];
    //holdit(button, this.annotationID, "start", "left");
    button.onclick = () => runtime.adjustSelection(null, this.annotationID, "start", "left");
    return wrapper
  }

  #adjustLeftBorder2() {
    let wrapper, button, iconContent, labelContent;

    iconContent = "text_select_move_forward_character";
    labelContent = "Decrease left border";
    wrapper = this.#abstractButtonElement(iconContent, labelContent, null);
    button = wrapper.getElementsByTagName('button')[0];
    // holdit(button, this.annotationID, "start", "right");
    button.onclick = () => runtime.adjustSelection(null, this.annotationID, "start", "right");
    return wrapper
  }

  #adjustRightBorder1() {
    let wrapper, button, iconContent, labelContent;

    iconContent = "text_select_jump_to_end";
    labelContent = "Increase right border";
    wrapper = this.#abstractButtonElement(iconContent, labelContent, null);
    button = wrapper.getElementsByTagName('button')[0];
    // holdit(button, this.annotationID, "end", "right");
    button.onclick = () => runtime.adjustSelection(null, this.annotationID, "end", "right");
    return wrapper
  }

  #adjustRightBorder2() {
    let wrapper, button, iconContent, labelContent;

    iconContent = "text_select_move_back_character";
    labelContent = "Decrease right border";
    wrapper = this.#abstractButtonElement(iconContent, labelContent, null);
    button = wrapper.getElementsByTagName('button')[0];
    // holdit(button, this.annotationID, "end", "left");
    button.onclick = () => runtime.adjustSelection(null, this.annotationID, "end", "left");
    return wrapper
  }

  #recursiveNodeIteration(node, positionFlag, range, startNodeRange, endNodeRange, startOffset, endOffset, startAfterNodeFlag, endAfterNodeFlag, prev1, prev2, prev3) {
    let currentNodeIsStart, currentNodeIsEnd;
    // base case (but should not appear)
    if (node === undefined) {
      return positionFlag;
    }

    currentNodeIsStart = false;
    currentNodeIsEnd = false;

    // compare current node to range
    if (node.isSameNode(startNodeRange) && node.isSameNode(endNodeRange)) {
      if (node.nodeType !== Node.TEXT_NODE) {
        if (endAfterNodeFlag === true) {
          prev2.textContent += "<" + node.tagName.toLowerCase() + ">";
          positionFlag = 0;
          currentNodeIsEnd = true;
        } else {
          console.warn('Start and End Node should not be the same');
        }        
      } else {
        prev1.textContent += node.textContent.substring(0, startOffset);
        prev2.textContent += node.textContent.substring(startOffset, endOffset);
        prev3.textContent += node.textContent.substring(endOffset);
        // indicate that we are currently outside the selected range
        positionFlag = 1;
      }
    } else if (node.isSameNode(startNodeRange)) {
      if (node.nodeType === Node.TEXT_NODE) {
        prev1.textContent += node.textContent.substring(0, startOffset);
        prev2.textContent += node.textContent.substring(startOffset);
        // indicate that we are currently inside the selected range
        positionFlag = 0;
      } else {
        if (startAfterNodeFlag) {
          prev1.textContent += "<" + node.tagName.toLowerCase() + ">";
          currentNodeIsStart = true;
        } else {
          prev2.textContent += "<" + node.tagName.toLowerCase() + ">";
          // indicate that we are currently inside the selected range
          positionFlag = 0;
        } 
      }
    } else if (node.isSameNode(endNodeRange)) {
      if (node.nodeType === Node.TEXT_NODE) {
        prev2.textContent += node.textContent.substring(0, endOffset);
        prev3.textContent += node.textContent.substring(endOffset);
        positionFlag = 1;
      } else if (endAfterNodeFlag) {
        if (positionFlag === 0) {
          prev2.textContent += "<" + node.tagName.toLowerCase() + ">";
        } else {
          prev1.textContent += "<" + node.tagName.toLowerCase() + ">";
        }
        currentNodeIsEnd = true;
      } else {
        prev3.textContent += "<" + node.tagName.toLowerCase() + ">";
        positionFlag = 1;
      }
    } else if (!node.tagName || node.tagName.toUpperCase() !== "ANNOTATION-HIGHLIGHT") {
      // skip "ANNOTATION-HIGHLIGHT" elements in preview as they do not appear in the original document
      let prevText;
      // get the preview text of the current node
      if (node.nodeType === Node.TEXT_NODE) {
        prevText = node.textContent;
      } else {
        prevText = "<" + node.tagName.toLowerCase() + ">";
      }
      // set text to correct preview object
      switch (positionFlag) {
        case -1:
          prev1.textContent += prevText;
          break;
        case 0:
          prev2.textContent += prevText;
          break;
        case 1:
          prev3.textContent += prevText;
          break;
      }
    }

    // recursive call
    if (node.hasChildNodes()) {
      let chList = Array.from(node.childNodes);
      // depth first search
      for (let ch of chList) {
        positionFlag = this.#recursiveNodeIteration(ch, positionFlag, range, startNodeRange, endNodeRange, startOffset, endOffset, startAfterNodeFlag, endAfterNodeFlag, prev1, prev2, prev3);
      }
    }

    // set closing tag
    if (node.nodeType !== Node.TEXT_NODE && node.tagName && node.tagName.toUpperCase() !== "ANNOTATION-HIGHLIGHT") {
       // set text to correct preview object
       switch (positionFlag) {
        case -1:
          prev1.textContent += "</" + node.tagName.toLowerCase() + ">";
          break;
        case 0:
          prev2.textContent += "</" + node.tagName.toLowerCase() + ">";
          break;
        case 1:
          prev3.textContent += "</" + node.tagName.toLowerCase() + ">";
          break;
      }
    }
    
    // handle "after-node" xpath
    if (currentNodeIsStart) {
      positionFlag = 0;
    }
    if (currentNodeIsEnd) {
      positionFlag = 1;
    }

    return positionFlag;
  }

  /**
   * Returns a preview of the currently selected html elements.
   * @returns {HTMLDivElement} the preview element
   */
  #getCurrentSelectionPreview() {
    let wrapper, prev1, prev2, prev3;
    let xPathStart, xPathEnd;
    let startNodeRange, endNodeRange, startAfterNodeFlag, endAfterNodeFlag, startOffset, endOffset;
    let range, outer;

    wrapper = document.createElement('div');
    prev1 = document.createElement('span');
    prev2 = document.createElement('span');
    prev3 = document.createElement('span');
    wrapper.appendChild(prev1);
    wrapper.appendChild(prev2);
    wrapper.appendChild(prev3);

    prev1.style.color = "lightgray";
    prev3.style.color = "lightgray";

    xPathStart = runtime.getAnnotationById(this.#annotationID).target.pathSelector.startPath;
    xPathEnd = runtime.getAnnotationById(this.#annotationID).target.pathSelector.endPath;

    range = getRangeToXPath(xPathStart, xPathEnd);

    outer = range.commonAncestorContainer.parentElement;
    while (outer !== null && outer.tagName.toUpperCase() === "ANNOTATION-HIGHLIGHT") {
      outer = outer.parentElement;
    }

    startAfterNodeFlag = false;
    endAfterNodeFlag = false;

    startOffset = range.startOffset;
    endOffset = range.endOffset;

    // get start node of range
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      startNodeRange = range.startContainer;
    } else {
      // use childNodes (not .children) to get all Nodes
      if (range.startOffset < range.startContainer.childNodes.length) {
        startNodeRange = range.startContainer.childNodes[range.startOffset];
      } else {
        startNodeRange = range.startContainer.childNodes[range.startOffset - 1];
        startAfterNodeFlag = true;
      }
      startOffset = 0;
    }
    // get end node of range
    if (range.endContainer.nodeType === Node.TEXT_NODE) {
      endNodeRange = range.endContainer;
    } else {
      // use childNodes (not .children) to get all Nodes
      if (range.endOffset < range.endContainer.childNodes.length) {
        endNodeRange = range.endContainer.childNodes[range.endOffset];
      } else {
        endNodeRange = range.endContainer.childNodes[range.endOffset - 1];
        endAfterNodeFlag = true;
      }
      endOffset = 0;
    }
    this.#recursiveNodeIteration(outer, -1, range, startNodeRange, endNodeRange, startOffset, endOffset, startAfterNodeFlag, endAfterNodeFlag, prev1, prev2, prev3);

    // hide parts of string if to long
    if (prev1.textContent.length > 15) {
      prev1.textContent = prev1.textContent.slice(0, 5) + "..." + prev1.textContent.slice(-5);
    }
    if (prev2.textContent.length > 15) {
      // prev2.textContent = prev2.textContent.slice(0, 5) + "..." + prev2.textContent.slice(-5);
    }
    if (prev3.textContent.length > 15) {
      prev3.textContent = prev3.textContent.slice(0, 5) + "..." + prev3.textContent.slice(-5);
    }
    return wrapper;
  }

  #selectionAdjust() {
    let wrapper, p, hline;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', "annotation-selection");

    hline = document.createElement('div');
    hline.setAttribute('class', 'hline');
    wrapper.appendChild(hline);

    this.#selectionPreview = this.#getCurrentSelectionPreview();
    wrapper.appendChild(this.#selectionPreview);

    p = document.createElement('p');
    p.textContent = 'Update Selection:';
    p.style.fontWeight = "bold";
    wrapper.appendChild(p);

    wrapper.appendChild(this.#reselectText());
    wrapper.appendChild(this.#addDiscontinuity());

    p = document.createElement('p');
    p.textContent = 'Adjust Selection:';
    p.style.fontWeight = "bold";
    wrapper.appendChild(p);

    p = document.createElement('p');
    p.textContent = '• Left Border:';
    p.style.fontWeight = "bold";
    p.style.fontSize = "14px";
    wrapper.appendChild(p);

    wrapper.appendChild(this.#adjustLeftBorder1());
    wrapper.appendChild(this.#adjustLeftBorder2());

    p = document.createElement('p');
    p.textContent = '• Right Border:';
    p.style.fontWeight = "bold";
    p.style.fontSize = "14px";
    wrapper.appendChild(p);

    wrapper.appendChild(this.#adjustRightBorder1());
    wrapper.appendChild(this.#adjustRightBorder2());

    hline = document.createElement('div');
    hline.style.marginTop = "10px";
    hline.setAttribute('class', 'hline');
    wrapper.appendChild(hline);

    return wrapper;
  }

  #toggleSelectionAdjust(event) {
    if (this.#adjust.style.display === "block") {
      this.#adjust.style.display = "none";
      this.#body.style.display = "block";
      event.target.textContent = "Adjust";
    } else {
      this.#adjust.style.display = "block";
      this.#body.style.display = "none";
      event.target.textContent = "Body";
    }
    
  }

  /**
   * Create the save button and add event listener.
   * 
   * @returns {Node} save button 
   */
  #createSaveButton() {
    let saveButton;
    saveButton = document.createElement('button');
    saveButton.setAttribute('class', 'control-button-save save-annotation-creation');
    saveButton.setAttribute('id', this.#sidebarElementId + '-sidebar-save-button');
    saveButton.textContent = 'Save';
    saveButton.addEventListener('click', (event) => ((arg) => {
      runtime.saveAnnotationEvent(event, arg);
    })(this.annotationID));
    saveButton.disabled = true;

    return saveButton;
  }

  /**
   * Create the cancel button for element creation.
   * 
   * @returns {Node} cancel button 
   */
  #createCancelButtonCreation() {
    let cancelButton;
    cancelButton = document.createElement('button');
    cancelButton.setAttribute('class', 'control-button-cancel creation');
    cancelButton.setAttribute('id', this.#sidebarElementId + '-sidebar-cancel-button');
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', event => runtime.deleteAnnotationEvent(event, this.annotationID));
  
    return cancelButton;
  }

  /**
   * Create the cancel button for element edit.
   * 
   * @returns {Node} cancel button 
   */
  #createCancelButtonEdit() {
    let cancelButton;
    cancelButton = document.createElement('button');
    cancelButton.setAttribute('class', 'control-button-cancel edit');
    cancelButton.setAttribute('id', this.#sidebarElementId + '-sidebar-cancel-button');
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', event => this.cancelEdit());
  
    return cancelButton;
  }

  /**
   * Create the adjust button and add event listener.
   * 
   * @returns {Node} adjust selection button 
   */
  #adjustButton() {
    let adjustButton;
    adjustButton = document.createElement('button');
    adjustButton.setAttribute('class', 'control-button-adjust');
    adjustButton.setAttribute('id', this.bodyID + '-sidebar-adjust-button');
    adjustButton.textContent = 'Adjust';
    adjustButton.addEventListener('click', event => this.#toggleSelectionAdjust(event));
    return adjustButton;
  }

  /**
   * Create the control structure for the first state (save and cancel button)
   * 
   * @returns {Node} control structure
   */
  #createControlsState1() {
    let div;
    let save, adjust, cancel;
    // create control element
    this.#controls1 = document.createElement('div');
    this.#controls1.setAttribute('class', 'control-group');
    // create save  and cancel
    div = document.createElement('div');
    save = this.#createSaveButton();
    adjust = this.#adjustButton();
    cancel = this.#createCancelButtonCreation();
    // link control elements
    div.appendChild(save);
    div.appendChild(adjust);
    div.appendChild(cancel);
    this.#controls1.appendChild(div);
  }

  /**
   * Create the thumbUp button.
   * 
   * @returns {Node} thumb up
   */
  #createThumbUp() {
    let thumbUp;
    thumbUp = document.createElement('i');
    thumbUp.setAttribute('class', 'material-symbols-outlined material-symbols-hover');
    thumbUp.textContent = "thumb_up";
    thumbUp.addEventListener("click", function (event) {
      if (!event.target.classList.contains('thumb-up')) {
        event.target.classList.add('thumb-up');
        event.target.nextSibling.classList.remove('thumb-down');
      } else {
        event.target.classList.remove('thumb-up');
      }
  	});
    return thumbUp;
  }

  /**
   * Create the thumbDown button.
   * 
   * @returns {Node} thumb down
   */
  #createThumbDown() {
    let thumbDown;
    thumbDown = document.createElement('i');
    thumbDown.setAttribute('class', 'material-symbols-outlined material-symbols-hover');
    thumbDown.textContent = "thumb_down";
    thumbDown.addEventListener("click", function (event) {
      if (!event.target.classList.contains('thumb-down')) {
        event.target.classList.add('thumb-down');
        event.target.previousSibling.classList.remove('thumb-up');
      } else {
        event.target.classList.remove('thumb-down');
      }
    });
    return thumbDown;
  }

  /**
   * Create the edit button.
   * 
   * @returns {Node} edit
   */
  #createEdit() {
    let edit;
    edit = document.createElement('i');
    edit.setAttribute('class', 'material-symbols-outlined material-symbols-hover');
    edit.style.float = "right";
    edit.textContent = "edit";
    edit.addEventListener("click", (event) => ((arg) => {
      runtime.editAnnotation(event, arg);
    })(this.annotationID));
    return edit;
  }

  /**
   * Create the delete button.
   * 
   * @returns {Node} delete
   */
  #createDelete() {
    let del;
    del = document.createElement('i');
    del.setAttribute('class', 'material-symbols-outlined material-symbols-hover');
    del.style.float = "right";
    del.textContent = "delete";
    del.addEventListener("click", event => runtime.deleteAnnotationEvent(event, this.annotationID));
    return del;
  }

  /**
   * Create the controls for state 2 (reactions and edit/delete)
   * 
   * @returns {Node} control structure
   */
  #createControlsState2() {
    let thumbUp, thumbDown, edit, del;
    // Surrounding div container
    this.#controls2 = document.createElement('div');
    this.#controls2.setAttribute('class', 'annotation-options');
    
    thumbUp = this.#createThumbUp();
    thumbDown = this.#createThumbDown();
    edit = this.#createEdit();
    del = this.#createDelete();
    
    this.#controls2.appendChild(thumbUp);
    this.#controls2.appendChild(thumbDown);
    this.#controls2.appendChild(del);
    this.#controls2.appendChild(edit);
  }

  /**
   * Set the quoted text content
   * @param {Node} quote 
   */
  setQuote(quote) {
    quote.style.height = "3em";
    if (quote.clientHeight < quote.scrollHeight) {
      let more = document.createElement('div');
      more.setAttribute('class', 'annotation-quote-more');
      more.textContent = "More";
      more.addEventListener('click', (event) => {
        if (event.target.textContent === 'More') {
          event.target.parentElement.firstChild.style.removeProperty('height');
          event.target.textContent = 'Less';
        } else {
          event.target.parentElement.firstChild.style.height = "3em";
          event.target.textContent = 'More';
        }
      });
      quote.parentElement.appendChild(more);
    } else {
      quote.style.removeProperty('height');
    }
  }

  /**
   * Removes this element.
   */
  remove() {
    this.#element.remove();
  }

  /**
   * Get the element node connected with this class.
   * 
   * @returns {Node} the element node
   */
  toNode() {
    return this.#element;
  }

  /**
   * Saves the user description of the element and adds reactions (thumbup / thumbdown)
   */
  save() {
    let oldBody, newBody;
    // reset adjust button
    document.getElementById(this.bodyID + '-sidebar-adjust-button').textContent = "Adjust";
    // show body
    this.#adjust.style.display = "none";
    this.#body.style.display = "block";

    this.#annotationBody.save();
    // Create new annotation body and replace with old
    /*
    oldBody = document.getElementById(this.#annotationBody.bodyID + "-annotation-body");
    newBody = this.#annotationBody.createElement();
    oldBody.parentElement.replaceChild(newBody, oldBody);
    */
    this.#annotationBody.createElement();
    // Add new Icons for Delete, Edit, Vote
    this.#controls1.parentNode.replaceChild(this.#controls2, this.#controls1);
    runtime.eventMouseOutSidebarElement(null, this.#annotationID);
  }

  /**
   * Allows the user to edit the description of the element.
   */
  edit() {
    let oldBody, newBody;

    // change body to edit state
    this.#annotationBody.edit();
    // Create new annotation body and replace with old
    /*
    oldBody = document.getElementById(this.#annotationBody.bodyID + "-annotation-body");
    newBody = this.#annotationBody.createElement();
    oldBody.parentElement.replaceChild(newBody, oldBody);
    */
    this.#annotationBody.createElement();
  
    // replace control elements
    this.#controls2.parentNode.replaceChild(this.#controls1, this.#controls2);
    // change class of cancel so element is not deleted on edit cancel
    const cancel = this.cancelButton;
    if (this.#annotationBody.validState == false && cancel.matches('.edit')) {
      cancel.parentElement.replaceChild(this.#createCancelButtonCreation(), cancel);
    }
    else if (this.#annotationBody.validState == true && cancel.matches('.creation')) {
      cancel.parentElement.replaceChild(this.#createCancelButtonEdit(), cancel);
    }
  }

  /**
   * Cancel the edit process
   */
  cancelEdit() {
    let oldBody, newBody;
    // cancel adjust selection (if present)
    runtime.cancelReselect();
    runtime.cancelAddDicontinuity();
    // show body
    this.#adjust.style.display = "none";
    this.#body.style.display = "block";
    // Set state to save
    this.#annotationBody.cancel();
    // Create new annotation body and replace with old
    /*
    oldBody = document.getElementById(this.#annotationBody.bodyID + "-annotation-body");
    newBody = this.#annotationBody.createElement();
    oldBody.parentElement.replaceChild(newBody, oldBody);
    */
    this.#annotationBody.createElement();
    // replace control elements
    this.#controls1.parentNode.replaceChild(this.#controls2, this.#controls1);
    runtime.eventMouseOutSidebarElement(null, this.#annotationID);
  }

  resetAnnotation() {
    const cancel = this.cancelButton;
    cancel.parentElement.replaceChild(this.#createCancelButtonCreation(), cancel);
    this.saveEnabled(false);
  }

  /**
   * Adds GUI highlight.
   * Adds a yellow border and changes background of element.
   */
  addGUIHighlight() {
    this.#element.style.border = "solid 3px #FFFFAA";
    this.#element.style.backgroundColor = "#FFFFFA";
  }

  /**
   * Removes GUI highlight.
   * Removes the border (sets it to white to don't change size of div) and changes background to white.
   */
  removeGUIHighlight() {
    this.#element.style.border = "solid 3px #FFFFFF";
    this.#element.style.backgroundColor = "#FFFFFF";
  }

  /**
   * Hides the element from the sidebar
   */
  hide() {
    this.#displayElement.style.display = "none";
  }

  /**
   * Shows the element on the sidebar
   */
  unhide() {
    this.#displayElement.style.display = "block";
  }

  /**
   * The annotation body has changed.
   * Enable 'Save' Button if not already enabled.
   * @param {boolean} val indicates if save should be enabled
   */
  saveEnabled(val) {
    this.saveButton.disabled = !val;
  }
}

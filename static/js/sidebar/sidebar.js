/**
 * Sidebar for the annotation tool.
 * The sidebar displays all currently annotated elements and provides tools to edit them.
 */
class AnnotationSidebar {
  #sidebar;
  #heading;
  #sidebarContent;
  #sidebarToggleButton;
  #isMouseOverSidebar = false;
  #sidebarCollapsed = true;
  #elements;
  #hideabel;            // flag if sidebar can be hidden
  #headerHeight = 50;   // initial height of the header

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
    
    const menu = SidebarHamburgerMenu.create();

    this.#heading.appendChild(this.#sidebarToggleButton);
    this.#heading.appendChild(heading);
    this.#heading.appendChild(menu);
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

  /**
   * Activate the sidebar (multi documents).
   */
  activate() {
    // set text width
    document.body.style.removeProperty('width');
    document.body.style.width = document.body.clientWidth - 425 + 'px';
    // set sidebar
    document.body.appendChild(this.#sidebar);
    // update template menu
    if (ATSettings.useAnnotationTemplate) {
      this.showTemplateMenu();
      for (let i = 0; i < 5; ++i) {
        const ct = settingsPlugin.rapidTab.conceptTemplates[i];
        if (ct || i === 0) {
          this.enableTemplateNumber(i+1);
        } else {
          this.disableTemplateNumber(i+1);
        }
      }
      this.selectTemplate(ATSettings.currentTemplateNumber + 1);
    } else {
      this.hideTemplateMenu();
    }
  }

  /**
   * Deactivate the sidebar (multi documents).
   */
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

  /**
   * Switch to previous document.
   * @param {number} number document number
   * @returns 
   */
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

  /**
   * Switch to next document.
   * @param {number} number document number
   * @returns 
   */
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
    SidebarHamburgerMenu.updatePosition("70px");
    this.#headerHeight += 20;
    this.#sidebarContent.style.height = `calc(100% - ${this.#headerHeight}px)`;
    this.#heading.appendChild(back);
    this.#heading.appendChild(text);
    this.#heading.appendChild(forward); 
  }

  /**
   * Get the sidebar element for the given annotation-id
   * @param {string} annotationID the annotation id of the element
   * @returns {AnnotationSidebarElement}
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
    this.openSidebar();
    elem.focus();
    return;
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
   * @param {AnnotationBody} the annotation body
   * @param {Boolean} silent add the element silent (i.e. does not open sidebar / focus)
   */
  addElement(annotationID, annotationBody, silent=false) {
    let element;
    // open the sidebar so user can save/cancel annotation
    if (!silent) {
      this.openSidebar();
    }
    // create the object
    element = new AnnotationSidebarElement(annotationID, annotationBody);
    //link element to sidebar
    this.#sidebarContent.appendChild(element.toNode());
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
    // increase header height and set content height accordingly
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

  deselectTemplate() {
    let buttons;
    buttons = document.getElementsByClassName("template-selector");
    // remove button highlight
    for (let button of buttons) {
      button.classList.remove('selected');
    }
    // set template number to 'unused'
    ATSettings.currentTemplateNumber = -1; //MAGIC_TEMPLATE_NUMBER;
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
    ATSettings.currentTemplateNumber = number - 1;
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
}
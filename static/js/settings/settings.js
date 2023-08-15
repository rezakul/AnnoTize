class SettingsOptions {
  // the creator id
  #creator;
  #creators = new Map();
  // general rapid-mode options
  #removeTrailingWhitespaces = false;
  #showAnnotationPopup = true;
  #updateInteractedAnnotationsWithClick = true;
  // template number for rapid mode
  #currentTemplateNumber = null;
  // style options
  #useImportAnnotationStyle = false;
  #importAnnotationStyle = 'default';
  #useCreatorAnnotationStyle = false;
  #useTypeAnnotationStyle = true;
  #creatorPriority = false;

  constructor() {
    this.#creator = "urn:uuid:" + self.crypto.randomUUID();
    // save creator in map
    this.#creators.set(this.#creator, new Creator(this.#creator));
  }

  /**
   * The creator id of annotations created by the user.
   * @returns {string}
   */
  get creator() {
    return this.#creator;
  }

  set creator(val) {
    // should only be called if no annotation was created yet.
    this.creators.delete(this.#creator);
    // set new creator
    this.#creator = val;
    this.#creators.set(this.#creator, new Creator(this.#creator));
  }

  /**
   * The Map of all registered creators
   * @returns {Map<string,Creator>}
   */
  get creators() {
    return this.#creators;
  }
  

  /**
   * Show the 'Annotate' Popup when user selects a text-fragment.
   * @returns {boolean}
   */
  get showAnnotationPopup() {
    return this.#showAnnotationPopup;
  }

  set showAnnotationPopup(val) {
    this.#showAnnotationPopup = val;
  }

  /**
   * Remove tailing whitespaces from selection.
   * @returns {boolean}
   */
  get removeTrailingWhitespaces() {
    return this.#removeTrailingWhitespaces;
  }

  set removeTrailingWhitespaces(val) {
    this.#removeTrailingWhitespaces = val;
  }

  /* ---------------- Currently used template parameter -------------------- */

  /**
   * The number of the template currently used (null if none is used)
   * @returns {number}
   */
  get currentTemplateNumber() {
    return this.#currentTemplateNumber;
  }
  
  set currentTemplateNumber(val) {
    this.#currentTemplateNumber = val;
  }

  /**
   * Save the annotation immediately (if possible)
   * @returns {boolean}
   */
  get saveOnCreation() {
    if (this.#currentTemplateNumber !== null) {
      return settingsPlugin.rapidTab.conceptTemplatesSaveOnCreation[this.#currentTemplateNumber];
    }
    return false;
  }

  /**
   * Flag if annotation templates are currently used
   * @returns {boolean}
   */
  get useAnnotationTemplate() {
    return this.#currentTemplateNumber !== null;
  }

  /**
   * The current annotation template.
   */
  get annotationTemplate() {
    if (this.#currentTemplateNumber === null) {
      return null;
    }
    return settingsPlugin.rapidTab.conceptTemplates[this.#currentTemplateNumber];
  }

  /**
   * Show a header for a new annotation in the sidebar
   * @returns {boolean}
   */
  get showHeader() {
    if (this.#currentTemplateNumber === null) {
      return true;
    }
    return settingsPlugin.rapidTab.conceptTemplatesShowHeader[this.#currentTemplateNumber];
  }

  /**
   * Update the last interacted annotation id if the user clicks on an annotation
   * @returns {boolean}
   */
  get updateInteractedAnnotationsWithClick() {
    return this.#updateInteractedAnnotationsWithClick;
  }

  set updateInteractedAnnotationsWithClick(value) {
    this.#updateInteractedAnnotationsWithClick = value;
  }

  /* ------------------ Style parameters --------------- */

  /**
   * Overwrite the annotation style for annotation imports.
   * @returns {boolean}
   */
  get useImportAnnotationStyle() {
    return this.#useImportAnnotationStyle;
  }

  set useImportAnnotationStyle(val) {
    this.#useImportAnnotationStyle = val;
  }

  /**
   * The annotation style for imports.
   * @returns {AnnotationStyle}
   */
  get importAnnotationStyle() {
    return this.#importAnnotationStyle;
  }

  set importAnnotationStyle(val) {
    this.#importAnnotationStyle = val;
  }

  /**
   * Define an annotation style for a specific creator.
   * @returns {boolean}
   */
  get useCreatorAnnotationStyle() {
    return this.#useCreatorAnnotationStyle;
  }

  set useCreatorAnnotationStyle(val) {
    this.#useCreatorAnnotationStyle = val;
  }

  /**
   * Define an annotation style for a specific concept type.
   * @returns {boolean}
   */
  get useTypeAnnotationStyle() {
    return this.#useTypeAnnotationStyle;
  }

  set useTypeAnnotationStyle(val) {
    this.#useTypeAnnotationStyle = val;
  }

  /**
   * If creator has priority over the cocnept for style
   * @returns {boolean}
   */
  get creatorPriority() {
    return this.#creatorPriority;
  }

  set creatorPriority(val) {
    this.#creatorPriority = val;
  }
}

class SettingsMenu {
  #tabs = new Map();
  #menu;
  #currentTab;
  #options;

  constructor () {
    this.#menu = null;
    this.#tabs.set('General', new GeneralTab());
    this.#tabs.set('ABoSpecs', new ConceptsTab());
    this.#tabs.set('Rapid Mode', new RapidModeTab());
    this.#tabs.set('Annotation Style', new StyleTab());
    // start with general tab
    this.#currentTab = 'General';
    // init options
    this.#options = new SettingsOptions();
  }

  /**
   * Get the settings options holding additional settings information
   * @returns {SettingsOptions}
   */
  get options() {
    return this.#options;
  }

  /**
   * Get all registered tabs.
   * @returns {Map<string, AbstractSettingsTab>}
   */
  get tabs() {
    return this.#tabs;
  }

  /**
   * Get all tab names
   */
  get tabNames() {
    return Array.from(this.tabs.keys());
  }

  /**
   * Get all tab classes
   */
  get tabClasses() {
    return Array.from(this.tabs.values());
  }

  get currentTab() {
    return this.#currentTab;
  }

  set currentTab(val) {
    this.#currentTab = val;
  }

  /**
   * The tab for the rapid-mode
   * @returns {RapidModeTab}
   */
  get rapidTab() {
    return this.getTabById('Rapid Mode');
  }

  /**
   * Get the tab for the id
   * @param {string} id 
   * @returns {AbstractSettingsTab | undefined}
   */
  getTabById(id) {
    if (!this.tabs.has(id)) {
      console.warn('Settings-Tab with id not found: ', id);
      return;
    }
    return this.tabs.get(id);
  }

  /**
   * Open the settings menu
   */
  openSettingsMenu() {
    if (this.#menu) {
      return;
    }
    this.#menu = this.#createMenuSkeleton();
    document.body.appendChild(this.#menu);
  }

  /**
   * Closes the settings menu
   */
  closeSettingsMenu() {
    if (!this.#menu) {
      return;
    }
    for (let tab of this.tabClasses) {
      tab.close();
    }
    document.body.removeChild(this.#menu);
    this.#menu = null;
    this.#currentTab = 'General';
  }

  /**
   * Set the menu content
   * @param {Node} data the content to show
   */
  setContent(data) {
    let content;
    content = document.getElementById('app-content');
    if (!content) {
      return;
    }
    content.replaceChildren();
    content.appendChild(data);
  }

  /**
   * Refresh the menu content
   */
  refresh() {
    if (!this.#menu) {
      return;
    }
    for (let tab of this.tabClasses) {
      tab.close();
    }
    this.setContent(this.getTabById(this.#currentTab).createContent());
  }

  #selectTabEvent(event) {
    let ul, elem;
    let tab;
    if (event.currentTarget.matches('.active')) {
      // already active -> nothing to do
      return;
    }
    // change active element
    ul = document.getElementById('app-nav-list');
    elem = ul.getElementsByTagName('li');
    for (let el of elem) {
      el.classList.remove('active');
    }
    event.currentTarget.classList.add('active');
    // show settings content
    tab = this.getTabById(event.currentTarget.dataset.tabId);
    // close current tab
    this.getTabById(this.currentTab).close();
    // save current tab
    this.currentTab = event.currentTarget.dataset.tabId;
    this.setContent(tab.createContent());
  }

  #createMenuHeader() {
    let header, icon, close, title;
    header = document.createElement('div');
    header.setAttribute('class', 'app-header');

    icon = document.createElement('i');
    icon.setAttribute('class', 'material-symbols-outlined icon prevent-select');
    icon.textContent = "format_ink_highlighter";
    header.appendChild(icon);

    title = document.createElement('h1');
    title.setAttribute('class', 'header-title prevent-select');
    title.textContent = "| Settings";
    header.appendChild(title);

    close = document.createElement('i');
    close.setAttribute('class', 'material-symbols-outlined material-symbols-hover close prevent-select');
    close.textContent = "close";
    close.addEventListener("click", (event) => { runtime.settings.closeSettingsMenu() });
    header.appendChild(close);

    return header;
  }

  #createMenuNavigation() {
    let navigation, ul;
    navigation = document.createElement('div');
    navigation.setAttribute('class', 'app-nav prevent-select');

    ul = document.createElement('ul');
    ul.setAttribute('id', 'app-nav-list');
    navigation.appendChild(ul);
    for (let tab of this.tabNames) {
      let li, span;
      li = document.createElement('li');
      li.dataset.tabId = tab;
      if (tab === 'General') {
        li.classList.add('active');
      }
      li.addEventListener('click', event => this.#selectTabEvent(event));
      ul.appendChild(li);

      span = document.createElement('span');
      span.textContent = tab;
      li.appendChild(span);
    }
    return navigation;
  }

  #createMenuSkeleton() {
    let menu, content;
    menu = document.createElement('div');
    menu.setAttribute('class', 'app-settings');
    
    menu.appendChild(this.#createMenuHeader());
    menu.appendChild(this.#createMenuNavigation());

    content = document.createElement('div');
    content.setAttribute('id', 'app-content');
    content.setAttribute('class', 'app-content');
    content.appendChild(this.getTabById(this.#currentTab).createContent());
    menu.appendChild(content);

    return menu;
  }
}

const settingsPlugin = new SettingsMenu();
class SidebarHamburgerMenu {

  /**
   * Creates an hamburger menu to access upload/download and settings.
   * 
   * @returns {HTMLDivElement} menu entry
   */
  static create() {
    let wrapper, wrapperMenu, menu, content;
    wrapper = document.createElement('div');
    wrapper.setAttribute('id', 'sidebar-hamburger-menu');
    wrapper.setAttribute('class', 'annotation-menu');
    wrapperMenu = document.createElement('div');
    wrapperMenu.setAttribute('class', 'annotation-menu-button');
  
    menu = document.createElement('i');
    menu.setAttribute('class', 'material-symbols-outlined material-symbols-hover');
    menu.textContent = "menu";
    menu.addEventListener("click", (event) => SidebarHamburgerMenu.toggleMenu(event));
    document.addEventListener("click", (event) => SidebarHamburgerMenu.closeMenu(event));
    wrapperMenu.appendChild(menu);
    wrapper.appendChild(wrapperMenu);
    content = SidebarHamburgerMenu.#initializeMenu();
    wrapper.appendChild(content);
    return wrapper;
  }
  
  /**
   * Update the position of the menu.
   * @param {string} top the new top position in pixels.
   */
  static updatePosition(top) {
    document.getElementById('sidebar-hamburger-menu').style.top = top;
  }

  /**
   * Initialize the menu content
   * @returns {HTMLDivElement}
   */
  static #initializeMenu() {
    let wrapper;
  
    wrapper = document.createElement('div');
    wrapper.setAttribute('id', 'sidebar-hamburger-menu-content');
    wrapper.setAttribute('class', 'annotation-menu-content');
    wrapper.appendChild(SidebarHamburgerMenu.#createUpload());
    wrapper.appendChild(SidebarHamburgerMenu.#createDownload());
    wrapper.appendChild(SidebarHamburgerMenu.#uploadABoSpecs());
    wrapper.appendChild(SidebarHamburgerMenu.#createTagSetMenuButton());
    wrapper.appendChild(SidebarHamburgerMenu.#createSettingsButton());
    return wrapper;
  }  
  
  /**
   * Creates an upload button.
   * 
   * @returns {HTMLDivElement} upload entry
   */
  static #createUpload() {
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
   * @returns {HTMLDivElement} download entry
   */
  static #createDownload() {
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
  static #uploadABoSpecs() {
    let upload, text, wrapper;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'menu-content-element');
    wrapper.addEventListener("click", event => ATABoSpecs.uploadABoSpecs(event));

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
   * @returns {HTMLDivElement} tag set entry
   */
  static #createTagSetMenuButton() {
    let tagset, text, wrapper;
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'menu-content-element');
    wrapper.addEventListener("click", (event) => {runtime.settings.openTagMenu()});
  
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
   * @returns {HTMLDivElement} settings entry
   */
  static #createSettingsButton() {
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
  
  static toggleMenu(event) {
    document.getElementById('sidebar-hamburger-menu-content').classList.toggle("show");
    event.stopPropagation();
  }
  
  static closeMenu(event) {
    document.getElementById('sidebar-hamburger-menu-content').classList.remove("show");
  }
}
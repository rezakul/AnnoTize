class AdvancedSelectPluginOld extends AnnotationPlugin {
  #advancedSelectObjects;

  constructor() {
    super('AdvancedSelect', '', '', null);
    this.supportUserCreation = false;
    this.supportUserEdit = true;
    // setup private members
    this.#advancedSelectObjects = new Map();
    // init default selects
    for (let initSelect of default_selects) {
      let advSelect = new AdvancedSelect(initSelect.id, initSelect.options);
      this.addSelect(advSelect);
    }
  }

  hasSelectForId(id) {
    return this.#advancedSelectObjects.has(id);
  }

  getSelectForId(id) {
    if (!this.hasSelectForId(id)) {
      console.warn('Select with id not found:', id);
    }
    return this.#advancedSelectObjects.get(id);
  }

  /**
   * 
   * @param {AdvancedSelect} selectObj 
   * @returns 
   */
  addSelect(selectObj) {
    if (this.#advancedSelectObjects.has(selectObj.id)) {
      console.warn('Select with id already present:', id);
      return;
    }
   this.#advancedSelectObjects.set(selectObj.id, selectObj);
  }
}

function initializeAdvancedSelectPlugin() {
  let plugin;
  plugin = new AdvancedSelectPlugin();
  plugin.registerPlugin();
}

// initializeAdvancedSelectPlugin();

/** --------------- New Advanced Select Plugin ------------------------- */

class AdvancedSelectPlugin {
  #advancedSelectObjects;

  constructor() {
    // setup private members
    this.#advancedSelectObjects = new Map();
    // init default selects
    for (let initSelect of default_selects) {
      let advSelect = new AdvancedSelect(initSelect.id, initSelect.options);
      this.addSelect(advSelect);
    }
  }

  hasSelectForId(id) {
    return this.#advancedSelectObjects.has(id);
  }

  getSelectForId(id) {
    if (!this.hasSelectForId(id)) {
      console.warn('Select with id not found:', id);
    }
    return this.#advancedSelectObjects.get(id);
  }

  /**
   * 
   * @param {AdvancedSelect} selectObj 
   * @returns 
   */
  addSelect(selectObj) {
    if (this.#advancedSelectObjects.has(selectObj.id)) {
      console.warn('Select with id already present:', id);
      return;
    }
   this.#advancedSelectObjects.set(selectObj.id, selectObj);
  }
}

const advancedSelectPlugin = new AdvancedSelectPlugin();
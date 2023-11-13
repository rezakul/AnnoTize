class AbstractSettingsTab {
  #bodyID;

  constructor () {
    this.#bodyID = "id-" + self.crypto.randomUUID();  
  }

  get bodyId() {
    return this.#bodyID;
  }

  /**
   * Closes the menu.
   * Save data if needed.
   * 
   * @param {boolean} cmf true if menu is closed, false if only tab is closed/switched
   */
  close(cmf) {  }
}
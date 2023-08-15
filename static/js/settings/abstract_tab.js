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
   */
  close() {  }
}
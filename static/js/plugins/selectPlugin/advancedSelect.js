/**
 * Advanced select that allows the user to dynamically add option values.
 */
class AdvancedSelect {
  #id;
  #options;
  #emitter;

  /**
   * Constructs a new advanced select object.
   * @param {string} id a unqiue id 
   * @param {Array<string>} optionList the option list of the select.
   */
  constructor(id, optionList) {
    this.#id = id;
    this.#options = optionList;
    // emitter to signal changes
    this.#emitter = new EventTarget();
  }

  get id() {
    return this.#id;
  }

  get emitter() {
    return this.#emitter;
  }

  get options() {
    return this.#options;
  }

  get optionsSorted() {
    return this.#options.sort();
  }

  /**
   * Check if value in option list.
   * @param {string} value the value to check
   * @returns {boolean} true if value present
   */
  hasEntry(value) {
    return this.options.includes(value);
  }

  /**
   * Add an entry to the options list.
   * 
   * @param {string} value the options value.
   * @returns {boolean} true if successfully added (false if already present)
   */
  addEntry(value) {
    if (this.options.includes(value)) {
      return false;
    }
    this.options.push(value);
    const evt = new CustomEvent('selectChange');
    this.emitter.dispatchEvent(evt);
    return true;
  }

  /**
   * Remove an entry to the options list.
   * 
   * @param {string} value the options value.
   * @returns {boolean} true if successfully removed (false if not present)
   */
  removeEntry(value) {
    if (!this.options.includes(value)) {
      return false;
    }
    let index;
    index = this.#options.indexOf(value);
    this.#options.splice(index, 1);
    const evt = new CustomEvent('selectChange');
    this.emitter.dispatchEvent(evt);
    return true;
  }
}
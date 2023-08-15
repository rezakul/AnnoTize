/**
 * Abstract Plugin class.
 * A plugin should be derived from this class.
 */
class AnnotationPlugin {
  #name;
  #importBodyNames;
  #userBodyName;
  #bodyClass;

  #supportUserCreation = false;
  #supportUserEdit = false;

  /**
   * Create a new Plugin.
   * @param {string} name the plugin name
   * @param {string | Array<string>} importBodyNames the name of the annotation bodys this plugin provides
   * @param {string | Array<string>} userBodyName the name of the annotation body for user display
   * @param {class | Array<class>} bodyClass the annotation body class
   */
  constructor (name, importBodyNames, userBodyName, bodyClass) {
    this.#name = name;
    if (typeof importBodyNames === 'string') {
      this.#importBodyNames = [importBodyNames];
    } else {
      this.#importBodyNames = importBodyNames;
    }
    this.#userBodyName = userBodyName;
    this.#bodyClass = bodyClass;
  }

  /**
   * The plugin name.
   */
  get name() {
    return this.#name;
  }

  /**
   * The body name.
   */
  get importBodyNames() {
    return this.#importBodyNames;
  }

  /**
   * The user display body name.
   */
  get userBodyName() {
    return this.#userBodyName;
  }

  /**
   * Get the annotation body class.
   */
  get bodyClass() {
    return this.#bodyClass;
  }

  /**
   * This annotation body can be created by the user.
   */
  get supportUserCreation() {
    return this.#supportUserCreation;
  }

  set supportUserCreation(val) {
    this.#supportUserCreation = val;
  }

  /**
   * This annotation body can be edited by the user.
   */
  get supportUserEdit() {
    return this.#supportUserEdit;
  }

  set supportUserEdit(val) {
    this.#supportUserEdit = val;
  }

  /**
   * Export additional plugin information to json.
   * 
   * @param {any} key a key may given by JSON.stringify()
   * @returns {object} (JSON) stringifyable object
   */
  toJSON(key) {
    return null;
  }

  /**
   * Register the plugin at the runtime.
   */
  registerPlugin() {
    runtime.registerPlugin(this);
  }

  /**
   * Register the template with teh runtime environemt.
   * @param {string} name the (unique) dispayed template name
   * @param {class} templateClass the template class
   */
  registerTemplate(name, templateClass) {
    runtime.registerTemplate(name, templateClass);
  }

  /**
   * Check if the plugin should be informed about the import of a certain type.
   * @param {string} type the json object type
   * @returns {boolean} true if plugin wants to be informed
   */
  informAboutImport(type) {
    return false;
  }

  /**
   * Infomation about a import object.
   * @param {Object} obj 
   */
  importFromJSON(obj) {
    return;
  }

  /**
   * Add a new Annotation from JSON.
   * @param {object} annotation a json annotation object
   */
  addAnnotationFromJSON(annotation) {
    throw new Error("Not Implemented Error");
  }
}
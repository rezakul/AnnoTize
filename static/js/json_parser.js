/**
 * Parser to parse the json configuration/ABoSpecs/Annotations
 */

/**
 * The AnnoTize Configuration the user uploaded.
 */
class ATConfigurationFileInformation {
  #config;      // basic configuration info
  #documents;   // documents information
  #conversion;  // conversion info for TEI documents (only Proof of Concept!!!)

  /**
   * Creates a configuration for AnnoTize
   * @param {ATConfiguration} config the basic configuration
   * @param {Map<string, ATDocumentConfiguration>} documents a map of document configurations (key: document id)
   * @param {Map<string, ATConversionConfiguration>} conversion map of conversion function for TEI documents (key: document id)
   */
  constructor(config=null, documents=null, conversion=null) {
    this.#config = config;
    if (documents === null) {
      documents = new Map();
    }
    this.#documents = documents;
    if (conversion === null) {
      conversion = new Map();
    }
    this.#conversion = conversion;
  }

  get config() {
    return this.#config;
  }

  set config(config) {
    this.#config = config;
  }

  /**
   * A config is defined
   * @returns {boolean} true if config is defined
   */
  hasConfig() {
    return this.#config !== null;
  }

  get documents() {
    return this.#documents;
  }

  /**
   * At least one document is present
   * @returns {boolean}
   */
  hasDocuments() {
    return this.#documents.size !== 0;
  }

  /**
   * A document for the id exists
   * @param {string} id document id
   * @returns {boolean} true if exists
   */
  hasDocument(id) {
    return this.#documents.has(id);
  }

  /**
   * Get a document for an id
   * @param {string} id document id
   * @returns {ATDocumentConfiguration|undefined} the document (undefined for unknown id)
   */
  getDocumentForId(id) {
    return this.#documents.get(id);
  }

  /**
   * Get the document for a given file name
   * @param {string} name document file name
   * @returns {ATDocumentConfiguration|undefined} the document (undefined for unknown filename)
   */
  getDocumentForFileName(name) {
    for (let doc of this.#documents.values()) {
      if (doc.fileName === name) {
        return doc;
      }
    }
    return undefined;
  }

  /**
   * Adds a document
   * @param {ATDocumentConfiguration} document the document to add
   * @returns {boolean} true on success, false if id already present
   */
  addDocument(document) {
    if (this.hasDocument(document.id)) {
      return false;
    }
    this.#documents.set(document.id, document);
    return true;
  }

  get conversions() {
    return this.#conversion;
  }

  set conversions(conversion) {
    this.#conversion = conversion;
  }

  /**
   * A conversion is defined
   * @param {string} id document id for conversion
   * @returns {boolean} true if conversion is defined
   */
  hasConversion(id) {
    return this.#conversion.has(id);
  }

  /**
   * Get conversion for document id
   * @param {string} id document id
   * @returns {ATConversionConfiguration|undefined}
   */
  getConversionForId(id) {
    return this.#conversion.get(id);
  }

  /**
   * Add a conversion object for TEI docs
   * @param {ATConversionConfiguration} conversion
   * @returns {boolean} true on success, false if id already present
   */
  addConversion(conversion) {
    if (this.hasConversion(conversion.document)) {
      return false;
    }
    this.#conversion.set(conversion.document, conversion);
    return true;
  }

  /**
   * Checks validity
   * @param {boolean} print print debug messages
   * @returns {boolean} true if valid
   */
  valid(print=false) {
    let result = true;

    result &= this.hasConfig();
    if (!this.hasConfig() && print) {
      console.error("No base configuration provided. Make sure the configuration file includes an entry from type 'Configuration'.");
    }

    result &= this.hasDocuments();
    if (!this.hasDocuments() && print) {
      console.error("No document configuration provided. Make sure at least one entry with type 'Document' is provided.");
    }

    for (let doc of this.#documents.values()) {
      if (!this.#config.documents.includes(doc.id) && print) {
        console.warn("No document configuration entry in 'Configuration' for document with id " + doc.id + ".");
      }
    }
    for (let doc of this.#config.documents) {
      if (!this.hasDocument(doc) && print) {
        console.warn("No document configuration for document with id " + doc + " is present.");
      } 
    }
    return result;
  }
}

class ATConfiguration {
  #id;        // the configuration id
  #creator;   // the creator
  #documents; // list of documents this config defines

  /**
   * Create a new configuration
   * @param {string} id a unique id
   * @param {string} creator the creator
   * @param {Array<string>} documents a list of documents this configuration is for
   */
  constructor(id, creator, documents) {
    this.#id = id;
    this.#creator = creator;
    this.#documents = documents;
  }

  get id() {
    return this.#id;
  }

  get creator() {
    return this.#creator;
  }

  get documents() {
    return this.#documents;
  }
}

class ATDocumentConfiguration {
  #id;            // document id
  #fileName;      // the file name in the upload
  #documentName;  // the document name

  /**
   * 
   * @param {string} id the unique document id
   * @param {string} fileName the file name (in the upload)
   * @param {string} documentName the document name (for annotation references)
   */
  constructor(id, fileName="", documentName="") {
    this.#id = id;
    this.#fileName = fileName;
    this.#documentName = documentName;
  }

  get id() {
    return this.#id;
  }

  get fileName() {
    return this.#fileName;
  }

  set fileName(fileName) {
    this.#fileName = fileName;
  }

  get documentName() {
    return this.#documentName;
  }

  set documentName(documentName) {
    this.#documentName = documentName;
  }
}

/**
 * Proof of Concept implementation.
 * TODO: probably needs some work
 */
class ATConversionConfiguration {
  #document;        // the document id
  #conversions;      // the conversions

  constructor(document, conversions) {
    this.#document = document;
    this.#conversions = conversions;
  }

  get document() {
    return this.#document;
  }

  get conversions() {
    return this.#conversions;
  }
}


class Parser {

  static #parseBaseConfiguration(config) {
    let res;
    if (config.type !== "Configuration") {
      console.warn("Wrong entry type.");
      return null;
    }
    res = new ATConfiguration(config.id, config.creator, config.documents);
    return res;
  }

  static #parseDocumentConfiguration(config) {
    let res;
    if (config.type !== "Document") {
      console.warn("Wrong entry type.");
      return null;
    }
    res = new ATDocumentConfiguration(config.id, config.file, config.name);
    return res;
  }

  static #parseABoSpecsConfiguration(config) {
    if (config.type !== "ABoSpecs") {
      console.warn("Wrong entry type.");
      return null;
    }
    // remove all default ABoSpecs
    ATABoSpecs.clearABoSpecs();
    // import new ABoSpecs
    for (let concept of config.concepts) {
      ATABoSpecs.addABoSpec(concept, true);
    }
  }

  static #parseTagConfiguration(config) {
    if (!(config.type === "Tag" || config.type === "TagSet")) {
      console.warn("Wrong entry type.");
      return null;
    }
    tagSetPlugin.importFromJSON(config);
  }

  static #parseConversionConfiguration(config) {
    let res;
    if (config.type !== "xmlConversionInfo") {
      console.warn("Wrong entry type.");
      return null;
    }
    res = new ATConversionConfiguration(config.document, config.conversions);
    return res;
  }

  /**
   * Parses the configuration file
   * @param {*} config the configuration json
   * @returns 
   */
  static parseConfiguration(config) {
    let configuration = new ATConfigurationFileInformation();
    
    for (let elem of config) {
      let elemType = elem.type;
      switch (elemType) {
        case "Configuration":
          let baseConfig = this.#parseBaseConfiguration(elem);
          if (baseConfig) {
            configuration.config = baseConfig;
          }
          break;
        case "Document":
          let docConfig = this.#parseDocumentConfiguration(elem);
          if (docConfig) {
            configuration.addDocument(docConfig);
          }
          break;
        case "ABoSpecs":
          this.#parseABoSpecsConfiguration(elem);
          break;
        case "TagSet":   // no break
        case "Tag":
          this.#parseTagConfiguration(elem);
          break;
        case "xmlConversionInfo":
          configuration.addConversion(this.#parseConversionConfiguration(elem));
          break;
      }
    }
    if (!configuration.valid()) {
      return null;
    }

    return configuration;
  }
  
}

/**
 * Check if the json element has all required entries.
 * 
 * @param {Object} elem the json annotation object
 * @returns {boolean} true if valid, false if invalid
 */
function validElement(elem) {
  let pathSelector = null;

  if (!("id" in elem)) {
    console.error("Invalid json format: required field 'id' not found", elem);
    return false;
  }
  if (!("type" in elem)) {
    console.error("Invalid json format: required field 'type' not found", elem);
    return false;
  }
  return true;
}


function fileReaderEvent(event) {
  let result, jsonObj;
  let annotations, annotationFragments;
  try {
    result = event.target.result;
    jsonObj = JSON.parse(result);
    if (!Array.isArray(jsonObj)) {
      console.error('JSON file has wrong format (should be an array');
      return;
    }
    annotations = [];
    annotationFragments = new Map();
    
    for (let element of jsonObj) {
      if (!validElement(element)) {
        continue;
      }

      switch (element.type) {
        case "Annotation":
        case "annotation":
          annotations.push(element);
          break;
        case "FragmentTarget":
        case "fragmenttarget":
          annotationFragments.set(element.id, element);
          break;
        case "TagSet":
          // no break
        case "Tag":
          tagSetPlugin.importFromJSON(element);
          break;
        case "SpotterRun":
          // TODO
          break; 
        default:
          // console.error("Unknown value for field 'type'", element);
      }      
    }    
  } catch (err) {
    // TODO: show ui warning to user
    console.error(err);
  }
  addAnnotationFromJSON(annotations, annotationFragments);
}

function validAnnotation(annotation) {
  if (!("target" in annotation)) {
    console.warn("Invalid json format: required field 'target' not found", annotation);
    return false;
  }
  if (!("body" in annotation)) {
    console.warn("Invalid json format: required field 'body' not found", annotation);
    return false;
  }
  if (!("type" in annotation.body)) {
    console.warn("Invalid json format: required field 'body.type' not found", annotation);
    return false;
  }
  return true;
}

function validAnnotationFragment(fragment) {
  let pathSelector = null;

  if (!("source" in fragment)) {
    console.error("Invalid json format: required field 'source' not found", fragment);
    return false;
  }
  if (!("selector" in fragment)) {
    console.error("Invalid json format: required field 'selector' not found", fragment);
    return false;
  }
  for (let element of fragment.selector) {
    try {
      if (element.type === "PathSelector") {
        pathSelector = element;
        break;
      }
    } catch (err) {
      // invalid selector
    }
  }
  if (pathSelector === null) {
    console.error("No valid selector found. Currently only 'PathSelector' is supported", fragment);
    return false;
  }
  if (!("startPath" in pathSelector)) {
    console.error("Invalid json format: required field 'selector[pathSelector].startPath' not found", fragment);
    return false;
  }
  if (!("endPath" in pathSelector)) {
    console.error("Invalid json format: required field 'selector[pathSelector].endPath' not found", fragment);
    return false;
  }
  return true;
}

function addAnnotationFromJSON(annotations, annotationFragments) {
  let initAnnotations = [];
  for (let annotation of annotations) {
    let result;
    let fragment;
    if (!validAnnotation(annotation)) {
      continue;
    }
    if (!annotation.target in annotationFragments) {
      console.error("Could not find 'FragmentTarget' to annotation", annotation);
      continue;
    }
    fragment = annotationFragments.get(annotation.target);
    if (!validAnnotationFragment(fragment)) {
      continue;
    }
    try {
      result = runtime.loadAnnotationFromJSON(annotation, fragment);
    } catch (error) {
      console.error(error, annotation, fragment);
    }
    
    if (result) {
      initAnnotations.push(annotation);
    }
  }
  for (let annotation of initAnnotations) {
    try {
      runtime.initializeAnnotationValuesFromJSON(annotation);
    } catch (error) {
      console.error(error, annotation);
      runtime.removeAnnotation(annotation.id);
    }
  }
}
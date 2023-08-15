class IdentifierBodyPlugin extends AnnotationPlugin {
  #identifier;
  #lastUsedIdentifier = "";

  constructor() {
    super('IdentifierBody', ['IdentifierDeclarationOLD', 'IdentifierOccurrenceOLD'], 'IdentifierBody', null);
    this.supportUserCreation = false;
    this.supportUserEdit = true;

    // initilize identifier
    this.#identifier = new Map();
  }

  /**
   * All registered Identifiers
   * @returns {Map<string, Identifier>}
   */
  get identifier() {
    return this.#identifier;
  }

  get lastUsedIdentifier() {
    return this.#lastUsedIdentifier;
  }

  set lastUsedIdentifier(val) {
    this.#lastUsedIdentifier = val;
  }

  /**
   * Check if identifier with id exists.
   * @param {string} id identifier id 
   * @returns {boolean} true if identifier with id exists
   */
  hasIdentifierForId(id) {
    return this.identifier.has(id);
  }
  /**
   * Get the identifier of the id
   * @param {string} id id of the identifier 
   * @returns {Identifier}
   */
  getIdentifierForId(id) {
    if (!this.hasIdentifierForId(id)) {
      console.error('Identifier for id not found:', id);
      return null;
    }
    return this.identifier.get(id);
  }

  /**
   * Get list of id's from all registerd identifiers
   * @returns {Array<string>}
   */
  getAllIdentifierIds() {
    return Array.from(this.identifier.keys()).sort();
  }

  createUniqueIdentifierId() {
    return runtime.source + "#identifier." + self.crypto.randomUUID();
  }

  toJSON(key) {
    let array = [];
    // export TagSets
    for (let identifier of this.identifier.values()) {
      if (!identifier.hasDeclaration() && !identifier.hasOccurrences()) {
        // skip empty identifiers
        continue;
      }
      array.push(identifier);
    }
    return array;
  }

  /**
   * Add a new Annotation from JSON.
   * @param {object} annotation a json annotation object
   */
  addAnnotationFromJSON(annotation) {
    let body;
    if (annotation.body.type === 'IdentifierDeclaration') {
      let identifier, declaration, polarity;
      let declarationBody;
      let tagPlugin;
      if (!this.#identifier.has(annotation.body.declares)) {
        console.error('Could not find Identifier for IdentifierDeclaration: ', annotation.body.declares);
        return false;
      }
      identifier =  this.#identifier.get(annotation.body.declares);
      tagPlugin = runtime.getPlugin('SimpleTagBody');
      if (tagPlugin.hasTagForId(annotation.body.hasPolarity)) {
        polarity = tagPlugin.getTagForId(annotation.body.hasPolarity);
      } else {
        polarity = tagPlugin.createTagForUndefinedTagSet(annotation.body.hasPolarity);
      }
      
      declaration = new IdentifierDeclaration(polarity);
      identifier.setDeclaration(declaration);
      declarationBody = new IdentifierDeclarationBody(State.Display, identifier);
      body = new IdentifierBody(State.Display, declarationBody);
  } else if (annotation.body.type === 'IdentifierOccurrence') {
    let identifier, occurrence;
    let occurrenceBody;
    if (!this.#identifier.has(annotation.body.occurrenceOf)) {
      console.error('Could not find Identifier for IdentifierOccurrence: ', annotation.body.occurrenceOf);
      return false;
    }
    identifier =  this.#identifier.get(annotation.body.occurrenceOf);
    occurrence = new IdentifierOccurrence();
    identifier.addOccurrence(occurrence);
    occurrenceBody = new IdentifierOccurrenceBody(State.Display, identifier, occurrence);
    body = new IdentifierBody(State.Display, occurrenceBody);
  } else {
    console.error('Unknown annotation body type: ', annotation.body.type);
  }
    return body;
  }

  /**
   * Check if the plugin should be informed about the import of a certain type.
   * @param {string} type the json object type
   * @returns {boolean} true if plugin wants to be informed
   */
  informAboutImport(type) {
    return ["Identifier"].includes(type);
  }

  /**
   * Infomation about a import object.
   * @param {Object} obj 
   */
  importFromJSON(obj) {
    let identifier;
    if (obj.type !== "Identifier") {
      return;
    }
    identifier = new Identifier(obj.id, obj.idString);
    return this.addIdentifier(identifier);
  }

  /**
   * Add a new identifier.
   * @param {Identifier} identifier the identifier to add 
   * @returns {boolean} true on success (false if id already present)
   */
  addIdentifier(identifier) {
    if (this.identifier.has(identifier.id)) {
      console.warn('Identifier already present and will be skipped: ', id);
      return false;
    }
    this.identifier.set(identifier.id, identifier);
  }
}

class IdentifierDeclarationBodyPlugin extends AnnotationPlugin {
  constructor() {
    super('IdentifierDeclaration', 'IdentifierDeclaration', 'IdentifierDeclaration', IdentifierDeclarationBody);
    this.supportUserCreation = true;
    this.supportUserEdit = true;
  }

  /**
   * Add a new Annotation from JSON.
   * @param {object} annotation a json annotation object
   */
  addAnnotationFromJSON(annotation) {
    let body;
    let identifier, declaration, polarity;
    const identifierMap = runtime.getPlugin('IdentifierBody').identifier;
    const tagPlugin = runtime.getPlugin('SimpleTagBody');
    if (annotation.body.type !== 'IdentifierDeclaration') {
      return;
    }
    
    if (!identifierMap.has(annotation.body.declares)) {
      console.error('Could not find Identifier for IdentifierDeclaration: ', annotation.body.declares);
      return false;
    }
    identifier =  identifierMap.get(annotation.body.declares);
    if (tagPlugin.hasTagForId(annotation.body.hasPolarity)) {
      polarity = tagPlugin.getTagForId(annotation.body.hasPolarity);
    } else {
      polarity = tagPlugin.createTagForUndefinedTagSet(annotation.body.hasPolarity);
    }
    
    declaration = new IdentifierDeclaration(polarity);
    identifier.setDeclaration(declaration);
    body = new IdentifierDeclarationBody(State.Display, identifier);

    return body;
  }
  
  createTemplateFromJSON(json) {
    let template;
    let autorefresh, autocreate, identifier, polarity, polarityTemplate;
            
    autorefresh = json.autorefresh;
    autocreate = json.autocreate;
    identifier = json.identifier;
    if (identifier && !runtime.getPlugin('IdentifierBody').identifier.has(identifier)) {
      let ident;
      ident = new Identifier(identifier);
      runtime.getPlugin('IdentifierBody').addIdentifier(ident);
    }
    // get template for polarity tag
    polarity = json.polarityTemplate;
    polarityTemplate = runtime.pluginImportBodyTypes.get(polarity.type).createTemplateFromJSON(polarity);

    template = new IdentifierDeclarationTemplate(identifier, polarityTemplate, autorefresh, autocreate);

    return template;
  }
}

class IdentifierOccurrenceBodyPlugin extends AnnotationPlugin {
  constructor() {
    super('IdentifierOccurrence', 'IdentifierOccurrence', 'IdentifierOccurrence', IdentifierOccurrenceBody);
    this.supportUserCreation = true;
    this.supportUserEdit = true;
  }

  /**
   * Add a new Annotation from JSON.
   * @param {object} annotation a json annotation object
   */
  addAnnotationFromJSON(annotation) {
    let body;
    let identifier, occurrence;
    const identifierMap = runtime.getPlugin('IdentifierBody').identifier;
    if (annotation.body.type !== 'IdentifierOccurrence') {
      return;
    }

    if (!identifierMap.has(annotation.body.occurrenceOf)) {
      console.error('Could not find Identifier for IdentifierOccurrence: ', annotation.body.occurrenceOf);
      return false;
    }
    identifier =  identifierMap.get(annotation.body.occurrenceOf);
    occurrence = new IdentifierOccurrence();
    identifier.addOccurrence(occurrence);
    body = new IdentifierOccurrenceBody(State.Display, identifier, occurrence);
  
    return body;
  }

  createTemplateFromJSON(json) {
    let template;
    let autorefresh, autocreate, identifier;
            
    autorefresh = json.autorefresh;
    autocreate = json.autocreate;
    identifier = json.identifier;

    template = new IdentifierOccurrenceTemplate(identifier, autorefresh, autocreate);

    return template;
  }
}

function initializeIdentifierPlugin() {
  let plugin;
  plugin = new IdentifierBodyPlugin();
  plugin.registerPlugin();
  // declaration
  plugin = new IdentifierDeclarationBodyPlugin();
  plugin.registerPlugin();
  plugin.registerTemplate('IdentifierDeclaration', IdentifierDeclarationTemplate);
  // occurrence
  plugin = new IdentifierOccurrenceBodyPlugin();
  plugin.registerPlugin();
  plugin.registerTemplate('IdentifierOccurrence', IdentifierOccurrenceTemplate);
}

// initializeIdentifierPlugin();
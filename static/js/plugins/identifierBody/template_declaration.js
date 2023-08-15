/**
 * The template for the grounding body
 * @extends {AbstractTemplateBody} extends the abstract template structure. 
 */
class IdentifierDeclarationTemplate extends IdentifierTemplate {
  #polarityTemplate;

  /**
   * Creates a SimpleTagBody with a given tag.
   * @param {State} state the state of the annotation
   * @param {Tag} tag the tag
   */
  constructor(identifier="", polarity=null, autorefresh=false, autocreate=false) {
    super(identifier, autorefresh, autocreate);
    if (polarity) {
      this.#polarityTemplate = polarity;
    } else {
      this.#polarityTemplate = new SimpleTagBodyTemplate();
    }
  }

  get displayName() {
    return "IdentifierDeclaration";
  }

  toJSON(key) {
    let json = {};

    json.type = "IdentifierDeclaration";
    json.autorefresh = this.autorefresh;
    json.autocreate = this.autocreate;
    if (!this.autorefresh && !this.autocreate) {
      json.identifier = this.identifier;
    }
    json.polarityTemplate = this.#polarityTemplate.toJSON();
    
    return json;
  }

  #declarationTag() {
    let wrapper, content;
    wrapper = document.createElement('div');
    wrapper.setAttribute('id', this.bodyID + '-identifier-declaration-tag');
    wrapper.setAttribute('class', 'annotation-identifier-declaration-tag');
    
    content = this.#polarityTemplate.content();
    
    wrapper.appendChild(content);
    return wrapper;
  }

  content() {
    let wrapper, hline;
  
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-identifier-body');
  
    hline = document.createElement('div');
    hline.setAttribute('class', 'hline');
    wrapper.appendChild(hline);
  
    wrapper.appendChild(this.identifierSelection());
    wrapper.appendChild(this.#declarationTag());
  
    return wrapper;
  }

  save() {
    super.save();
    this.#polarityTemplate.save();
  }

  getAnnotationFromTemplate(state) {
    let body, identifier, identifierId;

    // get the identifier
    if (this.autorefresh) {
      identifierId = runtime.getPlugin('IdentifierBody').lastUsedIdentifier;
      if (identifierId) {
        identifier = runtime.getPlugin('IdentifierBody').getIdentifierForId(identifierId);
      } else {
        identifier = null;
      }
    } else if (this.autocreate) {
      identifierId = runtime.getPlugin('IdentifierBody').createUniqueIdentifierId();
      identifier = new Identifier(identifierId);
      runtime.getPlugin('IdentifierBody').addIdentifier(identifier);
    } else if (this.identifier) {
      identifier = runtime.getPlugin('IdentifierBody').getIdentifierForId(this.identifier);
      identifierId = identifier.id;
    } else {
      identifier = null;
    }

    if (identifierId) {
      // set as last defiend identifier
      runtime.getPlugin('IdentifierBody').lastUsedIdentifier = identifierId;
    }

    body = new IdentifierDeclarationBody(state, identifier, null);
    body.overwriteTagBody(this.#polarityTemplate.getAnnotationFromTemplate(state));
    return body;
  }
}
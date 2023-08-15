/**
 * The template for the grounding body
 * @extends {AbstractTemplateBody} extends the abstract template structure. 
 */
class IdentifierOccurrenceTemplate extends IdentifierTemplate {
  /**
   * Creates a SimpleTagBody with a given tag.
   * @param {State} state the state of the annotation
   * @param {Tag} tag the tag
   */
  constructor(identifier="", autorefresh=false, autocreate=false) {
    super(identifier, autorefresh, autocreate);
  }

  get displayName() {
    return "IdentifierOccurrence";
  }

  toJSON(key) {
    let json = {};

    json.type = "IdentifierOccurrence";
    json.autorefresh = this.autorefresh;
    json.autocreate = this.autocreate;
    if (!this.autorefresh && !this.autocreate) {
      json.identifier = this.identifier;
    }
    
    return json;
  }

  content() {
    let wrapper, hline;
  
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'annotation-identifier-body');
  
    hline = document.createElement('div');
    hline.setAttribute('class', 'hline');
    wrapper.appendChild(hline);
  
    wrapper.appendChild(this.identifierSelection());
  
    return wrapper;
  }

  save() {
    super.save();
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

    body = new IdentifierOccurrenceBody(state, identifier, null);
    return body;
  }
}
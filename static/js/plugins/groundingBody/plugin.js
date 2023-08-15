class GroundingBodyPlugin extends AnnotationPlugin {

  constructor() {
    super('GroundingBody', 'https://sigmathling.kwarc.info/resources/grounding-dataset/groundingBody', 'GroundingBody', GroundingBody);
    this.supportUserCreation = true;
    this.supportUserEdit = true;
  }

  /**
   * Add a new Annotation from JSON.
   * @param {object} annotation a json annotation object
   */
  addAnnotationFromJSON(annotation) {
    let body;
    let grounding, hasGrounding, hasArity, hasSog;
            
    hasGrounding = annotation.body['asa:hasGrounding'];
    hasArity = annotation.body['asa:hasArity'];
    hasSog = annotation.body['asa:hasSog'];

    grounding = new Grounding(hasGrounding, hasArity, hasSog);
    body = new GroundingBody(State.Display, grounding);
    return body;
  }

  createTemplateFromJSON(json) {
    let template;
    let hasGrounding, hasArity, hasSog;
            
    hasGrounding = json['asa:hasGrounding'];
    hasArity = json['asa:hasArity'];
    hasSog = json['asa:hasSog'];

    template = new GroundingTemplate(hasGrounding, hasArity, hasSog);

    return template;
  }
  
}

function initializeGroundingBodyPlugin() {
  let plugin;
  plugin = new GroundingBodyPlugin();
  plugin.registerPlugin();
  plugin.registerTemplate('GroundingBody', GroundingTemplate);
}

// initializeGroundingBodyPlugin();
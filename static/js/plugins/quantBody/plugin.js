class QuantBodyPlugin extends AnnotationPlugin {

  constructor() {
    super('QuantBody', 'https://sigmathling.kwarc.info/resources/quantity-expressions/quantBody', 'QuantBody', QuantBody);
    this.supportUserCreation = true;
    this.supportUserEdit = true;
  }

  /**
   * Add a new Annotation from JSON.
   * @param {object} annotation a json annotation object
   */
  addAnnotationFromJSON(annotation) {
    let body;
    let quant, hasScalar, hasUnit;
          
    hasScalar = annotation.body['rab:hasScalar'];
    hasUnit = annotation.body['rab:hasUnit'];

    quant = new Quant(hasScalar, hasUnit);
    body = new QuantBody(State.Display, quant);
    return body;
  }

  createTemplateFromJSON(json) {
    let template;
    let hasScalar, hasUnit;
            
    hasScalar = json['rab:hasScalar'];
    hasUnit = json['rab:hasUnit'];

    template = new QuantTemplate(hasScalar, hasUnit);

    return template;
  }
}

function initializeQuantBodyPlugin() {
  let plugin;
  plugin = new QuantBodyPlugin();
  plugin.registerPlugin();
  plugin.registerTemplate('QuantBody', QuantTemplate);
}

// initializeQuantBodyPlugin();
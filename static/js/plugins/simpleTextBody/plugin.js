class SimpleTextBodyPlugin extends AnnotationPlugin {

  constructor() {
    super('SimpleTextBody', 'SimpleTextBody', 'SimpleTextBody', SimpleTextBody);
    this.supportUserCreation = true;
    this.supportUserEdit = true;
  }

  /**
   * Add a new Annotation from JSON.
   * @param {object} annotation a json annotation object
   */
  addAnnotationFromJSON(annotation) {
    let body;
    body = new SimpleTextBody(State.Display, annotation.body.val);
    return body;
  }

  createTemplateFromJSON(json) {
    let template;
    let text;
            
    text = json.text;

    template = new SimpleTextBodyTemplate(text);

    return template;
  }
}

function initializeSimpleTextBodyPlugin() {
  let plugin;
  plugin = new SimpleTextBodyPlugin();
  plugin.registerPlugin();
  plugin.registerTemplate('SimpleTextBody', SimpleTextBodyTemplate);
}

// initializeSimpleTextBodyPlugin();
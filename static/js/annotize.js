class AnnotationColors {
  static get HIGHLIGHT() {
    return '#FFFF00';
  }

  static get HIDDEN() {
    return 'rgb(211,211,211, 0.4)';
  }
}

class AnnotationRuntime {
  #active;
  #teiInitialized = false;
  #teiConversion;

  #source;
  #uniqueId;
  #counter = 1;

  #sidebarObject;
  #annotations;
  #mouseOverHighlight = false;

  #annotationStyles = new Map();
  #annotationTypes = new Map();
  #selectAnnotationFromDocument = null;
  #selectAnnotationFromDocumentType;

  #plugins = new Map();
  #pluginImportBodyTypes = new Map();     /* Type: Map<string, AnnotationPlugin> */
  #pluginAvailableTemplates = new Map();  /* Type: Map<string, AbstractTemplateBody> */

  #emitter;

  #lastFocus = null;

  #reselect;
  #addDiscontinuity;

  #referenceArrows = new Map();

  /**
   * Creates the runtime environment that holds all the current annotation information.
   * @param {string} url the source url of the current document
   * @param {boolean} active if the annotation framework is active (e.g. sidebar shown and able to annotate)
   */
  constructor(url, active=true, config=null, conversion=null) {
    this.#active = active;
    this.#teiConversion = conversion;
    if (config) {
      this.#source = config.name;
      // this.#uniqueId = config.id;
      this.#uniqueId = self.crypto.randomUUID();
    } else {
      this.#source = url + "/document.html";
      this.#uniqueId = self.crypto.randomUUID();
    }
    
    // emitter to signal changes
    this.#emitter = new EventTarget();

    this.#sidebarObject = new AnnotationSidebar(false);
    if (!this.#active) {
      this.#sidebarObject.deactivate();
    }
    /** @private @const {Map<number, AnnotationObject>} */
    this.#annotations = new Map();

    // TODO: config file
    this.initializeAnnotationStyles();

    window.addEventListener("mouseup", event => this.eventWindowMouseup(event));
    
    window.addEventListener("mousedown", (event) => {
      runtime.eventWindowMousedown(event);
    });

    window.addEventListener('resize', event => this.windowResizeEvent(event));
  }

  #setupTEIannotations() {
    if (!this.#teiConversion) {
      return;
    }
    // annotate xml
    for (let conversion of this.#teiConversion.conversions) {
      let nodes = document.querySelectorAll('[data-origname="' + conversion.origName + '"]');
      for (let node of nodes) {
        // check that node is not in header
        if (document.getElementsByTagName('tei-text')[0].contains(node)) {
          this.#createAnnotationFromTEI(node, conversion);
        }
      }
    }    
  }

  #createAnnotationFromTEI(node, conversion) {
    let uniqueIds, range, selected, annotation, concept, fragmentTarget, body, bodyValues;
    let xPathStart, xPathEnd, path, selector;
    let style;
    // get a unique id for the annotation
    uniqueIds = this.getNewUniqueIds();
    if (this.#annotations.has(uniqueIds.get("annotation"))) {
      console.error("Duplicate id...", uniqueIds.get("annotation"));
      return;
    }

    // create range from node
    range = new Range();
    range.selectNode(node);

    // get the target x-path
    xPathStart = getXPathToNode(range.startContainer, range.startOffset, true);
    xPathEnd = getXPathToNode(range.endContainer, range.endOffset, false);
    path = new PathSelector(xPathStart, xPathEnd);
    // set target
    selector = new Map();
    selector.set("PathSelector", path);

    // create the target
    fragmentTarget = new FragmentTarget(uniqueIds.get("target"), this.#source, selector);    
    
    // set default style
    style = AnnotationStyleMarker;

    // get concept of annotation
    concept = this.getABoSpecForName(conversion.ABoSpec);

    // create body
    body = new TemplateBody(State.Display, concept.concept, true);

    // create the selection
    selected = new TextHighlight(range, uniqueIds.get("annotation"), fragmentTarget, style);
    // create the final annotation object
    annotation = new AnnotationObject(uniqueIds.get("annotation"), fragmentTarget, selected, body, this.creator);
    // save annotation for later use
    this.#annotations.set(uniqueIds.get("annotation"), annotation);

    // get body values
    bodyValues = {};
    for (let attr of conversion.attributes) {
      // TODO: without eval?
      let fn = eval(conversion.attributesConversion[attr]);
      bodyValues[attr] = fn(node.getAttribute(attr));
    }
    annotation.annotationBody.initializeValues(bodyValues);
    // show annotation in html and sidebar
    annotation.show(true);
  }

  /**
   * Unique runtime id (uuid) for this instance.
   */
  get id() {
    return this.#uniqueId;
  }

  /**
   * Get the runtime sidebar object
   * @returns {AnnotationSidbar} the annotation sidebar
   */
  get sidebar() {
    return this.#sidebarObject;
  }

  /**
   * Emitter that signals some change
   * @returns {EventTarget}
   */
  get emitter() {
    return this.#emitter;
  }

  /**
   * Check if mouse is currently over a text highlight element.
   * 
   * @returns {boolean} true if mouse over element
   */
  get mouseOverHighlight() {
    return this.#mouseOverHighlight;
  }

  /**
   * Set the status of mouse over a text highlight element.
   * 
   * @param {boolean} value the value to set (true if mouse over element)
   */
  set mouseOverHighlight(value) {
    this.#mouseOverHighlight = value;
  }

  /**
   * All annotations currently loaded.
   * @returns {Map<string,AnnotationObject>}
   */
  get annotations() {
    return this.#annotations;
  }

  get annotationStyles() {
    return this.#annotationStyles;
  }

  get annotationTypes() {
    return this.#annotationTypes;
  }

  get source() {
    return this.#source;
  }

  get abospecNames() {
    return ATABoSpecs.abospecNames;
  }

  getABoSpecForName(concept) {
    return ATABoSpecs.getABoSpecForName(concept);
  }

  /**
   * The creator id of annotations created by the user.
   * @returns {string}
   */
  get creator() {
    return ATSettings.creator;
  }

  /**
   * The registerd plugins.
   * @returns {Map<string,AnnotationPlugin>}
   */
  get plugins() {
    return this.#plugins;
  }

  get reselectAnnotation() {
    return this.#reselect;
  }

  get addDiscontinuity() {
    return this.#addDiscontinuity;
  } 

  get settings() {
    return settingsPlugin;
  }


  /**
   * TEMPORARY
   */
  get pluginImportBodyTypes() {
    return this.#pluginImportBodyTypes;
  }

  getAnnotationType(annoType) {
    if (!this.annotationTypes.has(annoType)) {
      console.warn('Annotation type not found: ', annoType);
      return null;
    }
    return this.annotationTypes.get(annoType);
  }

  getAnnotationTypesList() {
    return Array.from(this.#annotationTypes.keys()).sort();
  }

  hasAnnotationForId(id) {
    return this.#annotations.has(id);
  }

  /**
   * Get the annotation with the id.
   * @param {string} id the annotation id
   * @returns {AnnotationObject}
   */
  getAnnotationForId(id) {
    if (!this.#annotations.has(id)) {
      console.warn('Annotation with id not found: ', id);
      return null;
    }
    return this.#annotations.get(id);
  }

  /**
   * Get the annotation with the id.
   * @param {string} id the annotation id
   * @returns {AnnotationObject}
   */
  getAnnotationById(id) {
    if (!this.#annotations.has(id)) {
      console.warn('Annotation with id not found: ', id);
      return null;
    }
    return this.#annotations.get(id);
  }

  hasStyle(name) {
    return this.#annotationStyles.has(name);
  }

  getStyleForName(name) {
    if (name === 'default') {
      return AnnotationStyleMarker;
    }
    if (!this.hasStyle(name)) {
      console.warn("Unknown style: ", name);
      return this.#annotationStyles.values()[0];
    }
    return this.#annotationStyles.get(name);
  }

  getNewUniqueIds() {
    let ids;
    ids = new Map();
    ids.set("annotation", this.#source + "#" + this.#uniqueId + ".anno." + this.#counter);
    ids.set("target", this.#source + "#" + this.#uniqueId + ".target." + this.#counter);
    this.#counter += 1;
    return ids;
  }

  addReferenceArrow(reference) {
    if (this.#referenceArrows.has(reference.id)) {
      console.warn('Reference arrow already set: ', reference.id);
      return;
    }
    this.#referenceArrows.set(reference.id, reference);
  }

  removeReferenceArrow(reference) {
    if (!this.#referenceArrows.has(reference.id)) {
      console.warn('Reference arrow not defined: ', reference.id);
      return;
    }
    this.#referenceArrows.delete(reference.id);
  }

  /*
  getPlugin(name) {
    if (!this.plugins.has(name)) {
      console.error("Plugin not found: ", name);
      return;
    }
    return this.plugins.get(name);
  }
  */

  /**
   * Get the template object for a given name
   * @param {string} name the name of the template
   * @returns {AbstractTemplateBody | undefined} the template if a valid name
   */
  getTemplateForName(name) {
    let templateClass, templateObj;
    if (!this.#pluginAvailableTemplates.has(name)) {
      console.warn('No template with name present: ', name);
      return;
    }
    templateClass = this.#pluginAvailableTemplates.get(name);
    templateObj = new templateClass();
    return templateObj;
  }

  getTemplateNameList() {
    return Array.from(this.#pluginAvailableTemplates.keys()).sort();
  }

  /**
   * Register a new template.
   * @param {string} name the name of the template
   * @param {AbstractTemplateBody} templateClass the class object to create a new template object
   */
  registerTemplate(name, templateClass) {
    // template map: Map<string, AbstractTemplateBody>
    if (this.#pluginAvailableTemplates.has(name)) {
      console.warn('Template name already present: ', name);
      return;
    }
    this.#pluginAvailableTemplates.set(name, templateClass);
  }

  /**
   * Register a new Plugin.
   * @param {AnnotationPlugin} instance the plugin instance
   */
  registerPlugin(instance) {
    if (this.plugins.has(instance.name)) {
      console.error("Plugin already loaded: ", instance.name);
      return;
    }
    this.plugins.set(instance.name, instance);
    for (let name of instance.importBodyNames) {
      this.#pluginImportBodyTypes.set(name, instance);
    }
    if (instance.supportUserCreation) {
      this.#annotationTypes.set(instance.userBodyName, instance.bodyClass);
    }
  }

  /**
   * The sidebar element that had last focus.
   */
  get lastFocus() {
    return this.#lastFocus;
  }

  set lastFocus(val) {
    this.#lastFocus = val;
  }

  windowResizeEvent(event) {
    document.body.style.removeProperty('width');
    document.body.style.width = document.body.clientWidth - 425 + 'px';
    for (let val of runtime.annotations.values()) {
      val.resizeEvent(event);
    }
  }

  /**
   * Mouseup event callback. Adds a popup if text is selected.
   */
  eventWindowMouseup(event) {
    // add a popup if user selected text
    if (!this.#active) {
      return;
    }
    SelectionPopup.eventMouseup(event);
    if (runtime.lastFocus) {
      runtime.lastFocus.focus();
      runtime.lastFocus = null;
    }
  }

  /**
   * Mousedown event callback. Removes popup and minimizes sidebar.
   */
  eventWindowMousedown(event) {
    // remove old popup
    SelectionPopup.eventMousedown(event);
    // close sidebar if click in text
    this.sidebar.closeSidebarIfNotUsed();
  }

  initializeAnnotationStyles() {
    this.#annotationStyles.set("marker", AnnotationStyleMarker);
    this.#annotationStyles.set("colored", AnnotationStyleColored);
    this.#annotationStyles.set("underscore", AnnotationStyleUnderscore);
    this.#annotationStyles.set("outline", AnnotationStyleOutline);
    this.#annotationStyles.set("rectangle", AnnotationStyleRectangle);
  }

  activate() {
    this.#active = true;
    this.#sidebarObject.activate();
    // show all arrows again
    for (let reference of this.#referenceArrows.values()) {
      reference.initializeArrow(true);
    }
    // sync document in case new annotation styles defiend
    this.syncAnnotationStyle();
    // annotate tei xml
    if (document.body.dataset.doctype === "xml" && this.#teiInitialized === false) {
      this.#teiInitialized = true;
      this.#setupTEIannotations();
    }
  }

  deactivate() {
    this.#active = false;
    this.#sidebarObject.deactivate();
    // remove all arrows so leader-line does not break
    for (let reference of this.#referenceArrows.values()) {
      reference.removeArrow(true);
    }
  }

  setLastInteractionWithConcept(concept, annotationId) {
    let value = {};

    value.id = annotationId;
    value.timestamp = Date.now();
    // set id with timestamp as last annotation for concept (overwrite old one)
    ATABoSpecs.setLastInteraction(concept, value, this.id);
  }

  getLastInteractionWithConcept(concepts) {
    let result;
    for (let concept of concepts) {
      let tmp;
      tmp = ATABoSpecs.getLastInteraction(concept, this.id);
      if (tmp && this.#annotations.has(tmp.id)) {
        if (!result || result.timestamp < tmp.timestamp) {
          result = tmp;
        }
      }
    }
    if (result) {
      return result.id;
    }
    return "";
  }

  reselectAnnotationHandler() {
    let uniqueIds, range, fragmentTarget;
    let xPathStart, xPathEnd, path, selector;
    // clear popup
    SelectionPopup.removePopup();
    // get range for selection
    range = SelectionPopup.selection.getRangeAt(0);
    // clear the selected area
    SelectionPopup.selection.removeAllRanges();
    // get the target x-path
    xPathStart = getXPathToNode(range.startContainer, range.startOffset, true);
    xPathEnd = getXPathToNode(range.endContainer, range.endOffset, false);
    path = new PathSelector(xPathStart, xPathEnd);
    selector = new Map();
    selector.set("PathSelector", path);
    // create the target
    uniqueIds = this.getNewUniqueIds();
    fragmentTarget = new FragmentTarget(uniqueIds.get("target"), this.#source, selector);

    const annotation = this.getAnnotationForId(this.#reselect);
    annotation.setFragmentTarget(fragmentTarget);

    // stop reselect
    document.body.style.removeProperty('cursor');
    document.removeEventListener('keyup', this.keyupEventDocument);
    this.#reselect = undefined;
  }

  addDiscontinuityHandler() {
    let uniqueIds, range, fragmentTarget;
    let xPathStart, xPathEnd, path, discontinousPath, selector;
    // clear popup
    SelectionPopup.removePopup();
    // get range for selection
    range = SelectionPopup.selection.getRangeAt(0);
    // clear the selected area
    SelectionPopup.selection.removeAllRanges();
    // get the target x-path
    xPathStart = getXPathToNode(range.startContainer, range.startOffset, true);
    xPathEnd = getXPathToNode(range.endContainer, range.endOffset, false);
    path = new PathSelector(xPathStart, xPathEnd);
    
    // check if current selector is already discontinues
    const annotation = this.getAnnotationForId(this.#addDiscontinuity);
    if (!annotation.target.pathSelector.discontinuous) {
      let listSelector;
      listSelector = new ListSelector();
      listSelector.addSelector(annotation.target.pathSelector);
      discontinousPath = new DiscontinuesPathSelector(listSelector);
    } else {
      discontinousPath = annotation.target.pathSelector;
    }
    discontinousPath.addSelector(path);
    selector = new Map();
    selector.set("PathSelector", discontinousPath);
    // create the target
    uniqueIds = this.getNewUniqueIds();
    fragmentTarget = new FragmentTarget(uniqueIds.get("target"), this.#source, selector);

    
    annotation.setFragmentTarget(fragmentTarget);

    // stop reselect
    document.body.style.removeProperty('cursor');
    document.removeEventListener('keyup', this.keyupEventDocument);
    this.#addDiscontinuity = undefined;
  }

  /**
   * The annotation popup was clicked.
   * Creates a new annotation.
   */
  clickOnPopup() {
    let uniqueIds, range, selected, annotation, fragmentTarget, body;
    let xPathStart, xPathEnd, path, pathList, selector;
    let style;
    // get a unique id for the annotation
    uniqueIds = this.getNewUniqueIds();
    if (this.#annotations.has(uniqueIds.get("annotation"))) {
      console.error("Duplicate id...", uniqueIds.get("annotation"));
      return;
    }
    // clear popup
    SelectionPopup.removePopup();
    // handle multiselect for discontinous targets (only firefox supports this as of now [08.2023])
    pathList = [];
    for (let i = 0; i < SelectionPopup.selection.rangeCount; ++i) {
      // get range for selection
      range = SelectionPopup.selection.getRangeAt(i);
      // get the target x-path
      xPathStart = getXPathToNode(range.startContainer, range.startOffset, true);
      xPathEnd = getXPathToNode(range.endContainer, range.endOffset, false);
      path = new PathSelector(xPathStart, xPathEnd);
      
      pathList.push(path);
    }
    if (pathList.length === 1) {
      // only single target
      selector = new Map();
      selector.set("PathSelector", pathList[0]);
    } else {
      // multiple fragments
      let listSelector, discontinousPath;
      listSelector = new ListSelector();
      discontinousPath = new DiscontinuesPathSelector(listSelector);

      for (let i = 0; i < pathList.length; ++i) {
        discontinousPath.addSelector(pathList[i]);
      }

      selector = new Map();
      selector.set("PathSelector", discontinousPath);
    }
    // create the target
    fragmentTarget = new FragmentTarget(uniqueIds.get("target"), this.#source, selector);

    // clear the selected area
    SelectionPopup.selection.removeAllRanges();
    
    
    // set default style
    if (ATSettings.useCreatorAnnotationStyle) {
      let creatorStyle = ATSettings.creators.get(this.creator).annotationStyle;
      style = this.getStyleForName(creatorStyle);
    } else if (ATSettings.useTypeAnnotationStyle && ATSettings.useAnnotationTemplate && ATSettings.annotationTemplate) {
      let concept = this.getABoSpecForName(ATSettings.annotationTemplate.name);
      style = this.#annotationStyles.get(concept.style);
      if (!style) {
        style = AnnotationStyleMarker;
      }
    } else {
      style = AnnotationStyleMarker;
    }

    if (ATSettings.useAnnotationTemplate) {
      body = new TemplateBody(State.Creation, ATSettings.annotationTemplate, ATSettings.showHeader);
      // TODO: style
    } else {
      body = new TemplateBody(State.Creation);
      // body = new AnnotationTypeSelectionBody(State.Creation);
    }

    // create the selection
    selected = new TextHighlight(range, uniqueIds.get("annotation"), fragmentTarget, style);
    // create the final annotation object
    annotation = new AnnotationObject(uniqueIds.get("annotation"), fragmentTarget, selected, body, this.creator);
    // save annotation for later use
    this.#annotations.set(uniqueIds.get("annotation"), annotation);
    // show annotation in html and sidebar
    annotation.show();

    // save annotation if configured
    if (ATSettings.saveOnCreation) {
      if (body.validState) {
        runtime.saveAnnotationEvent(null, annotation.id);
      }
    }
  }

  /**
   * Scroll the text to the annotation.
   * @param {number} annotationID 
   */
  scrollToAnnotationInText(annotationID) {
    let annotation;
    annotation = runtime.getAnnotationForId(annotationID);
    annotation.scrollTo();
  }

  removeAnnotation(id) {
    // delete the annotation
    let annotation;
    annotation = runtime.getAnnotationForId(id);
    annotation.remove();
    this.#annotations.delete(id);
    // signal deletion to listeners
    this.emitter.dispatchEvent(new CustomEvent('deleteAnnotation', {detail: { id: id, },}));
  }

  deleteAnnotationEvent(event, annotationId) {
    this.cancelReselect();
    this.cancelAddDicontinuity();
    // delete the annotation
    let annotation;
    annotation = runtime.getAnnotationForId(annotationId);
    annotation.remove();
    this.#annotations.delete(annotationId);
    // signal deletion to listeners
    this.emitter.dispatchEvent(new CustomEvent('deleteAnnotation', {detail: { id: annotationId, },}));
    // stop the event propagation
    event.stopPropagation();
  }

  /**
   * Save an annotation. (User pressed save button).
   * 
   * @param {Event} event the triggered event
   * @param {number} annotationID the corresponding id
   */
  saveAnnotationEvent(event, annotationID) {
    this.sidebar.save(annotationID);
  }

  /**
   * Adjust the annotation border.
   * 
   * @param {Event} event the triggered event
   * @param {number} annotationID the corresponding id
   * @param {string} border the border to adjust (start or end)
   * @param {string} direction the direction to adjust (left or right)
   */
  adjustSelection(event, annotationID, border, direction) {
    let annotation;
    if (!this.#annotations.has(annotationID)) {
      console.error('Element with id not found', annotationID);
      return;
    }
    annotation = this.#annotations.get(annotationID);
    annotation.adjustSelection(border, direction);
  }

  cancelReselect() {
    if (!this.#reselect) {
      return;
    }
    document.body.style.removeProperty('cursor');
    document.removeEventListener('keyup', this.keyupEventDocument);
    const annotation = this.getAnnotationForId(this.#reselect);
    annotation.setFragmentTarget(annotation.target);
    this.#reselect = undefined;
  }

  reselectTextFragment(annotationId) {
    if (this.#addDiscontinuity) {
      this.cancelAddDicontinuity();
    }
    if (this.#reselect) {
      this.cancelReselect();
    } else {
      // set cursor
      document.body.style.cursor = "text";
      // remember annotation id
      this.#reselect = annotationId;
      // register event listener to cancel with 'Esc'
      document.addEventListener('keyup', this.keyupEventDocument);
      // remove old selection
      this.getAnnotationForId(annotationId).removeSelection();
    }
  }

  cancelAddDicontinuity() {
    if (!this.#addDiscontinuity) {
      return;
    }
    document.body.style.removeProperty('cursor');
    document.removeEventListener('keyup', this.keyupEventDocument);
    this.#addDiscontinuity = undefined;
  }

  addDiscontinuesTextFragment(annotationId) {
    if (this.#reselect) {
      this.cancelReselect();
    }
    if (this.#addDiscontinuity) {
      this.cancelAddDicontinuity();
    } else {
      // set cursor
      document.body.style.cursor = "text";
      // remember annotation id
      this.#addDiscontinuity = annotationId;
      // register event listener to cancel with 'Esc'
      document.addEventListener('keyup', this.keyupEventDocument);
    }
  }

  /**
   * Edit an annotation. (User pressed edit button).
   * 
   * @param {Event} event the triggered event
   * @param {number} annotationID the corresponding id
   */
  editAnnotation(event, annotationID) {
    this.sidebar.edit(annotationID);
  }

  getAnnotationIdsWithConceptType(conceptTypes) {
    if (!conceptTypes) {
      return Array.from(this.annotations.keys()).sort();
    }
    // only return ids from annotations that match the defined type
    let result = [];
    for (let annotation of this.annotations.values()) {
      if (conceptTypes.includes(annotation.conceptName)) {
        result.push(annotation.id);
      }
    }
    return result.sort();
  }

  /**
   * Mouseover event on sidebar entry.
   * @param {Event} event the triggered event
   * @param {number} annotationID the corresponding annotation id
   */
  eventMouseOverSidebarElement(event, annotationID) {
    let annotation;
    if (!this.#annotations.has(annotationID)) {
      console.error('Element with id not found', annotationID);
      return;
    }
    annotation = this.#annotations.get(annotationID);
    annotation.highlightText(true);
  }

  /**
   * Mouseout event on sidebar entry.
   * @param {Event} event the triggered event
   * @param {number} annotationID the corresponding annotation id
   */
  eventMouseOutSidebarElement(event, annotationID) {
    let annotation;
    if (!this.#annotations.has(annotationID)) {
      console.error('Element with id not found', annotationID);
      return;
    }
    annotation = this.#annotations.get(annotationID);
    annotation.highlightText(false);
  }

  #handleAnnotationSelectionFromDocument(annotationId) {
    let annotation;
    annotation = this.#annotations.get(annotationId);
    if (this.#selectAnnotationFromDocumentType === undefined || this.#selectAnnotationFromDocumentType.includes(annotation.conceptName)) {
      // call callback function with annotation
      this.#selectAnnotationFromDocument(annotation);
      // disable the annotation slection from the html
      this.disableSelectAnnotationFromDocument();
    }      
  }

  #updateLastInteractedAnnotationOnClick(annotationId) {
    if (!ATSettings.updateInteractedAnnotationsWithClick) {
      return;
    }
    let concept = this.getAnnotationForId(annotationId).conceptName;
    if (concept) {
      this.setLastInteractionWithConcept(concept, annotationId);
    }
  }

  /**
   * Event: User clickt on highlighted annotation element in the text.
   * 
   * @param {Event} event the triggered event
   * @param {number} annotationID the corresponding annotation id
   */
  eventClickOnTextHighlight(event, annotationId) {
    if (this.#selectAnnotationFromDocument === null) {
      this.sidebar.scrollTo(annotationId);
      this.#updateLastInteractedAnnotationOnClick(annotationId);
    } else {
      this.#handleAnnotationSelectionFromDocument(annotationId);
    }
  }

  clickOnSidebarElementHandler(annotationId, target) {
    if (this.#selectAnnotationFromDocument === null) {
      if (target.tagName == 'BUTTON' || target.className == 'material-symbols-outlined') {
        return;
      }
      runtime.scrollToAnnotationInText(annotationId);
      this.#updateLastInteractedAnnotationOnClick(annotationId);
    } else {
      this.#handleAnnotationSelectionFromDocument(annotationId);
    }
  }
  /**
   * Click event on sidebar element.
   * @param {Event} event the triggered event
   */
  clickOnSidebarElement(event) {
    let id;
    id = event.currentTarget.dataset.customId;
    runtime.clickOnSidebarElementHandler(id, event.target);
  }

  /**
   * Event: User hovers on highlighted annotation element in the text.
   * 
   * @param {Event} event the triggered event
   * @param {number} annotationID the corresponding annotation id
   * @param {boolean} hover true if mouseover, false if mouseout
   */
  eventHoverOnTextHighlight(event, annotationID, hover) {
    runtime.mouseOverHighlight = hover;
    this.sidebar.highlightElement(annotationID, hover);
  }

  /**
   * Jump to a given annotation (sidebar and html-text).
   * The annotation target can be either defined in the event.taregt with using custom data
   * or as a second argument.
   * 
   * @param {Event} event the triggered event
   * @param {string} target (optional) the target id
   */
  gotoAnnotation(event, target=null) {
    let annotation;
    if (target !== null) {
      annotation = runtime.getAnnotationForId(target)
      if (annotation) {
        // scroll first the sidebar, because annotation scroll is smooth and async
        runtime.sidebar.scrollTo(target);
        annotation.scrollTo();
      }
    } else {
      annotation = runtime.getAnnotationForId(event.target.dataset.target)
      if (annotation) {
        runtime.sidebar.scrollTo(event.target.dataset.target);
        annotation.scrollTo();
      }
    }
  }

  #handleFileUpload(evt) {
    try {
        let files = evt.target.files;
        if (!files.length) {
          console.warn('No file selected!');
            return;
        }
        let file = files[0];
        let reader = new FileReader();
        reader.onload = fileReaderEvent;
        reader.readAsText(file);
    } catch (err) {
        console.error(err);
    }
  }

  uploadAnnotation() {
    let uploadAnchorNode;

    uploadAnchorNode = document.createElement('input');
    uploadAnchorNode.setAttribute("type", "file");
    uploadAnchorNode.setAttribute("accept", "application/json, .jsonld");
    // add to html - required for firefox
    // document.body.appendChild(uploadAnchorNode); 
    uploadAnchorNode.addEventListener('change', this.#handleFileUpload);
    uploadAnchorNode.click();
    // uploadAnchorNode.remove();
  }

  #exportAnnotationArray() {
    let array = [];
    for (let annotation of this.annotations.values()) {
      if (annotation.body.state === State.Creation) {
        // don't save annotations in creation phase
        continue;
      }
      if (annotation.body.state === State.Edit) {
        // dismiss unsaved changes
        annotation.body.cancel();
      }
      array.push(annotation);
    }
    return array;
  }

  #exportFragmentTargetsArray() {
    let array = [];
    for (let annotation of this.annotations.values()) {
      if (annotation.body.state === State.Creation) {
        // don't save annotations in creation phase
        continue;
      }
      array.push(annotation.target);
    }
    return array;
  }

  #exportAdditionalBodyInformation() {
    let array = [];
    /*
    for (let plugin of this.plugins.values()) {
      let res;
      res = plugin.toJSON();
      if (res) {
        array = array.concat(res);
      }
    }
    */
    let res = tagSetPlugin.toJSON();
    array = array.concat(res);

    return array;
  }

  #exportJSON() {
    let array = [];

    // add all annotations
    array = array.concat(this.#exportAnnotationArray());
    // add all fragment-targets
    array = array.concat(this.#exportFragmentTargetsArray());
    // add additional body information
    array = array.concat(this.#exportAdditionalBodyInformation());

    return array;
  }

  downloadAnnotation() {
    let jsonAnnotations;
    let dataStr, downloadAnchorNode;
    // create export values
    let array;
    array = this.#exportJSON();
    // export to json
    jsonAnnotations = JSON.stringify(array, null, " ");
    // create download
    dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonAnnotations);
    downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "annotations.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  /**
   * Imports annotations from json.
   * Does not yet initialize the bodys to avoid dependencies between references.
   * 
   * @param {Object} annotation the annotation json object
   * @param {Object} fragment the target-fragment json object
   * @returns {boolean} true if successfull import, false on error
   */
  loadAnnotationFromJSON(annotation, fragment) {
    let style;
    let range, selected, annotationObject, annotationBody, concept, body;
    let fragmentTarget, selector;
    let creator;
    // make sure id's stay unique
    if (this.#annotations.has(annotation.id)) {
      console.warn("Duplicate id: " + annotation.id + ".\nAnnotation will be ignored...");
      return false;
    }

    // read the fragment-target
    selector = new Map();
    for (let element of fragment.selector) {
      let sel;
      switch (element.type) {
        case "PathSelector":
          if (element.refinedBy && element.refinedBy.type === 'ListSelector') {
            let listSelector;
            listSelector = new ListSelector(Array());
            for (let listSel of element.refinedBy.vals) {
              let sel2;
              if (listSel.type !== 'PathSelector') {
                console.warn('Refined ListSelector should only contain selectors of the same type as outer selector', element);
                continue;
              }
              sel2 = new PathSelector(listSel.startPath, listSel.endPath);
              listSelector.addSelector(sel2);
            }
            sel = new DiscontinuesPathSelector(listSelector);
            selector.set("PathSelector", sel);
          } else {
            sel = new PathSelector(element.startPath, element.endPath);
            selector.set("PathSelector", sel);
          }
          break;
        case "OffsetSelector":
          sel = new OffsetSelector(element.start, element.end);
          selector.set("OffsetSelector", sel);
          break;
        default:
          console.warn("Selector of type: " + element.type + " currently not supported. Will be ignored...");
      }
    }
    fragmentTarget = new FragmentTarget(fragment.id, fragment.source, selector);
    // get creator of the annotation
    creator = annotation.creator;
    if (!ATSettings.creators.has(creator)) {
      let creatorObj;
      creatorObj = new Creator(creator);
      ATSettings.creators.set(creator, creatorObj);
    }
    // get concept of annotation
    concept = this.getABoSpecForName(annotation.body.type);

    // create body
    body = new TemplateBody(State.Display, concept.concept, true);

    if (ATSettings.useImportAnnotationStyle) {
      style = this.getStyleForName(ATSettings.importAnnotationStyle);
    } else {
      style = this.getStyleForName(this.getDefinedStyle(annotation.creator, concept));
    }
    // get the annotated text
    range = getRangeToXPath(selector.get("PathSelector").startPath, selector.get("PathSelector").endPath);
    selected = new TextHighlight(range, annotation.id, fragmentTarget, style);

    // create annotation object
    annotationObject = new AnnotationObject(annotation.id, fragmentTarget, selected, body, creator);
    // show annotation in html but not yet in sidebar
    annotationObject.showSelection();
    // save annotation for later use
    this.#annotations.set(annotation.id, annotationObject);
    return true;
  }

  initializeAnnotationValuesFromJSON(annotation) {
    // get the annotation object
    const annotationObject = runtime.getAnnotationForId(annotation.id);
    // initialize body values
    annotationObject.annotationBody.initializeValues(annotation.body);
    // show annotation in sidebar
    annotationObject.show(true);
  }

  /**
   * Check if node is contained within a MathML node.
   *
   * @param {Node} node A node in the document.
   * @return {boolean} Indicates weather node is within a MathMD node.
   */
  isMathNode(node) {
    while (node != null) {
      if (node.tagName == 'math') {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }

  /**
   * Filters annotations displayed by some user criteria.
   */
  filterAnnotations(bodyType, bodyVal) {
    let filter;

    filter = new Filter(bodyType, bodyVal);
    for (let annotation of this.#annotations.values()) {
      annotation.filter(filter);
    }
  }

  /**
   * Update the visibility of the annotations
   */
  updateVisibility() {
    for (let annotation of this.#annotations.values()) {
      annotation.updateVisibility();
    }
  }

  /**
   * Sort the annotations in the annotation sidebar by some user criteria.
   */
  sortAnnotation() {
    let sorter = '';
    this.sidebar.sort('');
  }

  changeAnnotationStyle(annotationId, styleName) {
    let annotation, style;
    annotation = this.getAnnotationForId(annotationId);
    style = this.getStyleForName(styleName);
    // change style
    annotation.changeAnnotationStyle(style);
  }

  selectAnnotationFromDocument(event, callback, types) {
    if (this.#selectAnnotationFromDocument !== null) {
      this.disableSelectAnnotationFromDocument();
    } else {
      this.enableSelectAnnotationFromDocument(callback, types);
    }
    event.stopPropagation();
  }

  keyupEventDocument(event) {
    if (event.key === "Escape") { // escape key maps to keycode `27`
      runtime.disableSelectAnnotationFromDocument();
      runtime.cancelReselect();
      runtime.cancelAddDicontinuity();
    }
  }

  enableSelectAnnotationFromDocument(callback, types) {
    document.body.style.cursor = "crosshair";
    document.addEventListener('keyup', this.keyupEventDocument);
    this.#selectAnnotationFromDocument = callback;
    this.#selectAnnotationFromDocumentType = types;
  }

  disableSelectAnnotationFromDocument() {
    document.body.style.removeProperty('cursor');
    document.removeEventListener('keyup', this.keyupEventDocument);
    this.#selectAnnotationFromDocument = null;
    this.#selectAnnotationFromDocumentType = undefined;
  }

  /**
   * Updates the annotation style for annotations of a specific creator.
   * @param {Creator} creator the creator for which to update the annotation style
   */
  changeAnnotationStyleForCreator(creator) {
    for (let anno of this.annotations.values()) {
      if (anno.creator === creator.id) {
        let style;
        style = runtime.getStyleForName(creator.annotationStyle);
        anno.changeAnnotationStyle(style);
      }
    }
  }

  /**
   * Updates the annotation style for annotations of a specific annotation-type.
   * @param {annoType} AnnotationBody the annotation type for which to update the annotation style
   */
  changeAnnotationStyleForType(creator) {
    for (let anno of this.annotations.values()) {

    }
  }

  /**
   * Synchronize the defined annotation style with the document.
   */
  syncAnnotationStyle() {
    for (let anno of runtime.annotations.values()) {
      let concept, currentStyle, definedStyle, overwritable;
      currentStyle = anno.styleClassName;
      concept = runtime.getABoSpecForName(anno.conceptName);
      definedStyle = runtime.getDefinedStyle(anno.creator, concept);
      if (definedStyle !== 'default' && currentStyle !== definedStyle) {
        let style;
        style = runtime.getStyleForName(definedStyle);
        anno.changeAnnotationStyle(style);
      }
      overwritable = runtime.userStylable(anno.creator, concept);
      anno.body.setStylable(overwritable);
    }
  }

  /**
   * 
   * @param {string} creatorId the id of the creator
   * @param {Concept} concept the body concept
   * @returns {string} the defined style (default if none)
   */
  getDefinedStyle(creatorId, concept) {
    let creator, body;
    let style = 'default';
    
    // priority - change in the futur to make more elegant
    if (ATSettings.creatorPriority) {
      if (concept && ATSettings.useTypeAnnotationStyle) {
        if (concept.style !== 'default') {
          style = concept.style;
        }
      }
      if (creatorId && ATSettings.useCreatorAnnotationStyle) {
        creator = ATSettings.creators.get(creatorId);
        if (creator.annotationStyle !== 'default') {
          style = creator.annotationStyle;
        }
      }
    } else {
      if (creatorId && ATSettings.useCreatorAnnotationStyle) {
        creator = ATSettings.creators.get(creatorId);
        if (creator.annotationStyle !== 'default') {
          style = creator.annotationStyle;
        }
      }
      if (concept && ATSettings.useTypeAnnotationStyle) {
        if (concept.style !== 'default') {
          style = concept.style;
        }
      }
    }
    return style;
  }

  /**
   * 
   * @param {string} creatorId the id of the creator
   * @param {string} cconcept the body concept
   */
  userStylable(creatorId, concept) {
    let creator;
    let overwriteProtected;
    // default value: false
    overwriteProtected = false;
    if (creatorId) {
      creator = ATSettings.creators.get(creatorId);
      overwriteProtected = overwriteProtected || (ATSettings.useCreatorAnnotationStyle && !creator.annotationStyleOverwritable);
    }
    if (concept) {
      overwriteProtected = overwriteProtected || (ATSettings.useTypeAnnotationStyle && !concept.styleOverwritable);
    }
    return !overwriteProtected;
  }

  keyupEventTemplateSelection(event) {
    if (['TEXTAREA', 'INPUT'].includes(event.target.tagName)) {
      return;
    }
    if (["1", "2", "3", "4", "5"].includes(event.key)) {
      runtime.sidebar.selectTemplate(parseInt(event.key));
    } else if (["0"].includes(event.key)) {
      runtime.sidebar.deselectTemplate();
    }
  }
}

/*
window.onresize = (event) => {
  document.body.style.removeProperty('width');
  document.body.style.width = document.body.clientWidth - 425 + 'px';
}
*/

// set runtime in browser_plugin.js or index.js
runtime = null;

/**
   * Convert hex to rgb color
   * @param {string} hex #hex color code
   * @returns {obj} rgb color as an object
   */
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Compute the relative luminance as defined in w3c guidelines. (https://www.w3.org/TR/WCAG20/#relativeluminancedef)
 * 
 * @param {string} color as css color code (hex, rgb, hsl)
 */
function computeLuminance(color) {
  let rgb, r, g, b, luminance;
  if (color.startsWith("#")) {
    rgb = hexToRgb(color);
  } else if (color.startsWith('rgb')) {
    let tmp = color.substring(4,color.length -1);
    tmp = tmp.split(',');
    rgb = {
      r: tmp[0],
      g: tmp[1],
      b: tmp[2]
    };
  } else if (color.startsWith('hsl')) {
    let tmp = color.substring(4,color.length -1);
    tmp = tmp.split(',');
    const HSLToRGB = (h, s, l) => {
      s /= 100;
      l /= 100;
      const k = n => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = n =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return [255 * f(0), 255 * f(8), 255 * f(4)];
    };
    tmp = HSLToRGB(tmp[0], tmp[1].substring(0, tmp[1].length - 1), tmp[2].substring(0, tmp[2].length - 1));
    rgb = {
      r: tmp[0],
      g: tmp[1],
      b: tmp[2]
    };
  } else {
    console.warn('Unknown color format: ', color);
    return 1;
  }
  
  r = rgb.r / 255.0;
  r = r <= 0.04045 ? r/12.92 : Math.pow(((r+0.055)/1.055), 2.4);
  g = rgb.g / 255.0;
  g = g <= 0.04045 ? g/12.92 : Math.pow(((g+0.055)/1.055), 2.4);
  b = rgb.b / 255.0;
  b = b <= 0.04045 ? b/12.92 : Math.pow(((b+0.055)/1.055), 2.4);
  
  luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance;
}
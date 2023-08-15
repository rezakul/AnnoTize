class Parser {
  static parseConfiguration(config) {
    let result = {};
    let baseConfig;
    let concepts;
    let tags = [];
    let documents = [];
    let files = new Map();
    for (let elem of config) {
      if (elem.type === "Configuration") {
        baseConfig = elem;
      } else if (elem.type === "Document") {
        documents.push(elem);
      } else if (elem.type === "Concepts") {
        concepts = elem;
      } else if (elem.type === "TagSet" || elem.type === "Tag") {
        tags.push(elem);
      }
    }
    if (!baseConfig || !documents) {
      console.error("Invalid configuration...");
      return null;
    }
    for (let doc of documents) {
      if (!baseConfig.documents.includes(doc.id)) {
        continue;
      }
      files.set(doc.file, doc);
    }
    result.config = baseConfig;
    result.files = files;
    result.concepts = concepts;
    result.tags = tags;
    return result;
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

      /*
      for (let plugin of runtime.plugins.values()) {
        if (plugin.informAboutImport(element.type)) {
          plugin.importFromJSON(element);
        }
      }
      */

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
    }
    
  }
}

/**
 * startTime = new Date();
 * // TEST
    endTime = new Date();
    var timeDiff = endTime - startTime; //in ms
    // strip the ms
    if (timeDiff > 500) {
      // get seconds 
    var seconds = Math.round(timeDiff / 1000);
    console.log(seconds + " seconds" + "  | " + timeDiff, annotation);
    }
 */
/**
 * Resolve the namespace for document evaluation.
 * 
 * @param {string} prefix 
 * @returns {string}
 */
function nsResolver(prefix) {
  var ns = {
    'mathml': 'http://www.w3.org/1998/Math/MathML',
    'h': 'http://www.w3.org/1999/xhtml'
  };
  return ns[prefix];
}

/**
 * Calculates the XPath to a given node.
 * 
 * @param {Node} node the node to where the XPath should be calculated
 * @param {string} currentPath the current XPath
 * @param {boolean} xml flag that indicates that the source document is a xml document
 * @returns {string} the XPath to the given node
 */
function makeXPath(node, currentPath = "", xml=false) {
  /* this should suffice in HTML documents for selectable nodes, XML with namespaces needs more code */
  currentPath = currentPath || '';
  switch (node.nodeType) {
    case 3:
    case 4:
      // ignore text nodes
      return makeXPath(node.parentNode, currentPath, xml);
    case 1:
      let nodeName;
      // ignore annotation elements for the XPath
      if (node.tagName === "ANNOTATION-HIGHLIGHT") {
        return makeXPath(node.parentNode, currentPath, xml);
      }
      // get the node name (differs for xml documents)
      if (xml) {
        if (!node.dataset.origname) {
          // ignore nodes with no origname (node was not an actual node of tei xml)
          return makeXPath(node.parentNode, "*/" + currentPath, xml);
        } 
        nodeName = node.dataset.origname;
      } else {
        nodeName = node.tagName;
      }
      // use correct namespace for mathml
      if (runtime.isMathNode(node)) {
        return makeXPath(node.parentNode, nodeName + '[' + (document.evaluate('preceding-sibling::' + 'mathml:' + node.tagName, node, nsResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength + 1) + ']' + (currentPath ? '/' + currentPath : ''), xml);
      } else {
        return makeXPath(node.parentNode, nodeName + '[' + (document.evaluate('preceding-sibling::' + node.tagName, node, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength + 1) + ']' + (currentPath ? '/' + currentPath : ''), xml);
      }
    case 9:
      return '/' + currentPath;
    default:
      return '';
  }
}

/**
 * Calculates the offset inside of the node. Only text nodes are considered.
 * The offset might be different from the given offset because there could be multiple text nodes before the given node.
 * 
 * @param {Node} node the node to where the xpath offset should be calculated
 * @param {number} offset the offset inside of the node
 * @returns {string} the XPath offset
 */
function getXPathOffset(node, offset) {
  let result = offset;
  let parent;

  // offset will only be different if node is a text node or annotation-highlight node
  if (node.nodeType !== Node.TEXT_NODE && !(node.nodeType === Node.ELEMENT_NODE && node.tagName === "ANNOTATION-HIGHLIGHT")) {
    return offset;
  }

  parent = node.parentNode;
  do {
    // add all text content in nodes before to offset
    for (let i = 0; i < parent.childNodes.length; ++i) {
      let textLen;
      let child = parent.childNodes[i];
      if (child.isSameNode(node)) {
        break;
      }
      textLen = Array.from(child.textContent).length;
      result += textLen;
    }
    // add text content length as long as inside annotation element
    node = parent;
    parent = parent.parentNode;
  } while (node.nodeType === 1 && node.tagName === "ANNOTATION-HIGHLIGHT");

  return result;
}

/**
 * Pretty printing: all to lower case and remove [1] indexes
 * @param {string} xpath the XPath
 * @returns {string} pretty XPath
 */
function prettyPrintXPath(xpath) {
  // make xpath lower case letter
  xpath = xpath.toLowerCase();
  // remove index if it is the first element
  xpath = xpath.replaceAll("[1]", "");
  return xpath;
}

/**
 * Calculates the XPath to a given node.
 * 
 * @param {Node} node the node to where the XPath should be calculated
 * @param {number} offset the offset inside of the node
 * @param {boolean} start flag hint that indicates if the XPath is the start or end path of the target
 * @returns {string} the XPath to the given node
 */
function getXPathToNode(node, offset=0, start=true) {
  // check if document is xml document
  const xml = document.body.dataset.doctype === 'xml';
  let xpath = "";
  let actualOffset;
  let nodeAfterHint = false;
  // get the node the offset points to
  if (node.nodeType !== Node.TEXT_NODE && offset !== 0) {
    let children = node.childNodes;
    if (offset == children.length) {
      node = node.childNodes[offset - 1];
      // XPath should start with 'after-node' prefix
      nodeAfterHint = true;
    } else {
      node = node.childNodes[offset];
    }
    offset = 0;
  }
  // treat text node for end xpath special: don't create char offset if all characters are includes
  if (node.nodeType === Node.TEXT_NODE && start === false) {
    let textLen = Array.from(node.textContent).length;
    // all characters of node are included -> include whole node
    if (textLen === offset && node.nextSibling === null) {
      xpath = makeXPath(node.parentElement, "", xml);
      // pretty print
      if (!xml) {
        xpath = prettyPrintXPath(xpath);
      }
      xpath = "after-node(" + xpath + ")";
      return xpath;
    }
  }
  xpath = makeXPath(node, "", xml);
  // pretty print
  if (!xml) {
    xpath = prettyPrintXPath(xpath);
  }
  
  // calculate correct offset
  actualOffset = getXPathOffset(node, offset);
  if (actualOffset == 0) {
    // no offset -> xPath to node
    if (nodeAfterHint) {
      xpath = "after-node(" + xpath + ")";
    } else {
      xpath = "node(" + xpath + ")";
    }
  } else {
    // offset -> XPath to char
    xpath = "char(" + xpath + "," + actualOffset + ")";
  }
  return xpath;
}

/**
 * Get the node a given XPath points to.
 * 
 * @param {string} xpath the XPath to the node
 * @returns {Node} the corresponding node
 */
function getElementByXPath(xpath) {
  const xml = document.body.dataset.doctype === 'xml';
  // preprocess XPath for evaluation
  xpath = preprocessXPath(xpath, xml);
  // use js evaluate
  const result = document.evaluate(
    xpath,
    document,
    nsResolver,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue;
  if (result === null) {
    console.warn('Could not resolve XPath: ', xpath);
  }
  return result;
}

/**
 * Loop over the text content of the given node and retrieve the correct child-node that corresponds to the given offset.
 * 
 * @param {Node} node the ancestor node in with textContent 
 * @param {number} offset the offset in the textContent of node
 * @param {boolean} startPoint indicates whether this is the startXPath (true) or endXPath (false)
 * @returns [node, offset] - the leaf node and the offset that contain the character specified in the xPath 
 */
function loopOverTextContent(node, offset, startPoint) {
  let result = null;
  let tmpOffset = 0;

  // loop over all children
  for (let i = 0; i < node.childNodes.length; ++i) {
    let child, textLen;
    child = node.childNodes[i];
    // create array and don't use textContent.length immediately to always get the correct number of Unicode character
    textLen = Array.from(child.textContent).length;
    // if its the end-xPath than >= if its the start-xPath than only >
    if (i === node.childNodes.length - 1 || textLen + tmpOffset > offset || (!startPoint && textLen + tmpOffset == offset)) {
      if (child.nodeType !== Node.TEXT_NODE) {
        // recursive call to children
        result = loopOverTextContent(child, offset - tmpOffset);
      } else {
        result = [child, offset - tmpOffset];
      }
      return result;
    }
    tmpOffset += textLen;
  }
}

/**
 * Preprocess xPath for xml documents.
 * 
 * @param {string} xPath the plain xPath
 * @returns {string} the processed xPath
 */
function processXMLPath(xPath) {
  // add /html/body to xPath, because converted html always has this structure
  let result = "/html/body";
  let nodeTags = xPath.slice(1).split("/");
  let start;
  if (nodeTags[0] == "*" && nodeTags[1] == "*") {
    // remove '*' wildcard if present
    start = 2;
  } else {
    start = 0;
  }
  for (let nodeTag of nodeTags.slice(start)) {
    if (nodeTag !== "*") {
      // add 'tei-' prefix 
      result += "/tei-" + nodeTag.toLowerCase();
    } else {
      // don't use original data nodes for duplicates as they are not render to the user
      result += "/*[not(@data-original)]";
    }
  }
  return result;
}

/**
 * Preprocess the xPath so it can be evaluated.
 * 
 * Inserts optional tbody tag for table nodes,
 * sets mathml namespace and corrects xml paths.
 *  
 * @param {string} xPath the plain xpath to a node
 * @param {boolean} xml flag indicating if xPath belongs to a xml document 
 * @returns 
 */
function preprocessXPath(xPath, xml=false) {
  if (xml) {
    // custom treatment for xml path, because they might not align with html structure
    xPath = processXMLPath(xPath);
  }
  // check if table node -> adapt optional tbody tag
  if (xPath.includes('table')) {
    let tagsOld, tagsNew, len;

    // replace tbody wildcard with tbody (wildcard cant be evaluated)
    xPath = xPath.replaceAll('(tbody|self::*)', 'tbody');

    tagsOld = xPath.split("/");
    tagsNew = [];
    len = tagsOld.length;
    // insert tbody if not already present (e.g. through wildcard)
    // this is necessary, since browsers will introduce tbody tag, even when not present in original document
    for (let i = 0; i < len - 1; ++i) {
      tagsNew.push(tagsOld[i]);
      if (tagsOld[i].startsWith('table') && tagsOld[i+1].startsWith('tr')) {
        tagsNew.push("tbody");
      }
    }
    tagsNew.push(tagsOld[len-1]);
    xPath = tagsNew.join("/");
  }
  // set mathml namespace
  if (xPath.includes('/math')) {
    let tagsOld, tagsNew, len, inMath;

    tagsOld = xPath.split("/");
    tagsNew = [];
    len = tagsOld.length;
    inMath = false;
    for (let i = 0; i < len; ++i) {
      let name;
      if (tagsOld[i].includes('math')) {
        inMath = true;
      }
      // don't set namespace for text nodes in mathml
      if (tagsOld[i] === 'a' || tagsOld[i].includes('a[') || tagsOld[i] === 'span' || tagsOld[i].includes('span[')) {
        inMath = false;
      }
      if (inMath) {
        // add namespace before tag name
        name = "mathml:" + tagsOld[i]
      } else {
        name = tagsOld[i];
      }
      tagsNew.push(name);
    }
    xPath = tagsNew.join("/");
  }
  return xPath;
}

/**
 * Get the plain xPath without the node, after-node or char prefix.
 * 
 * @param {string} xPath the custom format xPath
 * @returns {string} the plain xPath
 */
function extractXPathFromCustomFormat(xPath) {
  let path;
  if (xPath.startsWith('node')) {
    // split the path to remove the 'node' prefix
    path = xPath.substring(5, xPath.length - 1);
  } else if (xPath.startsWith('after-node')) {
    // split the path to remove the 'after-node' prefix
    path = xPath.substring(11, xPath.length - 1);
  } else if (xPath.startsWith('char')) {
    // split the path to remove the 'char' prefix and offset
    path = xPath.split(",")[0].substring(5);
  } else {
    console.warn('Unknown xPath prefix: ', xPath);
  }
  return path;
}


/**
 * Calculates the js range to a given start and end xPath.
 * 
 * The expected syntax is from the form:
 * 'node(/html/body/...)'
 * Allowed xPath refiners are:
 * - node(xPath): the node the xPath points to
 * - after-node(xPath): the node after the node the xPath points to
 * - char(xPath, offset): a character in the node, given by the offset
 * 
 * @param {string} start the start xPath (included in range)
 * @param {string} end the end xPath (excluded in range)
 * @returns {Range} the corresponding range
 */
function getRangeToXPath(start, end) {
  let element, path, offset, res;
  let range = new Range();
  // get the start point of the range
  if (start.startsWith('node')) {
    let parent, idx;
    // split the path to remove the 'node' prefix
    path = start.substring(5, start.length - 1);
    // get the element the xpath revers to
    element = getElementByXPath(path);
    // set the start to the element by using its parent element and an offset
    parent = element.parentNode;
    idx = Array.from(parent.childNodes).indexOf(element);
    range.setStart(parent, idx);
  } else if (start.startsWith('after-node')) {
    // split the path to remove the 'after-node' prefix
    path = start.substring(11, start.length - 1);
    // get the element the xpath revers to
    element = getElementByXPath(path);
    // set start after this node
    range.setStartAfter(element);
  } else if (start.startsWith('char')) {
    // split the path to remove the 'char' prefix and offset
    path = start.split(",")[0].substring(5);
    // get the element the xpath revers to
    element = getElementByXPath(path);
    // get the offset
    offset = start.split(",")[1].substring(0, start.split(",")[1].length - 1);
    // get the correct node inside the parent node (if multiple text-nodes inside target)
    res = loopOverTextContent(element, offset, true);
    range.setStart(res[0], res[1]);
  } else {
    throw new Error("Currently only 'node', 'after-node' and 'char' are supported for xPath prefixes");
  }
  // get the end point of the range
  if (end.startsWith('node')) {
    path = end.substring(5, end.length - 1);
    element = getElementByXPath(path);
    range.setEndBefore(element);
  } else if (end.startsWith('after-node')) {
    path = end.substring(11, end.length - 1);
    element = getElementByXPath(path);
    range.setEndAfter(element);
  } else if (end.startsWith('char')) {
    path = end.split(",")[0].substring(5);
    element = getElementByXPath(path);
    offset = end.split(",")[1].substring(0, end.split(",")[1].length - 1);
    res = loopOverTextContent(element, offset, false);
    range.setEnd(res[0], res[1]);
  } else {
    throw new Error("Currently only 'node', 'after-node' and 'char' are supported for xPath prefixes");
  }
  return range;
}
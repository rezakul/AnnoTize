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
 * Calculates the xpath to a given node.
 * 
 * @param {Node} node the node to where the xpath should be calculated
 * @param {string} currentPath the current xpath
 * @returns {string} the xpath to the given node
 */
function makeXPath(node, currentPath = "") {
  /* this should suffice in HTML documents for selectable nodes, XML with namespaces needs more code */
  currentPath = currentPath || '';
  switch (node.nodeType) {
    case 3:
    case 4:
      // ignore text nodes
      return makeXPath(node.parentNode, currentPath);
      // return makeXPath(node.parentNode, 'text()[' + (document.evaluate('preceding-sibling::text()', node, nsResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength + 1) + ']');
    case 1:
      // ignore annotation elements for the xPath
      if (node.tagName === "ANNOTATION-HIGHLIGHT") {
        return makeXPath(node.parentNode, currentPath);
      }
      if (runtime.isMathNode(node)) {
        return makeXPath(node.parentNode, node.tagName + '[' + (document.evaluate('preceding-sibling::' + 'mathml:' + node.tagName, node, nsResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength + 1) + ']' + (currentPath ? '/' + currentPath : ''));
      } else {
        // TODO: nsResolver fails in Firefox, why?
        return makeXPath(node.parentNode, node.tagName + '[' + (document.evaluate('preceding-sibling::' + node.tagName, node, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength + 1) + ']' + (currentPath ? '/' + currentPath : ''));
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

function prettyPrintXPath(xpath) {
  // make xpath lower case letter
  xpath = xpath.toLowerCase();
  // remove index if it is the first element
  xpath = xpath.replaceAll("[1]", "");
  return xpath;
}

/**
 * Calculates the XPath to a given node and performes some prettyprinting on it.
 * 
 * @param {Node} node the node to where the xpath should be calculated
 * @param {number} offset the offset inside of the node
 * @param {boolean} start flag hint that indicates if the X-Path is the start or end path of the target
 * @returns {string} the XPath to the given node
 */
function getXPathToNode(node, offset=0, start=true) {
  // TODO: offset
  console.log(node, offset);
  let xpath = "";
  let actualOffset;
  let nodeAfterHint = false;
  if (node.nodeType !== Node.TEXT_NODE && offset !== 0) {
    let children = node.childNodes;
    if (offset == children.length) {
      node = node.childNodes[offset - 1];
      nodeAfterHint = true;
    } else {
      node = node.childNodes[offset];
    }
    offset = 0;
  }
  if (node.nodeType === Node.TEXT_NODE && start === false) {
    let textLen = Array.from(node.textContent).length;
    if (textLen === offset && node.nextSibling === null) {
      xpath = makeXPath(node.parentElement);
      // pretty print
      xpath = prettyPrintXPath(xpath);
      xpath = "after-node(" + xpath + ")";
      return xpath;
    }
  }
  xpath = makeXPath(node);
  // pretty print
  xpath = prettyPrintXPath(xpath);
  
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
    // offset -> xPath to char
    xpath = "char(" + xpath + "," + actualOffset + ")";
  }
  console.log(xpath);
  return xpath;
}

/**
 * Get the node a given xpath points to.
 * 
 * @param {string} xpath the XPath to the node
 * @returns {Node} the corresponding node
 */
function getElementByXPath(xpath) {
  xpath = preprocessXPath(xpath);
  const result = document.evaluate(
    xpath,
    document,
    nsResolver,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue;
  if (result === null) {
    console.warn('Could not resolve X-Path: ', xpath);
  }
  return result;
}

/**
 * Loop over the text content of the given node and retrieve the correct child-node that coressponds to the given offset.
 * 
 * @param {Node} node the ancestor node in with textContent 
 * @param {number} offset the offset in the textContent of node
 * @param {boolean} startPoint indicates wheather this is the startXPath (true) or endXPath (false)
 * @returns 
 */
function loopOverTextContent(node, offset, startPoint) {
  let result = null;
  let tmpOffset = 0;

  for (let i = 0; i < node.childNodes.length; ++i) {
    let child, textLen;
    child = node.childNodes[i];
    // create array and don't use textContent.length immediately to always get the correct number of Unicode character
    textLen = Array.from(child.textContent).length;
    // if its the end-xPath than >= if its the start-xPath than only >
    if (i === node.childNodes.length - 1 || textLen + tmpOffset > offset || (!startPoint && textLen + tmpOffset == offset)) {
      if (child.nodeType !== Node.TEXT_NODE) {
        result = loopOverTextContent(child, offset - tmpOffset);
      } else {
        result = [child, offset - tmpOffset];
      }
      return result;
    }
    tmpOffset += textLen;
  }
}

/*
function getMathElementByXPath(path) {
  let element, math;
  let firstPath, mathPath, idx;

  firstPath = path.split("math")[0];
  firstPath = firstPath.substring(0, firstPath.length-1);
  // get math subpath
  mathPath = path.split("math")[1];
  mathPath = mathPath.split("/");
  if (mathPath[0].length === 0) {
    idx = 0;
  } else {
    idx = parseInt(mathPath[0].substring(1, mathPath[0].length - 1) - 1);
  }
  // console.log(mathPath);
  //firstPath = "/html/body/div/div/article/section[6]/div[5]/div";
  element = getElementByXPath(firstPath);
  if (element === null) {
    return null;
  }
  // TODO undefined
  // console.log(element, firstPath);
  math = element.getElementsByTagName('math')[[idx]];
  for (let i = 1; i < mathPath.length; ++i) {
    element = mathPath[i].split("[");
    // first element with no index
    if (element.length === 1) {
      idx = 1;
    } else {
      idx = parseInt(element[1].substring(0, element[1].length - 1));
    }
    let counter = 1;
    let found = false;
    for (let child of math.childNodes) {
      if (child.tagName === element[0]) {
        if (counter === idx) {
          math = child;
          found = true;
          break;
        } else {
          counter += 1;
        }
      }
    }
    if (found === false) {
      console.warn('Error in XPath Handler with path: ' + path);
    }
    // math = math.getElementsByTagName(elem[0])[elem[1].substring(0, elem[1].length - 1) - 1];
    // console.log(math);
  }
  return math;
}
*/

function preprocessXPath(xPath) {
  if (xPath.includes('table')) {
    let tagsOld, tagsNew, len;

    // replace wildcard
    xPath = xPath.replaceAll('(tbody|self::*)', 'tbody');

    tagsOld = xPath.split("/");
    tagsNew = [];
    len = tagsOld.length;
    for (let i = 0; i < len - 1; ++i) {
      tagsNew.push(tagsOld[i]);
      if (tagsOld[i].startsWith('table') && tagsOld[i+1].startsWith('tr')) {
        tagsNew.push("tbody");
      }
    }
    tagsNew.push(tagsOld[len-1]);
    xPath = tagsNew.join("/");
  }
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
      if (tagsOld[i] === 'a' || tagsOld[i].includes('a[') || tagsOld[i] === 'span' || tagsOld[i].includes('span[')) {
        inMath = false;
      }
      if (inMath) {
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

function extractXPathFromCustomFormat(xpath) {
  let path;
  if (xpath.startsWith('node')) {
    // split the path to remove the 'node' prefix
    path = xpath.substring(5, xpath.length - 1);
  } else if (xpath.startsWith('after-node')) {
    // split the path to remove the 'after-node' prefix
    path = xpath.substring(11, xpath.length - 1);
  } else if (xpath.startsWith('char')) {
    // split the path to remove the 'char' prefix and offset
    path = xpath.split(",")[0].substring(5);
  } else {
    console.warn('Unknown x-path prefix: ', xpath);
  }
  return path;
}

function extractXPathCharOffset(xpath) {
  let offset;
  if (!xpath.startsWith('char')) {
    console.warn('Offset only valid for "char" prefix on xpath: ', xpath);
    return 0;
  }
  // get the offset
  offset = xpath.split(",")[1].substring(0, xpath.split(",")[1].length - 1);
  // parse to int
  offset = parseInt(offset);
  return offset;
}

function getRangeToXPath(xPathStart, xPathEnd) {
  let element, path, offset, res;
  let range = new Range();
  // start
  if (xPathStart.startsWith('node')) {
    let parent, idx;
    // split the path to remove the 'node' prefix
    path = xPathStart.substring(5, xPathStart.length - 1);
    // get the element the xpath revers to
    element = getElementByXPath(path);
    // set the start to the element by using its parent element and an offset
    parent = element.parentNode;
    idx = Array.from(parent.childNodes).indexOf(element);
    range.setStart(parent, idx);
  } else if (xPathStart.startsWith('after-node')) {
    // split the path to remove the 'after-node' prefix
    path = xPathStart.substring(11, xPathStart.length - 1);
    // get the element the xpath revers to
    element = getElementByXPath(path);
    // set start after this node
    range.setStartAfter(element);
  } else if (xPathStart.startsWith('char')) {
    // split the path to remove the 'char' prefix and offset
    path = xPathStart.split(",")[0].substring(5);
    // get the element the xpath revers to
    element = getElementByXPath(path);
    // get the offset
    offset = xPathStart.split(",")[1].substring(0, xPathStart.split(",")[1].length - 1);
    // get the correct node inside the parent node (if multiple text-nodes inside target)
    res = loopOverTextContent(element, offset, true);
    range.setStart(res[0], res[1]);
  } else {
    throw new Error("Currently only 'node', 'after-node' and 'char' are supported for xPath prefixes");
  }
  // end
  if (xPathEnd.startsWith('node')) {
    // split the path to remove the 'node' prefix
    path = xPathEnd.substring(5, xPathEnd.length - 1);
    // get the element the xpath revers to
    element = getElementByXPath(path);
    range.setEndBefore(element);
    console.log(range, range.toString());
  } else if (xPathEnd.startsWith('after-node')) {
    path = xPathEnd.substring(11, xPathEnd.length - 1);
    // TODO: support math nodes - nicer way would be with evaluate and correct namespace
    /*
    if (path.includes('math')) {
      element = getMathElementByXPath(path);
    } else {
      element = getElementByXPath(path);
    }
    */
    element = getElementByXPath(path);
    range.setEndAfter(element);
  } else if (xPathEnd.startsWith('char')) {
    path = xPathEnd.split(",")[0].substring(5);
    // TODO: support math nodes - nicer way would be with evaluate and correct namespace
    /*
    if (path.includes('math')) {
      element = getMathElementByXPath(path);
    } else {
      element = getElementByXPath(path);
    }
    */
    element = getElementByXPath(path);
    offset = xPathEnd.split(",")[1].substring(0, xPathEnd.split(",")[1].length - 1);
    res = loopOverTextContent(element, offset, false);
    range.setEnd(res[0], res[1]);
  } else {
    throw new Error("Currently only 'node', 'after-node' and 'char' are supported for xPath prefixes");
  }
  return range;
}
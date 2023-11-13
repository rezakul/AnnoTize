class Selector {
  #discontinuous;

  constructor (discontinuous=false) {
    this.#discontinuous = discontinuous;
  }

  get discontinuous() {
    return this.#discontinuous;
  }

  /**
   * Export the selector to json.
   * 
   * @param {any} key a key may given by JSON.stringify()
   * 
   * @returns {object} (JSON) stringifyable object
   */
  toJSON(key) {
    // Implement in derived class
  }
}

class ListSelector {
  #list;

  constructor(list=[]) {
    this.#list = [];
    for (let entry of list) {
      // add selectors so list is ordered
      this.addSelector(entry);
    }
  }

  /**
   * The list of selectors
   * @returns {Array<Selector>}
   */
  get list() {
    return this.#list;
  }

  get length() {
    return this.list.length;
  }

  /**
   * Add a selector to the list so list keeps in order.
   * @param {Selector} selector the selector to add
   */
  addSelector(selector) {
    if (this.length === 0) {
      this.#list.push(selector);
      return;
    }
    // range of the new selector
    let rangeNew = getRangeToXPath(selector.startPath, selector.endPath);
    // add into sorted list + check if overlaps with other selectors
    for (let i = 0; i < this.length; ++i) {
      let rangeEntry;
      // get current list entry
      const entry = this.#list[i];
      // range of the current entry in the list
      rangeEntry = getRangeToXPath(entry.startPath, entry.endPath);

      if (rangeNew.compareBoundaryPoints(Range.START_TO_END, rangeEntry) === -1) {
        // new selector is before current entry
        this.#list.splice(i, 0, selector);
        return;
      }
      if (rangeNew.compareBoundaryPoints(Range.END_TO_START, rangeEntry) === 1) {
        // new selector is after current entry
        continue;
      }
      // range overlaps with current entry
      let newSelector, newXPathStart, newXPathEnd;
      if (rangeNew.compareBoundaryPoints(Range.START_TO_START, rangeEntry) === -1) {
        newXPathStart = selector.startPath;
      } else {
        newXPathStart = entry.startPath;
      }
      if (rangeNew.compareBoundaryPoints(Range.END_TO_END, rangeEntry) === -1) {
        newXPathEnd = entry.endPath;
      } else {
        newXPathEnd = selector.endPath;
      }
      // create new selector
      newSelector = new PathSelector(newXPathStart, newXPathEnd);
      // remove current entry
      this.#list.splice(i, 1);
      // insert new entry
      this.addSelector(newSelector);
      return;
    }
    // push if after all other
    this.#list.push(selector);
  }

  removeSelector(selector) {
    // TODO
  }

  /**
   * Export the list selector to json.
   * 
   * @param {any} key a key may given by JSON.stringify()
   * 
   * @returns {object} (JSON) stringifyable object
   */
  toJSON(key) {
    let json;
    
    json = {};
    json.type = "ListSelector";
    json.vals = this.list;

    return json;
  }
}

/**
 * The path selector.
 * Contains an start and end x-path to the target.
 */
class PathSelector extends Selector {
  #startPath;
  #endPath;

  constructor(startPath, endPath) {
    super(false);
    this.#startPath = startPath;
    this.#endPath = endPath;
  }

  /**
   * The start x-path to the target (inclusive)
   */
  get startPath() {
    return this.#startPath;
  }

  set startPath(val) {
    this.#startPath = val;
  }

  /**
   * The end x-path to the target (exclusive)
   */
  get endPath() {
    return this.#endPath;
  }

  set endPath(val) {
    this.#endPath = val;
  }

  /**
   * Export the path selector to json.
   * 
   * @param {any} key a key may given by JSON.stringify()
   * 
   * @returns {object} (JSON) stringifyable object
   */
  toJSON(key) {
    var regex = /\/\*/g;
    let json = {};
    json.type = "PathSelector";
    json.startPath = this.startPath.replace(regex, '');
    json.endPath = this.endPath.replace(regex, '');
    return json;
  }
}

/**
 * A path selector that has some discontinuity
 */
class DiscontinuesPathSelector extends Selector {
  #refinedList;

  /**
   * Create a new discontinues path selector
   * @param {ListSelector} refined 
   */
  constructor(refined) {
    super(true);
    this.#refinedList = refined;
  }

  /**
   * The start x-path to the target (inclusive)
   */
  get startPath() {
    if (this.listSelector.length === 0) {
      return "";
    }
    // list is oredered
    return this.listSelector.list[0].startPath;
  }

  /**
   * The end x-path to the target (exclusive)
   */
  get endPath() {
    if (this.listSelector.length === 0) {
      return "";
    }
    // list is oredered
    return this.listSelector.list[this.listSelector.length-1].endPath;
  }

  /**
   * Get the refiend ListSelector.
   * @returns {ListSelector}
   */
  get listSelector() {
    return this.#refinedList;
  }

  /**
   * Add a selector to the discontinues selector
   * @param {PathSelector} selector the path selector to add
   */
  addSelector(selector) {
    this.listSelector.addSelector(selector);
  }

  /**
   * Export the path selector to json.
   * 
   * @param {any} key a key may given by JSON.stringify()
   * 
   * @returns {object} (JSON) stringifyable object
   */
  toJSON(key) {
    let json = {};
    json.type = "PathSelector";
    json.startPath = this.startPath;
    json.endPath = this.endPath;
    json.refinedBy = this.#refinedList.toJSON();
    return json;
  }
}

/**
 * The offset selector.
 * Contains an start and end offset to the target.
 */
class OffsetSelector extends Selector {
  #start;
  #end;

  constructor(start, end) {
    super();
    this.#start = start;
    this.#end = end;
  }

  /**
   * The start offset to the target
   */
  get start() {
    return this.#start;
  }

  set start(val) {
    this.#start = val;
  }

  /**
   * The end offset to the target
   */
  get end() {
    return this.#end;
  }

  set end(val) {
    this.#end = val;
  }

  /**
   * Export the offset selector to json.
   * 
   * @param {any} key a key may given by JSON.stringify()
   * 
   * @returns {object} (JSON) stringifyable object
   */
    toJSON(key) {
      let json = {};
      json.type = "OffsetSelector";
      json.startPath = this.start;
      json.endPath = this.end;
      return json;
    }
}


/**
 * The fragment traget of an annotation.
 * Holds information about the selectors and source.
 */
class FragmentTarget {
  #id;
  #source;
  #selector;

  /**
   * Create a new fragment target.
   * @param {string} id the unique target id 
   * @param {string} source the source
   * @param {Map<string,Selector>} selector the target selector
   */
  constructor(id, source, selector) {
    this.#id = id;
    this.#source = source;
    this.#selector = selector;
  }

  /**
   * The unique FragmentTarget id.
   */
  get id() {
    return this.#id;
  }

  /**
   * The html source file of the FragmentTarget.
   */
  get source() {
    return this.#source;
  }

  /**
   * The target selectors (i.e. PathSelector, OffsetSelector,...).
   */
  get selector() {
    return this.#selector;
  }

  /**
   * The PathSelector to the target (if present).
   * @returns {PathSelector}
   */
  get pathSelector() {
    if (!this.#selector.has("PathSelector")) {
      console.warn("This 'FragmentTarget' has no 'PathSelector' defined.");
      return null;
    }
    return this.#selector.get("PathSelector");
  }

  /**
   * The OffsetSelector to the target (if present).
   * @returns {OffsetSelector}
   */
  get offsetSelector() {
    if (!this.#selector.has("OffsetSelector")) {
      console.warn("This 'FragmentTarget' has no 'OffsetSelector' defined.");
      return null;
    }
    return this.#selector.get("OffsetSelector");
  }

  /**
   * Check if the FragmentTarget has a PathSelector defined.
   * @returns {boolean} true if FragmentTarget has a PathSelector defined.
   */
  hasPathSelector() {
    return this.#selector.has("PathSelector");
  }

  /**
   * Check if the FragmentTarget has a OffsetSelector defined.
   * @returns {boolean} true if FragmentTarget has a OffsetSelector defined.
   */
  hasOffsetSelector() {
    return this.#selector.has("OffsetSelector");
  }

  /**
   * Export the fragment target to json.
   * 
   * @param {any} key a key may given by JSON.stringify()
   * 
   * @returns {object} (JSON) stringifyable object
   */
  toJSON(key) {
    let json = {};
    json.type = "FragmentTarget";
    json.id = this.id;
    json.source = this.source;
    json.selector = [];
    for (let value of this.#selector.values()) {
      json.selector.push(value.toJSON());
    }
    return json;
  }
}
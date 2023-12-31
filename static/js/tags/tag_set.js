/**
 * Control structure for a tag set.
 * A tag set holds multiple tags of some category and can have a label and description.
 */
class TagSet {
  #id;                // the unique tag set id
  #tags;              // a list of all tags
  #label;             // the (optional) label
  #comment;           // the (optional) description
  #visibility;        // flag if tag set is displayed
  #autoGenerated;     // flag if tag set was automatically generated (used to remove dependencies during import)

  /**
   * Create a new tag-set containing tags of a semantic group.
   * @param {string} id the unique TagSet id
   * @param {Array<Tag>} tags tags for this TagSet
   * @param {string} label human readable label
   * @param {string} comment additional information
   * @param {boolean} auto indicates whether TagSet was automatically generated (import of Tag without TagSet)
   */
  constructor(id, tags, label, comment, auto=false) {
    this.#id = id;
    this.#tags = tags;
    for (let idx = 0; idx < tags.length; ++idx) {
      let tag = tags[idx];
      tag.register(this);
    }
    // sort tags
    this.#tags.sort(this.#tagSortCmp);
    this.#label = label;
    this.#comment = comment;
    this.#visibility = true;
    this.#autoGenerated = auto;
  }

  /**
   * Unique TagSet id.
   */
  get id() {
    return this.#id;
  }

  set id(val) {
    this.#id = val;
  }

  /**
   * Human readable TagSet label.
   */
  get label() {
    return this.#label;
  }

  set label(val) {
    this.#label = val;
  }

  /**
   * Additional TagSet information.
   */
  get comment() {
    return this.#comment;
  }

  set comment(val) {
    this.#comment = val;
  }

  /**
   * All Tags belonging to this TagSet.
   */
  get tags() {
    return this.#tags;
  }

  get visibility() {
    return this.#visibility;
  }

  set visibility(val) {
    this.#visibility = val;
    for (let tag of this.tags) {
      tag.visibility = val;
    }
  }

  /**
   * Indicates whether TagSet was automatically generated.
   */
  get autoGenerated() {
    return this.#autoGenerated;
  }

  set autoGenerated(val) {
    this.#autoGenerated = val;
  }

  /**
   * Export this tagSet to json.
   * 
   * @param {any} key a key may given by JSON.stringify()
   * @returns {object} (JSON) stringifyable object
   */
  toJSON(key) {
    let json = {};
    let tags = [];

    json.type = "TagSet";
    json.id = this.id;
    for (let tag of this.#tags) {
      tags.push(tag.id);
    }
    json.belongsTo_Rev = tags;
    json.label = this.label;
    if (this.comment !== "") {
      json.comment = this.comment;
    }

    return json;
  }

  /**
   * Set the visibility of the TagSet without updating the child Tags.
   * @param {boolean} val set the visiblity to val 
   */
  setVisible(val) {
    this.#visibility = val;
  }

  /**
   * Add a new Tag to this TagSet
   * @param {Tag} tag the new Tag to add
   */
  addTag(tag) {
    tag.register(this);
    this.#tags.push(tag);
    // sort tags
    this.#tags.sort(this.#tagSortCmp);
  }

  /**
   * Internal Tag-Array sorter compare function.
   * @param {Tag} a 
   * @param {Tag} b 
   * @returns {boolean} according to asc. order
   */
  #tagSortCmp(a, b) {
    if (a.label && b.label) {
      return a.label.localeCompare(b.label);
    }
    return a.id.localeCompare(b.id);
  }
}
/**
 * Control structure for a tag.
 * A tag belongs to a tag set and can have a label and description.
 */
class Tag {
  #id;              // the unique tag id
  #color;           // the tag color (as a valid css color code)
  #tagSet;          // tag set of the tag
  #label;           // the (optional) label
  #comment;         // the (optional) description
  #visibility;      // flag that indicates if visible
  #emitter;         // to signal changes about color

  /**
   * A simple annotation Tag.
   * The tag has a value (id), and optional a label, comment.
   * The tag also defines a color in which the annotation is highlighted.
   * 
   * @param {string} id the tag id / value 
   * @param {string} label the tag label for better readability
   * @param {string} comment (optional) a comment with further information regarding the tag
   * @param {string} color (optional) the color of the tag in a valid css format
   */
  constructor(id, label, comment="", color="") {
    this.#id = id;
    this.#label = label;
    this.#comment = comment;
    if (color != "") {
      this.#color = color;
    } else {
      // assign a random color
      this.#color = "#" + ((Math.random()*0xFFFFFF<<0).toString(16)).padStart(6, '0');
    }
    this.#visibility = true;
    this.#emitter = new EventTarget();
  }

  /**
   * The tag id / value.
   */
  get id() {
    return this.#id;
  }

  /**
   * The tag label.
   */
  get label() {
    return this.#label;
  }

  /**
   * The tag comment.
   */
  get comment() {
    return this.#comment;
  }

  /**
   * The tag color.
   */
  get color() {
    return this.#color;
  }

  set color(col) {
    if (col === this.#color) {
      return;
    }
    this.#color = col;
    // signal change
    this.emitter.dispatchEvent(new CustomEvent("change", {detail: { color: col, },}));
  }

  get emitter() {
    return this.#emitter;
  }

  /**
   * The tag-set this tag belongs to
   * @returns {TagSet}
   */
  get tagSet() {
    return this.#tagSet;
  }

  /**
   * The visability of the tag.
   * @returns {boolean}
   */
  get visibility() {
    return this.#visibility && this.tagSet.visibility;
  }

  set visibility(val) {
    this.#visibility = val;
    if (val === true) {
      this.tagSet.setVisible(true);
    }
  }

  /**
   * Export this tag to json.
   * 
   * @param {any} key a key may given by JSON.stringify()
   * @returns {object} (JSON) stringifyable object
   */
  toJSON(key) {
    let json = {};

    json.type = "Tag";
    json.id = this.id;
    json.belongsTo = this.tagSet.id;
    json.label = this.label;
    if (this.comment !== "") {
      json.comment = this.comment;
    }

    return json;
  }

  /**
   * Register a tag-set for this tag.
   * @param {TagSet} tagSet the tag-set of this tag
   */
  register(tagSet) {
    this.#tagSet = tagSet;
  }

  /**
   * Event handler to display the tag information
   * @param {Event} event the triggered event with the 'tagId' dataset attribute
   */
  displayTagInformation(event) {
    // get tag from event
    const tag = tagSetPlugin.getTagForId(event.target.dataset.tagId);
    // open settings menu
    runtime.settings.displayTag(tag);
  }

  /**
   * Renders the tag as a html element.
   * @returns {Node} the tag as a html Node
   */
  renderTag() {
    let button;
    let luminance;

    button = document.createElement('button');
    
    button.setAttribute('class', 'annotation-tag-button');
    if (this.label) {
      button.textContent = this.label;
    } else {
      button.textContent = this.id;
    }
    
    button.style.backgroundColor = this.#color;
    luminance = computeLuminance(this.#color);
    if (luminance > 0.179) {
      button.style.color = '#000000';
    } else {
      button.style.color = '#ffffff';
    }
    button.dataset.tagId = this.id;
  
    button.addEventListener('click', this.displayTagInformation);
    return button;
  }
}
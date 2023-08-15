class Grounding {
  #hasGrounding;
  #hasArity;
  #hasSog;

  constructor(hasGrounding="", hasArity=NaN, hasSog=null) {
    this.#hasGrounding = hasGrounding;
    this.#hasArity = hasArity;
    this.#hasSog = hasSog;
  }

  /**
   * The grounding value.
   * @returns {string}
   */
  get grounding() {
    return this.#hasGrounding;
  }

  set grounding(val) {
    this.#hasGrounding = val;
  }

  /**
   * The arity value.
   * @returns {number}
   */
  get arity() {
    return this.#hasArity;
  }

  set arity(val) {
    this.#hasArity = val;
  }

  /**
   * The sog value.
   * @returns {string}
   */
  get sog() {
    return this.#hasSog;
  }

  set sog(val) {
    this.#hasSog = val;
  }

  hasSog() {
    return this.#hasSog !== null;
  }
}

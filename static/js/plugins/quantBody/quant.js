class Quant {
  #hasScalar;
  #hasUnit;

  constructor(hasScalar=NaN, hasUnit="") {
    this.#hasScalar = hasScalar;
    this.#hasUnit = hasUnit;
  }

  /**
   * The scalar value
   * @param {number}
   */
  get scalar() {
    return this.#hasScalar;
  }

  set scalar(val) {
    this.#hasScalar = val;
  }

  /**
   * The unit value
   * @param {string}
   */
  get unit() {
    return this.#hasUnit;
  }

  set unit(val) {
    this.#hasUnit = val;
  }
}

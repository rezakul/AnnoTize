const FilterWildcars = {
  ALL: "ALL"
};

/**
 * A filter for which annotation elements should be displayed.
 */
class Filter {
  #bodyType
  #bodyVal

  constructor(bodyType, bodyVal) {
    this.#bodyType = bodyType;
    this.#bodyVal = bodyVal;
  }

  /**
   * Checks if the element complies with the filter
   * @param {string} bodyType 
   * @param {string} bodyVal 
   */
  complies(body) {
    if (this.#bodyType === FilterWildcars.ALL) {
      return true;
    }
    if (body.constructor.name !== this.#bodyType) {
      return false;
    }
    if (this.#bodyVal === FilterWildcars.ALL) {
      return true;
    }
    console.log(body.constructor.name, this.#bodyType, this.#bodyVal, body.isValue(this.#bodyVal));
    return body.isValue(this.#bodyVal);
  }
}
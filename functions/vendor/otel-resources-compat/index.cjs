"use strict";

// Genkit 1.42 still constructs Resource and merges detector result objects.
// All detection, async attribute handling and merge semantics remain upstream.
const resources = require("@opentelemetry/resources");

class Resource {
  #resource;

  constructor(attributes = {}) {
    this.#resource = resources.resourceFromAttributes(attributes);
  }

  static from(resource) {
    const wrapper = new Resource();
    wrapper.#resource = resource;
    return wrapper;
  }

  static empty() { return Resource.from(resources.emptyResource()); }
  static default() { return Resource.from(resources.defaultResource()); }

  get attributes() { return this.#resource.attributes; }
  get asyncAttributesPending() { return this.#resource.asyncAttributesPending; }
  get schemaUrl() { return this.#resource.schemaUrl; }
  getRawAttributes() { return this.#resource.getRawAttributes(); }
  waitForAsyncAttributes() { return this.#resource.waitForAsyncAttributes(); }

  merge(other) {
    if (other == null) return this;
    const resource = other && typeof other.getRawAttributes !== "function"
      ? resources.resourceFromAttributes(other.attributes ?? {})
      : other;
    return Resource.from(this.#resource.merge(resource));
  }
}

module.exports = { ...resources, Resource };

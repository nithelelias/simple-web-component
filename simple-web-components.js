"use strict";
/**
 * Converts a camelCase string to kebab-case format
 * @param {string} str - The input string in camelCase format
 * @returns {string} The converted string in kebab-case format
 * @example
 * fromCamelCaseToKebab('camelCase') // returns 'camel-case'
 * fromCamelCaseToKebab('thisIsATest') // returns 'this-is-a-test'
 */
function fromCamelCaseToKebab(str) {
  return (
    str
      // Insert hyphen between lowercase and uppercase letters
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      // Convert everything to lowercase
      .toLowerCase()
  );
}

/**
 * Base class for creating Web Components with a simple state management and rendering system.
 * @class SWCCore
 * @extends HTMLElement
 *
 * @property {string|null} children - Stores the innerHTML content of the component
 * @property {Array} __styles - Array to store stylesheet URLs
 * @property {Object} __events - Object to store event callbacks
 * @property {Object} __eventlisteners - Object to store event listener references
 * @property {boolean} __firstRenderer - Flag to track first render
 * @property {Function} __$renderer - Component render function
 * @property {ShadowRoot} __$shadow - Component's shadow DOM root
 * @property {number} __$debunceUpdateId - Debounce timer ID for updates
 *
 * @method constructor(renderer) - Initializes the component with a render function
 * @method update() - Triggers a component update
 * @method connectedCallback() - Lifecycle method called when component is added to DOM
 * @method getInputProps() - Gets component attributes as an object
 *
 * @method __listenPropChanges() - Sets up attribute change observer
 * @method __preRender() - Prepares HTML and events before rendering
 * @method __renderTemplate(rawHtml) - Renders HTML template to shadow DOM
 * @method __obtainRawHtmlEvents(rawHtml) - Extracts event bindings from HTML
 * @method __bindEvents(events) - Binds extracted events to elements
 * @method __update() - Handles the update cycle with debouncing
 */
class SWCCore extends HTMLElement {
  children = null;
  __styles = [];
  __events = {};
  __eventlisteners = {};
  __firstRenderer = true;
  __$renderer = null;
  __$shadow = null;
  __$debunceUpdateId = 0;
  constructor(renderer) {
    super();
    this.__$renderer = renderer;
    this.__$shadow = this.attachShadow({ mode: "open" });
    this.children = this.innerHTML;
    this.__listenPropChanges();
  }
  update() {
    this.__update();
  }
  connectedCallback() {
    this.__update();
  }

  __listenPropChanges() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes") {
          this.update();
        }
      }
    });

    observer.observe(this, {
      attributes: true,
    });
  }

  getInputProps() {
    return [...this.attributes].reduce((acc, attr) => {
      acc[attr.name] = attr.value;
      return acc;
    }, {});
  }

  __preRender() {
    const inputProps = this.getInputProps();
    let rawHtml = this.__$renderer.call(this, inputProps);
    const events = this.__obtainRawHtmlEvents(rawHtml);
    events.forEach((item) => {
      rawHtml = rawHtml.replace(item.match, item.eventKey);
    });

    return { events, html: rawHtml };
  }
  __renderTemplate(rawHtml) {
    const template = document.createElement("template");
    const rawStyles = this.__styles
      .map((file) => {
        return `<link rel="stylesheet" href="${file}">`;
      })
      .join("");
    template.innerHTML = rawStyles + rawHtml;
    if (this.__firstRenderer) {
      this.__firstRenderer = false;
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    } else {
      actualizarNodo(this.shadowRoot, template.content.cloneNode(true));
    }
  }
  __obtainRawHtmlEvents(rawHtml) {
    // Find matches for word=#otherword pattern
    const regex = /(\w+)=#(\w+)/g;
    const matches = rawHtml.match(regex);

    return matches
      ? matches.map((match, idx) => {
          const eventKey = "bindEvt" + idx;
          const [property, value] = match.split("=");
          return {
            eventKey,
            match,
            property,
            value: value.replace("#", ""),
          };
        })
      : [];
  }
  __bindEvents(events) {
    if (events.length > 0) {
      events.forEach((item) => {
        const element = this.shadowRoot.querySelector(`[${item.eventKey}]`);
        if (!element) return;

        element.removeAttribute(item.eventKey);
        if (!this.__eventlisteners[item.property]) {
          this.__eventlisteners[item.property] = [];
        }
        if (!this.__eventlisteners[item.property].includes(element)) {
          this.__eventlisteners[item.property].push(element);

          element.addEventListener(item.property, (evt) => {
            const callbackFunction = this.__events[item.value];
            callbackFunction && callbackFunction(evt);
          });
        }
      });
    }
  }
  __update() {
    clearTimeout(this.__$debunceUpdateId);
    this.__$debunceUpdateId = setTimeout(() => {
      const { html, events } = this.__preRender();
      this.__renderTemplate(html);
      this.__bindEvents(events);
    }, 60);
  }
}

/**

 * Generates a dynamic Class that inherits from SWCCore class
 * @param {Function} renderer
 * @returns {Class} customClass
 */
function classGenerator(renderer) {
  const customClass = class extends SWCCore {
    state = null;
    data = null;
    constructor() {
      super(renderer);
    }

    getState(defaultValues = {}) {
      return getState(this, defaultValues);
    }
    getData(defaultValues = {}) {
      return getData(this, defaultValues);
    }
    createEvent(name, callback) {
      return createEvent(this, name, callback);
    }
  };

  return customClass;
}

/**
 * Compares and updates the real DOM tree (`realParent`) to match the structure of a virtual DOM tree (`virtualParent`).
 *
 * This function traverses both DOM trees and performs minimal updates needed to make the real DOM
 * reflect the content and structure of the virtual DOM. It compares:
 *
 * - `textContent` of text nodes
 * - `nodeName` of elements
 * - Attributes of element nodes
 *
 * 👉 Useful for implementing a lightweight reactive rendering system or basic virtual DOM diffing.
 *
 * @param {Node} realParent - The actual DOM container (e.g., a `<div>` or `shadowRoot`)
 * @param {Node} virtualParent - A virtual DOM node representing the desired state (e.g., created with `document.createElement`)
 */
function actualizarNodo(realParent, virtualParent) {
  const realChildren = Array.from(realParent.childNodes);
  const virtualChildren = Array.from(virtualParent.childNodes);
  const maxLen = Math.max(realChildren.length, virtualChildren.length);

  for (let i = 0; i < maxLen; i++) {
    const real = realChildren[i];
    const virtual = virtualChildren[i];

    if (!real && virtual) {
      realParent.appendChild(virtual.cloneNode(true));
      continue;
    }

    if (real && !virtual) {
      realParent.removeChild(real);
      continue;
    }

    if (
      real.nodeType !== virtual.nodeType ||
      real.nodeName !== virtual.nodeName
    ) {
      realParent.replaceChild(virtual.cloneNode(true), real);
      continue;
    }

    if (real.nodeType === Node.TEXT_NODE) {
      if (real.textContent !== virtual.textContent) {
        real.textContent = virtual.textContent;
      }
      continue;
    }

    const realAttrs = real.attributes;
    const virtualAttrs = virtual.attributes;

    for (const attr of Array.from(realAttrs)) {
      if (!virtual.hasAttribute(attr.name)) {
        real.removeAttribute(attr.name);
      }
    }

    for (const attr of Array.from(virtualAttrs)) {
      if (real.getAttribute(attr.name) !== attr.value) {
        real.setAttribute(attr.name, attr.value);
      }
    }

    actualizarNodo(real, virtual);
  }
}

/**
 * Binds a function to a custom HTML element by converting the function name to kebab case
 * and registering it as a custom element.
 *
 * @param {Function} func - The function to bind to a custom element
 * @example
 * // For a function named 'myCustomElement'
 * // Creates a custom element named 'my-custom-element'
 * addBind(myCustomElement);
 */
function addBind(func) {
  const elementToBind = fromCamelCaseToKebab(func.name);
  customElements.define(elementToBind, classGenerator(func));
}

/**
 Gets the state of the webComponent instance. Modifying it will trigger the webcomponent update
 * @param {WebComponent} instance
 * @param {Record} defaultValues
 * @returns
 */
export function getState(instance, defaultValues = {}) {
  if (!instance.state) {
    instance.state = new Proxy(
      { ...defaultValues },
      {
        set: (target, property, value) => {
          if (target[property] !== value) {
            target[property] = value;
            instance.update();
          }
          return true;
        },
      }
    );
  }
  return instance.state;
}
/**
 * Gets solid data to reuse without affecting update cycles
 * @param {WebComponent} instance
 * @param { Record } defaultValues
 * @returns
 */
export function getData(instance, defaultValues = {}) {
  if (!instance.data) {
    instance.data = { ...defaultValues };
  }

  return instance.data;
}
/**
 *  Registers a function as a WebComponent
 * @param {Function} func
 * @returns
 */
export const register = (func) => {
  if (Array.isArray(func)) {
    func.forEach((f) => {
      addBind(f);
    });
    return;
  }
  addBind(func);
};

/**
 *  Creates an event listener for the component instance
 * @param {WebComponent} instance
 * @param {string} name
 * @param {Function} callback
 */
export function createEvent(instance, name = "", callback = () => {}) {
  instance.__events = { ...instance.__events, [name]: callback };
}

/**
 *  Forces an update in the component instance
 * @param {WebComponent} instance
 */
export function update(instance) {
  instance.update();
}

/**
 *  Adds styles to the component
 * @param {WebComponent} instance
 * @param {string[]| string} styles
 */
export function addStyle(instance, styles = []) {
  const stylesToAppend = []
    .concat(styles)
    .filter((style) => !instance.__styles.includes(style));
  stylesToAppend.forEach((filepath) => {
    instance.__styles.push(filepath);
  });
}

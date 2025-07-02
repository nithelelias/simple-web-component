"use strict";
function fromCamelCaseToKebab(str) {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2") // inserta un guion entre minúscula y mayúscula
    .toLowerCase(); // todo en minúscula
}
class SWCCore extends HTMLElement {
  children = null;
  __styles = [];
  __inputProps = {};
  __events = {};
  __eventlisteners = {};
  __firstRenderer = true;
  __$renderer = null;
  __$shadow = null;
  constructor(renderer) {
    super();
    this.__$renderer = renderer;
    this.__$shadow = this.attachShadow({ mode: "open" });
    this.children = this.innerHTML;
    this.__inputProps = [...this.attributes].reduce((acc, attr) => {
      acc[attr.name] = attr.value;
      return acc;
    }, {});
  }
  update() {
    this.__update();
  }
  connectedCallback() {
    this.__update();
  }

  __preRender() {
    let rawHtml = this.__$renderer.call(this, this.__inputProps);
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
    const { html, events } = this.__preRender();
    this.__renderTemplate(html);
    this.__bindEvents(events);
  }
}
function classGenerator(renderer) {
  return class extends SWCCore {
    state = null;

    constructor() {
      super(renderer);
    }
    getState(defaultValues = {}) {
      return getState(this, defaultValues);
    }

    createEvent(name, callback) {
      return createEvent(this, name, callback);
    }
  };
}

function actualizarNodo(realParent, virtualParent) {
  const realChildren = Array.from(realParent.childNodes);
  const virtualChildren = Array.from(virtualParent.childNodes);
  const maxLen = Math.max(realChildren.length, virtualChildren.length);

  for (let i = 0; i < maxLen; i++) {
    const real = realChildren[i];
    const virtual = virtualChildren[i];

    // Si solo hay nodo virtual, se inserta
    if (!real && virtual) {
      realParent.appendChild(virtual.cloneNode(true));
      continue;
    }

    // Si el virtual no existe, se elimina el real
    if (real && !virtual) {
      realParent.removeChild(real);
      continue;
    }

    // Nodo tipo distinto o nombre distinto => reemplazo
    if (
      real.nodeType !== virtual.nodeType ||
      real.nodeName !== virtual.nodeName
    ) {
      realParent.replaceChild(virtual.cloneNode(true), real);
      continue;
    }

    // Si son nodos de texto, comparar contenido
    if (real.nodeType === Node.TEXT_NODE) {
      if (real.textContent !== virtual.textContent) {
        real.textContent = virtual.textContent;
      }
      continue;
    }

    // Actualizar atributos si es un elemento
    const realAttrs = real.attributes;
    const virtualAttrs = virtual.attributes;

    // Eliminar atributos que ya no existen
    for (const attr of Array.from(realAttrs)) {
      if (!virtual.hasAttribute(attr.name)) {
        real.removeAttribute(attr.name);
      }
    }

    // Añadir o actualizar atributos
    for (const attr of Array.from(virtualAttrs)) {
      if (real.getAttribute(attr.name) !== attr.value) {
        real.setAttribute(attr.name, attr.value);
      }
    }

    // Recurse: comparar hijos de ese nodo
    actualizarNodo(real, virtual);
  }
}

function addBind(func) {
  const elementToBind = fromCamelCaseToKebab(func.name);
  customElements.define(elementToBind, classGenerator(func));
}

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

export const register = (func) => {
  if (Array.isArray(func)) {
    func.forEach((f) => {
      addBind(f);
    });
    return;
  }
  addBind(func);
};

export function createEvent(instance, name = "", callback = () => {}) {
  instance.__events = { ...instance.__events, [name]: callback };
}

export function update(instance) {
  instance.update();
}

export function addStyle(instance, styles = []) {
  const stylesToAppend = []
    .concat(styles)
    .filter((style) => !instance.__styles.includes(style));
  stylesToAppend.forEach((filepath) => {
    instance.__styles.push(filepath);
  });
}

"use strict";
import {
  register,
  getState,
  createEvent,
  addStyle,
} from "./simple-web-components.js";

function compPadre() {
  return `
        <div>
          <h2>Soy el padre</h2>
          <p>${this.children}</p>
          <comp-hijo apellido="elias">Nithel</comp-hijo>
          
        </div>
      `;
}
function compHijo(props) {
  const state = getState(this, { version: 0 });
  const nombre = this.children;
  setTimeout(() => {
    state.version += 1;
  }, 5000);

  return `
        <div>
          <h3>Soy el HIJO ${nombre} ${props.apellido}</h3>  
          <mi-contador></mi-contador>
          <b>Version: ${state.version}</b> 
        </div>
      `;
}

function miContador() {
  const data = getState(this, { counter: 0 });

  createEvent(this, "buttonClickmio", () => {
    data.counter++;
  });

  return ` <div>  
    <button click=#buttonClickmio >Haz dado click  (${data.counter}) veces </button>
  </div>`;
}

function compColorido() {
  addStyle(this, ["./colorido.css", "./utils.css"]);
  return `<div class="arcoiris flex">
    <p>componente colorido aqui</p>
  </div>`;
}

function miFormulario() {
  const state = getState(this, { nombre: "" });
  createEvent(this, "inputNombre", (evt) => {
    state.nombre = evt.target.value;
  });
  return `<form>
      <p>Tu nombre es: ${state.nombre}</p>
      <label>Nombre: 
        <input type='text' name='nombre' input=#inputNombre /> 
      </label>
  </form>`;
}

function miJsLoader() {
  const state = getState(this, { active: true });
  createEvent(this, "onclick", () => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = "./compAsync.js";
    document.body.appendChild(script);
    state.active = false;
  });
  if (!state.active) {
    return `<p>Les presento:</p><comp-async></comp-async>`;
  }
  return `<button click=#onclick>Carga mi componente hijo</button>  
  `;
}

function exampleSection(props) {
  addStyle(this, "./utils.css");
  return `<section class="example-section">
        <h2>Ejemplo #${props.num}</h2>
        <article>
          ${this.children}
        </article>
      </section>`;
}

register([
  compPadre,
  compHijo,
  miContador,
  compColorido,
  miFormulario,
  exampleSection,
  miJsLoader,
]);

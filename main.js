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
    componente colorido aqui
  </div>`;
}

register([compPadre, compHijo, miContador, compColorido]);

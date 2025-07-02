# 🔧 Simple Web Components

Una forma **sencilla**, **ligera** y **reactiva** de crear Web Components sin dependencias ni decoradores raros.

![Vanilla JS](https://img.shields.io/badge/vanilla-JavaScript-yellow)
![Ligero](https://img.shields.io/badge/size-pequeño-blue)
![Reactividad](https://img.shields.io/badge/reactividad-incluida-green)

---

## 💡 ¿Por qué nació esto?

Un día me pregunté:  
**¿Por qué no hay una forma simple de crear Web Components con reactividad sin entrar en el mundo oscuro de los decoradores, proxies mágicos y dependencias pesadas?**

Así que, como toda persona cuerda en esta situación, hice lo más razonable:  
**creé mi propio micro framework**. Sin Lit, sin clases con decorators, sin dolor de cabeza.

> Esta no es mi primera vez creando utilidades así. Desde la salida de Angular me he motivado a resolver estos pequeños retos por mi cuenta.  
> Con la llegada de los Web Components pensé que esa búsqueda de simplicidad iba a acabar... pero parece que no.

---

## 🚀 Características

- ✅ Web Components **nativos**
- ⚡️ Reactividad **sin framework**
- 🧠 Sintaxis clara y directa
- 🛠️ Sin decoradores, ni build steps obligatorios
- 🪶 Ligero: perfecto para proyectos simples o experimentales

---

## ✨ Ejemplo rápido #1

```js
import { register, getData, createEvent } from "simple-web-components";

function miContador() {
  const data = getState(this, { num: 0 });

  createEvent(this, "btn_event_name_click_me", () => {
    data.num++;
  });

  return ` <div>  
    <button click=#btn_event_name_click_me >Haz dado click (${data.num}) veces</button>
  </div>`;
}
register(miContador);
```

---

## ✨ Ejemplo rápido #2

anidando componentes y solo actualizando lo que cambie

```js
import { register } from "simple-web-components";
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
  const state = this.getState(this, { version: 0 });
  const nombre = this.children;
  setTimeout(() => {
    state.version += 1;
  }, 1000);

  return `
        <div>
          <h3>Soy el HIJO ${nombre} ${props.apellido}</h3 >  
          <p>Version: ${state.version}</p>
        </div>
      `;
}

register([compPadre, compHijo]);
```

```HTML
<comp-padre>Hola mundo</comp-padre>
```

## ✨ Ejemplo rápido #3

Agregandole estilos encapsulados, facilito asi

```js
import { register, addStyle } from "simple-web-components";
function compColorido() {
  addStyle(this, ["./colorido.css", "./utils.css"]);
  return `<div class="arcoiris flex">
    componente colorido aqui
  </div>`;
}
register(compColorido);
```

## 🧪 ¿Quién debería usar esto?

- Quienes aman **vanilla JS** y quieren usar Web Components reales
- Los que odian los decoradores ✋
- Quienes quieren **reutilizar componentes sin cargar React o Lit**
- Los que solo quieren que **algo funcione bien y simple**

---

## 🧰 Estado actual

Esto es un experimento personal, pero funcional.  
Si quieres contribuir o sugerir algo, **abre un issue o un pull request**.  
Estoy abierto a ideas siempre que mantengamos la simplicidad como filosofía.  
Aún hay algunos escenarios que no he testeado completamente ⚠️

---

## 🪪 Licencia

MIT © 2025 Nithel Rene Elias Alvarez

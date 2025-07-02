import { register } from "./simple-web-components.js";

function compAsync() {
  return `<div style='font-size:32px;color:yellow;'>A mi!</div>`;
}

register(compAsync);

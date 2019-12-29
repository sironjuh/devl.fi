let canvas_w = 512,
    canvas_h = 512,
    cv = document.createElement("canvas"),
    ctx = cv.getContext("2d");
    cv.width = canvas_w;
    cv.height = canvas_h;
    cx = canvas_w / 2;
    cy = canvas_h / 2,
    rid;

let light_w = 128,
    light_h = 128,
    light = new Uint8Array(light_w * light_h);

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function generateLight() {
  let dist, col;

  for (let y = 0; y < light_h; y++) {
    for (let x = 0; x < light_w; x++) {
      dist = Math.min(distance(x, y, light_w / 2, light_h / 2) * (canvas_w / light_w), 255);
      col = 255 - dist;
      light[y * light_w + x] = col;
    }
  }
}

function renderLight() {
  let col;

  for (let y = 0; y < light_h; y++) {
    for (let x = 0; x < light_w; x++) {
      col = light[y * light_w + x];
      ctx.fillStyle = `rgb(${col}, ${col}, ${col})`;
      ctx.fillRect(x, y, x + 1, y + 1);
    }
  }
}

window.onload = function() {
  document.body.appendChild(cv);
  generateLight();
  renderLight();
};

let canvas_w = 640,
  canvas_h = 360,
  cv = document.createElement("canvas"),
  ctx = cv.getContext("2d");
cv.width = canvas_w;
cv.height = canvas_h;
cx = canvas_w / 2;
cy = canvas_h / 2;

let light_w = 64,
  light_h = 64,
  light = new Uint8Array(light_w * light_h);

let start_x = 320 - 96,
  start_y = 180 - 64,
  angle = 0,
  rid = null;

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function generateLight() {
  let dist, col;

  for (let y = 0; y < light_h; y++) {
    for (let x = 0; x < light_w; x++) {
      dist = Math.min(distance(x, y, light_w / 2, light_h / 2) * 7, 255);
      col = 255 - dist;
      light[y * light_w + x] = col;
    }
  }
}

function renderLight(pos_x, pos_y) {
  let col, draw_x, draw_y;
  for (let y = 0; y < light_h; y++) {
    for (let x = 0; x < light_w; x++) {
      draw_x = x + pos_x;
      draw_y = y + pos_y;
      col = light[y * light_w + x];
      ctx.fillStyle = `rgb(${col}, ${col}, ${col})`;
      ctx.fillRect(draw_x, draw_y, 1, 1);
    }
  }
}

function updateCoordinates() {
  angle = angle + 0.05;
  start_x = start_x + Math.sin(angle);
  start_y = start_y + Math.cos(angle);
}

function animate() {
  ctx.clearRect(0, 0, cv.width, cv.height);
  renderLight(start_x, start_y);
  renderLight(start_y, start_x);
  renderLight(start_x + 32, start_y - 10);
  renderLight(start_y + 32, start_x - 10);
  renderLight(start_x + 32, start_y + 32);
  renderLight(start_y + 32, start_x - 32);
  updateCoordinates();
  rid = window.requestAnimationFrame(animate);
}

function init() {
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, cv.width, cv.height);
  generateLight();
  renderLight();
  animate();
}

function pauseRestart() {
  if (rid) {
    window.cancelAnimationFrame(rid);
    rid = 0;
  } else {
    animate();
  }
}

window.onload = function () {
  document.body.appendChild(cv);
  cv.addEventListener("mousedown", pauseRestart);
  init();
};

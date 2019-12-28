let w = 512,
    h = 512,
    cv = document.createElement("canvas"),
    ctx = cv.getContext("2d"),
    light = new Uint8Array(w*h),
    timer = 0;

cv.width = w;
cv.height = h;
cx = w / 2;
cy = h / 2;

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)) << 0;
}

function generateLight() {
  let x, y, d, col;

  for (y = 0; y < w; y++) {
    for (x = 0; x < h; x++) {
      d = Math.min(distance(x, y, cx, cy), 255);
      col = 255 - d;
      light[y * w + x] = col;
    }
  }
}

function renderLight() {
  let x, y, col;

  for (y = 0; y < w; y++) {
    for (x = 0; x < h; x++) {
      col = light[y * w + x];
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

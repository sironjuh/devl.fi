const { random } = _;

let w = innerWidth * devicePixelRatio,
    h = innerHeight * devicePixelRatio,
    noise, particles, rid,
    cv = document.createElement('canvas'),
    ctx = cv.getContext('2d');

cv.width = w;
cv.height = h;
cx = w / 2;
cy = h / 2;
tx = w - 60;
ty = h - 25;
fs = 15 * devicePixelRatio;

class Vector {
  constructor (x, y) {
    this.x = x;
    this.y = y;
  }
  
  static fromPolar (r, t) {
    return new Vector(r * Math.cos(t), r * Math.sin(t))
  }
  
  add (v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }
  
  mul (x) {
    this.x *= x;
    this.y *= x;
    return this;
  }
  
  dist (v) {
    let dx, dy;
    return Math.sqrt((dx = this.x - v.x) * dx, (dy = this.y - v.y) * dy);
  }
  
  get mag () {
    return Math.sqrt(this.x * this.x, this.y * this.y);
  }
  
  set mag (v) {
    let n = this.norm();
    this.x = n.x * v;
    this.y = n.y * v;
  }
  
  norm () {
    let mag = this.mag;
    return new Vector(this.x / mag, this.y / mag);
  }
}

class Noise {
  constructor (w, h, oct) {
    this.width = w;
    this.height = h;
    this.octaves = oct;
    this.canvas = Noise.compositeNoise(w, h, oct);
    let ctx = this.canvas.getContext('2d');
    this.data = ctx.getImageData(0, 0, w, h).data;
  }
  
  // create w by h noise
  static noise (w, h) {
    let cv = document.createElement('canvas'),
        ctx = cv.getContext('2d');
    
    cv.width = w;
    cv.height = h;
    
    let img = ctx.getImageData(0, 0, w, h),
        data = img.data;
    
    for (let i = 0, l = data.length; i < l; i += 4) {
      data[i + 0] = random(0, 255);
      data[i + 1] = random(0, 255);
      data[i + 2] = random(0, 255);
      data[i + 3] = 255;
    }
    
    ctx.putImageData(img, 0, 0);
    return cv;
  }
  
  // create composite noise with multiple octaves
  static compositeNoise (w, h, oct) {
    let cv = document.createElement('canvas'),
        ctx = cv.getContext('2d');
    
    cv.width = w;
    cv.height = h;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 1 / oct;
    
    for (let i = 0; i < oct; i++) {
      let noise = Noise.noise(w >> i, h >> i);
      ctx.drawImage(noise, 0, 0, w, h);
    }
    
    return cv;
  }
  
  // returns noise from -1.0 to 1.0
  getNoise (x, y, ch) {
    // bitwise ~~ to floor
    let i = (~~x + ~~y * this.width) * 4;
    return this.data[i + ch] / 127 - 1;
  }
}

class Particle {
  constructor (x, y, vx = 0, vy = 0) {
    this.pos = new Vector(x, y);
    this.vel = new Vector(vx, vy);
    this.acc = new Vector(0, 0);
  }
  
  update (noise) {
    this.pos.add(this.vel);
    
    let { x, y } = this.pos;
    let dx = noise.getNoise(x, y, 0),
        dy = noise.getNoise(x, y, 1);

    this.vel.add(new Vector(dx, dy));
    this.vel.mul(0.95);
  }
  
  draw (ctx) {
    ctx.fillRect(this.pos.x, this.pos.y, 2, 2);
  }
}

function init () {
  noise = new Noise(w, h, 8);
  particles = [];
  
  for (let i = 0; i < 36000; i++)  {
    let rad = (Math.PI/180)*i/1000;
    let r1 = Math.sin(rad);// * Math.sin(rad) * Math.sin(rad));
    let a1 = random(0, 2 * Math.PI, true);

    //let r1 = w / 4,//random(w / 4 - 100, w / 4, true),
    //let a1 = random(0, 2 * Math.PI, true);
    let r2 = random(0, 1, true);
    let a2 = random(0, 2 * Math.PI, true);

    let pos = Vector.fromPolar(r1, a1),
        vel = Vector.fromPolar(r2, a2);
    
    pos.add(new Vector(w / 2, h / 2));

    particles.push(new Particle(
      pos.x, pos.y, vel.x, vel.y));
  }

  ctx.fillStyle = '#232323';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign='right';
  ctx.font = `${fs}pt Ubuntu`;
  animate();
}

// click once to pause, twice to regen
function generate () {
  if (rid) {
    window.cancelAnimationFrame(rid);
    rid = 0;
  } else {
    init();
  }
}

function render () {
  ctx.fillStyle = 'rgba(64, 224, 208, 0.05)';
  for (let p of particles) {
    p.update(noise);
    p.draw(ctx);
  }
}

function animate () {
  render();
  rid = window.requestAnimationFrame(animate);
}

window.onload = function() {
    document.body.appendChild(cv);
    cv.addEventListener('mousedown', generate);
    cv.addEventListener('touchstart', generate);
    init();
}
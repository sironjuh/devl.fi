// Accidental displacement effect
//
// MDN WebGL tutorial used as a base for quick boilerplate
// https://github.com/mdn/webgl-examples/blob/gh-pages/tutorial/sample2/webgl-demo.js
//
// Signed Distance Functions
// https://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
//
// Inspiration
// https://www.iquilezles.org/www/articles/raymarchingdf/raymarchingdf.htm

async function main() {
  const canvas = document.querySelector("#glcanvas");
  const gl = canvas.getContext("webgl");

  if (!gl) {
    console.error("Unable to initialize WebGL");
    return;
  }

  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  
  const vertexSource = await fetchShader("vertex.glsl");
  const fragmentSource = await fetchShader("fragment.glsl");
  const shaderProgram = initShaderProgram(gl, vertexSource, fragmentSource);

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "a_vertex_pos"),
    },
    uniformLocations: {
      resolution: gl.getUniformLocation(shaderProgram, "u_resolution"),
      time: gl.getUniformLocation(shaderProgram, "u_time"),
    },
  };

  const buffers = initBuffers(gl);

  const fps = {
    sampleSize: 300,
    samples: [],
    initTick: performance.now(),
    currentTick: 0,
    eventSent: false,

    tick: function () {
      this.currentTick = performance.now();
      if (this.samples.length < this.sampleSize) {
        this.samples.push(this.currentTick - this.initTick);
        this.initTick = this.currentTick;
      }
      if (this.samples.length === this.sampleSize) {
        const sum = this.samples.reduce((a, b) => a + b, 0);
        const fps = 1000 / (sum / this.sampleSize);
        console.log({renderer: renderer, fps: fps });
        this.samples = [];
        
        if (gtag !== undefined  && !this.eventSent) {
          gtag("event", "gpu", { event_label: renderer, value: fps });
          this.eventSent = true;
        }
      }
    },
  };

  function render(now) {
    fps.tick();
    drawScene(gl, programInfo, buffers, now);
    requestAnimationFrame(render);
  }

  render(Date.now());
}

function initBuffers(gl) {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
  };
}

function drawScene(gl, programInfo, buffers, time) {
  resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  gl.useProgram(programInfo.program);

  // Uniforms
  gl.uniform1f(programInfo.uniformLocations.time, time * 0.001);
  gl.uniform2f(programInfo.uniformLocations.resolution, gl.canvas.width, gl.canvas.height);

  {
    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}

function initShaderProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log("Unable to initialize the shader program: " + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

async function fetchShader(shader) {
  let response = await fetch(shader);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  let content = await response.text();
  return content;
}

function resizeCanvasToDisplaySize(canvas) {
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight;

  if (needResize) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
}

main();

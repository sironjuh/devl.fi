// Experimenting with mandelbulb
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
  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl');
  const vertexSource = await fetchShader('vertex.glsl')
  const fragmentSource = await fetchShader('fragment.glsl');

  if (!gl) {
    console.error('Unable to initialize WebGL');
    return;
  }

  const shaderProgram = initShaderProgram(gl, vertexSource, fragmentSource);

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'a_vertex_pos'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'u_projection_mat'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'u_modelview_mat'),
      resolution: gl.getUniformLocation(shaderProgram, "u_resolution"),
      time: gl.getUniformLocation(shaderProgram, 'u_time'),
    },
  };

  const buffers = initBuffers(gl);
  
  function render(now) {
    drawScene(gl, programInfo, buffers, now);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

function initBuffers(gl) {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  const positions = [
     1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
    -1.0, -1.0,
  ];

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

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = 1.75; //gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 10.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Now move the drawing position a bit to where we want to
  // start drawing the square.
  const modelViewMatrix = mat4.create();

  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [0.0, 0.0, -0.2]);   // amount to translate

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

    //const vao = gl.createVertexArray();
    //gl.bindVertexArray(vao);

    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  gl.useProgram(programInfo.program);

  // Shader uniforms
  gl.uniform1f(programInfo.uniformLocations.time, (time * 0.001));
  gl.uniform2f(programInfo.uniformLocations.resolution, gl.canvas.width, gl.canvas.height);

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

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
    console.log('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
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
  //const displayWidth  = Math.floor(canvas.clientWidth * .5);
  //const displayHeight = Math.floor(canvas.clientHeight * .5);
  const displayWidth  = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;
 
  const needResize = canvas.width  !== displayWidth ||
                     canvas.height !== displayHeight;
 
  if (needResize) {
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }
 
  return needResize;
}

main();

// Simplistic 2d bump fragment shader test
//
// MDN WebGL tutorial used as a base for quick boilerplate
// https://github.com/mdn/webgl-examples/blob/gh-pages/tutorial/sample2/webgl-demo.js

function main() {
  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl');
  
  if (!gl) {
    console.error('Unable to initialize WebGL');
    return;
  }

  const vertexSource = `
    attribute vec4 a_vertex_pos;
    attribute vec2 a_texture_pos;

    uniform mat4 u_modelview_mat;
    uniform mat4 u_projection_mat;

    varying vec2 v_texture_coord;

    void main(void) {
      gl_Position = u_projection_mat * u_modelview_mat * a_vertex_pos;
      v_texture_coord = a_texture_pos;
    }
  `;

  const fragmentSource = `
    precision highp float;
    precision highp sampler2D;

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform sampler2D u_bump_normal;

    varying vec2 v_texture_coord;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      float time = u_time * .001;
      
      float result = 0.0;
      
      for(int i = 0; i < 1; i++) {
        float i_float = float(i);
        vec2 pos;

        pos.x = .5 + (sin(time + time * i_float * .5) * .25);
        pos.y = .5 + (cos(time + time * i_float * .5) * .25);
        
        result += (1. - pow(length(uv - pos), 2.));
      }
    
      vec2 bump = vec2(0.);
      bump.x = texture2D(u_bump_normal, uv - vec2(.01, 0.)).r - texture2D(u_bump_normal, uv - vec2(-.01, 0.)).r;
      bump.y = texture2D(u_bump_normal, uv - vec2(0., .01)).r - texture2D(u_bump_normal, uv - vec2(0., -.01)).r;

      float light  = .1/(length(result - bump*1.5)) + 1.-length(result - bump*3.);

      gl_FragColor = vec4(vec3(light * - 1.), 1.);
    }
  `;

const fragmentSource_col = `
  precision highp float;
  precision highp sampler2D;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform sampler2D u_bump_normal;

  varying vec2 v_texture_coord;

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float time = u_time * .001;
    
    float result = 0.0;
    
    for(int i = 0; i < 2; i++) {
      float i_float = float(i);
      vec2 pos;

      pos.x = .5 + (sin(time + time * i_float * .5) * .5);
      pos.y = .5 + (cos(time + time * i_float * .5) * .5);
        
      result += (1. - pow(length(uv - pos), 1.));
    }
  
    vec2 bump = vec2(0.);
    bump.x = texture2D(u_bump_normal, uv - vec2(.01, 0.)).r - texture2D(u_bump_normal, uv - vec2(-.01, 0.)).r;
    bump.y = texture2D(u_bump_normal, uv - vec2(0., .01)).r - texture2D(u_bump_normal, uv - vec2(0., -.01)).r;

    float light  = .1/(length(result - bump*1.5)) + 1.-length(result - bump*2.);

    vec4 whiteGrad = vec4(vec3(light * - 1.), 1.);
    vec4 blueGrad = vec4(0.0, 1.0, (light * - 1.), 1.);
    
    gl_FragColor = vec4(mix(whiteGrad, blueGrad, light));
  }
`;

  const shaderProgram = initShaderProgram(gl, vertexSource, fragmentSource_col);

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'a_vertex_pos'),
      texturePosition: gl.getAttribLocation(shaderProgram, 'a_texture_pos'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'u_projection_mat'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'u_modelview_mat'),
      resolution: gl.getUniformLocation(shaderProgram, 'u_resolution'),
      time: gl.getUniformLocation(shaderProgram, 'u_time'),
      bumpNormal: gl.getUniformLocation(shaderProgram, 'u_bump_normal'),
    },
  };

  const buffers = initBuffers(gl);
  const bump_normal = loadTexture(gl, 'bump_normal.png');

  function render(now) {
    drawScene(gl, programInfo, buffers, bump_normal, now);
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

  const texPosBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texPosBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
    -1.0, -1.0,]), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    texturePosition: texPosBuffer,
  };
}

function drawScene(gl, programInfo, buffers, normal, time) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.
  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
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
                 [-0.0, 0.0, -0.1]);  // amount to translate

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
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

  // Tell WebGL how to pull out the texture coordinates from
  // the texture coordinate buffer into the textureCoord attribute.
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texturePosition);
    gl.vertexAttribPointer(
        programInfo.attribLocations.texturePosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.texturePosition);
  }

  gl.useProgram(programInfo.program);

  // Bind bump_normal to texture unit 0
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, normal);
  gl.uniform1i(programInfo.uniformLocations.sampler, 0);

  // Shader uniforms
  gl.uniform1f(programInfo.uniformLocations.time, time);
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

function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 512;
  const height = 512;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       gl.generateMipmap(gl.TEXTURE_2D);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    } else {
       // not a power of 2. Turn off mips and set wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

main();

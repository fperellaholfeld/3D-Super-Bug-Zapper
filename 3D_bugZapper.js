// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set the vertex information
  var n = genSphere(0, 0, 0, [1, 0, 0], 100, gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Set the clear color and enable the depth test
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Get the storage location of u_MvpMatrix
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  if (!u_MvpMatrix) {
    console.log('Failed to get the storage location of u_MvpMatrix');
    return;
  }

  // Set the eye point and the viewing volume
  var mvpMatrix = new Matrix4();
  mvpMatrix.setPerspective(90, 1, 1, 100);
  mvpMatrix.lookAt(0, 0, 0, 0, 0, 0, 0, 0, 0);

  // Pass the model view projection matrix to u_MvpMatrix
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Draw the cube
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

function genSphere(x0, y0, z0, color, radius, gl) {
    var sphereDivs = 50; //number of longitudes and latitudes
    var vertices = [];
    var colors = [];
    var indices = [];
  
    // Iterate through each vertical slice of the sphere with latitude
    for (let lat = 0; lat <= sphereDivs; lat++) {
      var phi = lat * (Math.PI / sphereDivs);
      var sinPhi = Math.sin(phi);
      var cosPhi = Math.cos(phi);
      // Iterate through every horizontal segment within the vertical slice with longitude
      for (let long = 0; long <= sphereDivs; long++) {
        var theta = long * 2 * (Math.PI / sphereDivs);
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
  
        // Calculate position of vertex in relation to origin point of this sphere.
        let x = radius * sinPhi * sinTheta;
        let y = radius * cosPhi;
        let z = radius * sinPhi * cosTheta;
  
        // Push coordinates of currently calculated sphere vertex
        vertices.push(x);
        vertices.push(y);
        vertices.push(z);
  
        // Push color of vertex
        for (let i = 0; i < 3; i++) {
          colors.push(color[i]); // Set RGBA values from color parameter
        }
  
        // Create indices for dividing square segments made by the vertices into triangles
  
        let v1 = lat * (sphereDivs + 1) + long; // top left of square segment
        let v2 = v1 + sphereDivs + 1; // bottom left of square segment
  
        // push triangle 1 of segment
        indices.push(v1);
        indices.push(v2);
        indices.push(v1 + 1);
  
        //push triangle 2 of segment
        indices.push(v2);
        indices.push(v2 + 1);
        indices.push(v1 + 1);
      }
    }
  
    console.log(vertices);
    var n = initVertexBuffers(vertices, colors, indices, gl);
    return n;
  }

function initVertexBuffers(v, c, i, gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3

  var vertices = new Float32Array(v);

  var colors = new Float32Array(c);

  var indices = new Uint8Array(i);

  // Create a buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) 
    return -1;

  // Write the vertex coordinates and color to the buffer object
  if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position'))
    return -1;

  if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
    return -1;

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer(gl, data, num, type, attribute) {
  var buffer = gl.createBuffer();   // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

// Vertex shader program
var VSHADER_SOURCE =
  "attribute vec3 position;" +
  "uniform mat4 Pmatrix;" + // projection matrix
  "uniform mat4 Vmatrix;" + // view matrix - fixed camera
  "uniform mat4 Mmatrix;" + // model matrix - rotate this to rotate the sphere
  "attribute vec3 color;" + // the color of the vertex
  "varying vec3 vColor;" +
  "void main() {\n" +
  "gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.0);\n" +
  "vColor = color;" +
  "}\n";

// Fragment shader program
var FSHADER_SOURCE =
  "precision mediump float;" +
  "varying vec3 vColor;" +
  "void main() {\n" +
  "  gl_FragColor = vec4(vColor, 1.0);\n" +
  "}\n";

//Radius for main disc
const DISC_RADIUS = 0.8;
//growth rate for bacteria
const GROWTH_RATE = 0.001;
// player score
var PLAYER_SCORE = 0;
// bacteria score
var GAME_SCORE = 0;
// declare live bacteria buffer
var bacteriaAlive;
// number of bacteria originally generated
var bacteriaAmount;

var x_mouse0 = 0;
var y_mouse0 = 0;

var drag = false;

function main() {
  console.log("Initializing Game...");
  // Retrieve <canvas> element
  var canvas = document.getElementById("webgl");
  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to intialize shaders.");
    return;
  }
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0,0,0,1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Specify the viewing volume - define the projection matrix
  var proj_matrix = new Matrix4();
  proj_matrix.setPerspective(90, 1, 0.1, 100); //you can change the parameters to get the best view
  var mo_matrix = new Matrix4(); //model matrix - need to be updated accordingly when the sphere rotates
  var view_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  view_matrix[14] = view_matrix[14] - 60; // view matrix - move camera away from the object
  // Then, pass the projection matrix, view matrix, and model matrix to the vertex shader.
  // for example:
  var _Pmatrix = gl.getUniformLocation(gl.program, "Pmatrix");
  var _Vmatrix = gl.getUniformLocation(gl.program, "Vmatrix");
  var _Mmatrix = gl.getUniformLocation(gl.program, "Mmatrix");
  // Pass the projection matrix to _Pmatrix
  gl.uniformMatrix4fv(_Pmatrix, false, proj_matrix.elements);
  gl.uniformMatrix4fv(_Vmatrix, false, view_matrix);
  gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix.elements);

  var rotMatrix = new Matrix4();

  //generate bacteria
  //bacteriaAlive = generateBacteria(gl);
  //bacteriaAmount = bacteriaAlive.length;

  // Begin Frames
  function tick() {
    // check for clicks

    canvas.onmouseup = function (e) {
      drag = false;
      //click(e, canvas);
    };
    canvas.onmouseleave = function (e) {
      drag = false;
    };

    canvas.onmousedown = function (e) {
      x_mouse0 = e.clientX;
      y_mouse0 = e.clientY;
      drag = true;
    };

    canvas.onmousemove = function (e) {
      if (drag) {
        console.log("bruh");
        let x = e.clientX;
        let y = e.clientY;
        let deltaX = x - x_mouse0;
        let deltaY = y - y_mouse0;
        x_mouse0 = x;
        y_mouse0 = y;
        mo_matrix.multiply(rotMatrix.setRotate(deltaX, 1, 0, 0));
        mo_matrix.multiply(rotMatrix.setRotate(deltaY, 0, 0, 1));
        gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix.elements);
      }
    };
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    draw(gl, bacteriaAlive);

    // If the player score becomes negative, set it to 0
    PLAYER_SCORE = PLAYER_SCORE < 0 ? 0 : PLAYER_SCORE;

    // // update scores
    // document.getElementById("infection").innerHTML =
    //   "Infection Level: " + Math.floor(GAME_SCORE);
    // document.getElementById("playerScore").innerHTML =
    //   "Your Score: " + PLAYER_SCORE;
    // // Win Conditions
    // if (bacteriaAlive.length === 0 && GAME_SCORE < 100) {
    //   document.getElementById("winState").style.color = "green";
    //   document.getElementById("winState").innerHTML = "You Win";
    //   return; //end game
    // }
    // // Lose conditions
    // else if (GAME_SCORE >= 100) {
    //   document.getElementById("winState").style.color = "red";
    //   document.getElementById("winState").innerHTML = "You Lose";
    //   return; //end game
    // }
    requestAnimationFrame(tick, canvas);
  }
  tick();
}

// Main draw function, clears the canvas and redraws each frame
function draw(gl, bacteriaAlive) {
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawSphere(
    (x0 = 0),
    (y0 = 0),
    (z0 = 0),
    (color = [1, 0, 1]),
    (radius = 30),
    (gl = gl)
  );
  // for (var i = 0; i < bacteriaAlive.length; i++) {
  //     bacteriaAlive[i].grow();
  // }
  return 1;
}

// Initialize the vertex buffers for the program
function initIndexBuffers(
  gl,
  vertexInputs,
  fragmentColor,
  indexData
) {
  let vertices = new Float32Array(vertexInputs);
  let colors = new Float32Array(fragmentColor);
  let indices = new Uint16Array(indexData);

  // Create a buffer object
  // Create a buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) return -1;

  // Write the vertex coordinates and color to the buffer object
  if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, "position")) return -1;

  if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, "color")) return -1;

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}
function initArrayBuffer(gl, data, num, type, attribute) {
  var buffer = gl.createBuffer(); // Create a buffer object
  if (!buffer) {
    console.log("Failed to create the buffer object");
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log("Failed to get the storage location of " + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

// Draw the Sphere
function drawSphere(x0, y0, z0, color, radius, gl) {
  var sphereDivs = 40; //number of longitudes and latitudes
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
      let x = x0 + radius * sinPhi * sinTheta;
      let y = y0 + radius * cosPhi;
      let z = z0 + radius * sinPhi * cosTheta;

      // Push coordinates of currently calculated sphere vertex
      vertices.push(x);
      vertices.push(y);
      vertices.push(z);

      // Push color of vertex
      colors.push((theta + 1) / 10); // Set RGBA values from color parameter
      colors.push((sinPhi + 1) / 2); // Set RGBA values from color parameter
      colors.push((cosTheta + 1) / 2); // Set RGBA values from color parameter

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
    initIndexBuffers(gl, vertices, colors, indices)
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  return indices.length;
}

// Draw a single bacteria
function drawBacteria(gl, scale, spawnX, spawnY, color) {
  var n = initIndexBuffers(gl, genDiscVertices(spawnX, spawnY, scale));
  if (n < 0) {
    console.log("Failed to set the positions of the disc vertices");
    return;
  }
  var fragmentColor = gl.getUniformLocation(gl.program, "fragColor");
  gl.uniform4f(fragmentColor, color[0], color[1], color[2], color[3]);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
  return;
}

// Last time that this function was called
var g_last = Date.now();
function animate(size) {
  // Calculate the elapsed time
  let now = Date.now();
  var elapsed = Date.now() - g_last;
  g_last = now;
  // Update the current size (adjusted by the elapsed time)
  var newSize = size + (GROWTH_RATE * elapsed) / 1000.0;
  return newSize;
}

// Generate a list of between 2 and 10 Bacteria
function generateBacteria(gl) {
  var bacteriaList = [];
  var spawnAmount = Math.floor(Math.random() * 10) + 2;
  for (let i = 0; i < spawnAmount; i++) {
    //generarate random radian
    bacteriaList.push(new Bacteria(gl));
  }
  return bacteriaList;
}

// Generate vertices for the disc being drawn (either dish or bacteria)
function genDiscVertices(x, y, radius) {
  console.log("generating disc vertices...");
  var vertices = [];
  for (let degrees = 0; degrees <= 360; degrees++) {
    let rads = degrees * (Math.PI / 180);
    //push outer
    vertices.push(radius * Math.cos(rads) + x);
    vertices.push(radius * Math.sin(rads) + y);
    //push center
    vertices.push(x);
    vertices.push(y);
  }
  return vertices;
}

// get distance between both points with BC = √(|bacteriaX-clickX|^2 + |bacteriaY-clickY|^2)
function pointDistance(clickX, clickY, bacteriaX, bacteriaY) {
  return Math.sqrt(
    Math.pow(Math.abs(bacteriaX - clickX), 2) +
      Math.pow(Math.abs(bacteriaY - clickY), 2)
  );
}

// Registers a click and checks to see if a bacteria has been clicked on
function click(e, canvas) {
  let x = e.clientX;
  let y = e.clientY;
  let rect = e.target.getBoundingClientRect();

  x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  for (let i = 0; i < bacteriaAlive.length; i++) {
    // if a bacteria was clicked on, destroy it and increase the player score
    if (
      pointDistance(
        x,
        y,
        bacteriaAlive[i].position[0],
        bacteriaAlive[i].position[1]
      ) -
        bacteriaAlive[i].radius <
      0
    ) {
      PLAYER_SCORE += Math.ceil(10 + 1 / bacteriaAlive[i].radius);
      bacteriaAlive[i].kill(i);
      break;
    }
  }
}

class Bacteria {
  // Spawn new bacteria with color and location properties
  constructor(gl) {
    this.gl = gl;
    this.alive = true;
    this.color = this.generateColor();
    console.log(this.colorVertices);
    this.position = this.genSpawnPoint();
    this.radius = 0;
  }

  // Generate the color of the bacteria and its color vertices
  generateColor() {
    let colors = [];
    // Generate RGB
    let R = Math.random() * 0.9;
    let G = Math.random() * 0.9;
    let B = Math.random() * 0.9;
    colors = [R, G, B, 1];
    return colors;
  }

  // set the spawn location along the dish for the bacteria
  genSpawnPoint() {
    let spawn = [];
    //generarate random radian
    let rad = (Math.floor(Math.random() * 360) + 1) * (Math.PI / 180);
    //generate x value
    spawn.push(Math.sin(rad).toFixed(2) * DISC_RADIUS);
    //generate y value
    spawn.push(Math.cos(rad).toFixed(2) * DISC_RADIUS);
    return spawn;
  }

  // increase the size of the bacteria as long as it is still alive, then draw it at its new size
  grow() {
    if (this.alive) {
      if (this.radius > 0.5) {
        GAME_SCORE += 50;
        console.log(GAME_SCORE);
        PLAYER_SCORE -= 20;
        this.kill(bacteriaAlive.indexOf(this));
      } else this.radius += GROWTH_RATE;

      drawBacteria(
        this.gl,
        this.radius,
        this.position[0],
        this.position[1],
        this.color
      );
    }
  }

  // Destroys the bacteria
  kill(id) {
    this.position = [0, 0];
    this.radius = 0;
    this.alive = false;
    // remove from the list of live bacteria
    bacteriaAlive.splice(id, 1);
  }
}

// Vertex shader program
let VSHADER_SOURCE =
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
let FSHADER_SOURCE =
  "precision mediump float;" +
  "varying vec3 vColor;" +
  "void main() {\n" +
  "  gl_FragColor = vec4(vColor, 1.0);\n" +
  "}\n";

//Radius for main sphere
const SPHERE_RADIUS = 30;
//growth rate for bacteria
const GROWTH_RATE = 0.2;
// player score
let PLAYER_SCORE = 0;
// bacteria score
let GAME_SCORE = 0;
// declare live bacteria buffer
let bacteriaAlive;
// number of bacteria originally generated
let bacteriaAmount;
let flag = true;

let x_mouse0 = 0;
let y_mouse0 = 0;

let drag = false;

function main() {
  console.log("Initializing Game...");
  // Retrieve <canvas> element
  let canvas = document.getElementById("webgl");

  // Retrieve game elements
  let infection = document.getElementById("infection");
  let score = document.getElementById("playerScore");
  let winState = document.getElementById("winState");


  // Get the rendering context for WebGL
  let gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
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
  gl.clearColor(1, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Specify the viewing volume - define the projection matrix
  let proj_matrix = new Matrix4();
  proj_matrix.setPerspective(90, 1, 0.1, 100); //you can change the parameters to get the best view
  let mo_matrix = new Matrix4(); //model matrix - need to be updated accordingly when the sphere rotates
  let view_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  view_matrix[14] = view_matrix[14] - 60; // view matrix - move camera away from the object
  // Then, pass the projection matrix, view matrix, and model matrix to the vertex shader.
  // for example:
  let _Pmatrix = gl.getUniformLocation(gl.program, "Pmatrix");
  let _Vmatrix = gl.getUniformLocation(gl.program, "Vmatrix");
  let _Mmatrix = gl.getUniformLocation(gl.program, "Mmatrix");
  // Pass the projection matrix to _Pmatrix
  gl.uniformMatrix4fv(_Pmatrix, false, proj_matrix.elements);
  gl.uniformMatrix4fv(_Vmatrix, false, view_matrix);
  gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix.elements);

  let rotMatrix = new Matrix4();

  //generate bacteria
  bacteriaAlive = generateBacteria(gl);
  bacteriaAmount = bacteriaAlive.length;

  // Begin Frames
  function tick() {
    // check for clicks

    canvas.onmouseup = function (e) {
      drag = false;
      click(e, canvas, gl);
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
        let x = e.clientX;
        let y = e.clientY;
        let deltaX = x - x_mouse0;
        let deltaY = y - y_mouse0;
        x_mouse0 = x;
        y_mouse0 = y;
        mo_matrix.multiply(rotMatrix.setRotate(deltaX, 0, 1, 0));
        mo_matrix.multiply(rotMatrix.setRotate(deltaY, 1, 0, 1));
        gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix.elements);
      }
    };

    draw(gl, bacteriaAlive);

    // If the player score becomes negative, set it to 0
    PLAYER_SCORE = PLAYER_SCORE < 0 ? 0 : PLAYER_SCORE;

    // update scores
    infection.innerHTML =
      "Infection Level: " + Math.floor(GAME_SCORE);
    score.innerHTML =
      "Your Score: " + PLAYER_SCORE;
    // Win Conditions
    if (bacteriaAlive.length === 0 && GAME_SCORE < 100) {
      winState.style.color = "green";
      winState.innerHTML = "You Win";
      return; //end game
    }
    // Lose conditions
    else if (GAME_SCORE >= 100) {
      winState.style.color = "red";
      winState.innerHTML = "You Lose";
      return; //end game
    }

    requestAnimationFrame(tick, canvas);
  }

  tick();
}

// Main draw function, clears the canvas and redraws each frame
function draw(gl, bacteriaAlive) {
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawSphere(0, 0, 0, [1, 1, 1], SPHERE_RADIUS, gl, false);
  for (const bacteria of bacteriaAlive) {
    bacteria.grow();
  }
  return 1;
}

// Initialize the vertex buffers for the program
function initIndexBuffers(gl, vertexInputs, fragmentColor, indexData, rotMatrix) {
  let vertices = new Float32Array(vertexInputs);
  let colors = new Float32Array(fragmentColor);
  let indices = new Uint16Array(indexData);

  // Create a buffer object
  // Create a buffer object
  let indexBuffer = gl.createBuffer();
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
  let buffer = gl.createBuffer(); // Create a buffer object
  if (!buffer) {
    console.log("Failed to create the buffer object");
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  let a_attribute = gl.getAttribLocation(gl.program, attribute);
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
function drawSphere(x0, y0, z0, color, radius, gl, isBacteria, arcDegs=360, rotMatrix) {
  // generate number of longitudes and latitudes
  // less divisions for bacteria (optimization purposes)
  let sphereDivs = isBacteria ? 20 : 40;
  let vertices = [];
  let colors = [];
  let indices = [];
  let piDivs = Math.PI / sphereDivs;
  let arcHeight = arcDegs*(sphereDivs/360);

  // Iterate through each vertical slice of the sphere with latitude
  for (let lat = 0; lat <= sphereDivs; lat++) {
    let phi = lat * piDivs;
    let sinPhi = Math.sin(phi);
    let cosPhi = Math.cos(phi);
    // Iterate through every horizontal segment within the vertical slice with longitude
    for (let long = 0; long <= sphereDivs; long++) {
      let theta = long * 2 * piDivs;
      let sinTheta = Math.sin(theta);
      let cosTheta = Math.cos(theta);

      // Calculate position of vertex in relation to origin point of this sphere.
      let x = x0 + radius * sinPhi * sinTheta;
      let y = y0 + radius * cosPhi;
      let z = z0 + radius * sinPhi * cosTheta;

      // Push coordinates of currently calculated sphere vertex
      if (isBacteria) {
       let _rotatedVertices =  function(vertex, rotMatrix) {
        return rotMatrix.multiplyVector4(vertex);
       }(new Vector4([x, y, z, 1]), rotMatrix);
       vertices.push(_rotatedVertices.elements[0]);
       vertices.push(_rotatedVertices.elements[1]);
       vertices.push(_rotatedVertices.elements[2]);
       if (flag === true) {
        flag = false
         console.log(rotMatrix);
         console.log(_rotatedVertices.elements)
         console.log("unrotated vertex: " + x 
         + ", " + y + ", " + z)
         console.log("rotated vertex: " + _rotatedVertices.elements[0] 
         + ", " + _rotatedVertices.elements[1] + ", " + _rotatedVertices.elements[2])
       }
      } else {
        vertices.push(x);
        vertices.push(y);
        vertices.push(z);
      }

      // Push color of vertex
      if (!isBacteria && (lat % 6 == 0 || long % 6 == 0)) {
        colors.push(0);
        colors.push(0);
        colors.push(0);
      } else {
        colors.push(color[0]);
        colors.push(color[1]);
        colors.push(color[2]);
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
    if (lat >= arcHeight) {
      break;
    }
  }
  
    initIndexBuffers(gl, vertices, colors, indices);
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  return indices.length;
}


// Last time that this function was called
let g_last = Date.now();
function animate(size) {
  // Calculate the elapsed time
  let now = Date.now();
  let elapsed = Date.now() - g_last;
  g_last = now;
  // Update the current size (adjusted by the elapsed time)
  let newSize = size + (GROWTH_RATE * elapsed) / 1000.0;
  return newSize;
}

// Generate a list of between 2 and 10 Bacteria
function generateBacteria(gl) {
  let bacteriaList = [];
  let spawnAmount = Math.floor(Math.random() * 10) + 2;
  for (let i = 0; i < spawnAmount; i++) {
    //generarate random radian
    bacteriaList.push(new Bacteria(gl));
  }
  return bacteriaList;
}

// Registers a click and checks to see if a bacteria has been clicked on
function click(e, canvas, gl) {
  const rect = canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = rect.bottom - e.clientY;
  const pixels = new Uint8Array(4);
  gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  for (let i = 0; i < bacteriaAlive.length; i++) {
    // if a bacteria was clicked on, destroy it and increase the player score
    if (
      bacteriaAlive[i].color[0] == (pixels[0] / 254).toFixed(2) &&
      bacteriaAlive[i].color[1] == (pixels[1] / 254).toFixed(2) &&
      bacteriaAlive[i].color[2] == (pixels[2] / 254).toFixed(2)
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
    this.position = this.genSpawnPoint();
    this.radius = SPHERE_RADIUS;
    this.arc = 2
    this.rotMatrix = this.rotateYAxis(this.position[0],this.position[1],this.position[2]);
  }

  // Generate the color of the bacteria and its color vertices
  generateColor() {
    let colors = [];
    // Generate RGB
    let R = (Math.random() * 0.9).toFixed(2);
    let G = (Math.random() * 0.9).toFixed(2);
    let B = (Math.random() * 0.9).toFixed(2);
    colors = [R, G, B];
    return colors;
  }

  rotateYAxis(x, y, z) {
    let rotMat = new Matrix4().setIdentity();
    console.log(rotMat.elements)
    let tran = new Matrix4().setTranslate(x, y, z);
    rotMat = rotMat.concat(tran);
    console.log(tran.elements)
    let rotX = new Matrix4().setRotate(90, 0, 0, 0);
    console.log(rotX.elements)
    rotMat = rotMat.concat(rotX);
    console.log(rotMat.elements)
    let y0Vec = new Vector3([0, 1, 0]);
    console.log(rotMat.elements[5])
    let newYVec = new Vector3([rotMat.elements[4], rotMat.elements[5]*rotMat.elements[7], rotMat.elements[6]]);
    let axisTheta = this.angleBetween(y0Vec, newYVec);
    console.log(axisTheta)
    let rotZ = new Matrix4().setRotate(axisTheta, 0, 0, 1);
    rotMat = rotMat.concat(rotZ);
    return rotMat;
  }

  angleBetween(origin, spawn) {
    console.log(dot(origin.elements, spawn.elements))
    return Math.acos(dot(origin.elements, spawn.elements)/(this.mag(origin.elements)*this.mag(spawn.elements)));
  }

  mag(vector) {
    return Math.sqrt(vector[0]**2+vector[1]**2+vector[2]**2);
  }

  // set the spawn location along the surface of the sphere for the bacteria
  genSpawnPoint() {
    let spawn = [];
    let theta = Math.random() * Math.PI;
    let phi = Math.random() * Math.PI * 2;
    // Generate x, y, z values a bit below the surface
    let x = SPHERE_RADIUS * Math.sin(theta) * Math.cos(phi);
    let y = SPHERE_RADIUS * Math.sin(theta) * Math.sin(phi);
    let z = SPHERE_RADIUS * Math.cos(theta);
    // Push to position array
    spawn.push(x);
    spawn.push(y);
    spawn.push(z);
    return spawn;
  }

  // increase the size of the bacteria as long as it is still alive, then draw it at its new size
  grow() {
    if (this.alive) {
      if (this.arc > 180) {
        GAME_SCORE += 50;
        console.log(GAME_SCORE);
        PLAYER_SCORE -= 20;
        this.kill(bacteriaAlive.indexOf(this));
      } else this.arc += GROWTH_RATE;
      drawSphere(
        this.position[0],
        this.position[1],
        this.position[2],
        this.color,
        this.radius,
        this.gl,
        true,
        this.arc,
        this.rotMatrix
      );
    }
  }

  // Destroys the bacteria
  kill(id) {
    this.position = [0, 0, 0];
    this.radius = 0;
    this.alive = false;
    // remove from the list of live bacteria
    bacteriaAlive.splice(id, 1);
  }
}

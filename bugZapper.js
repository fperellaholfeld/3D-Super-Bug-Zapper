//Vertex Shader Program
// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_color;\n' +
    'varying vec4 v_color;\n' + // varying variable
    'void main() {\n' +
    '  gl_Position = a_Position;\n' +
    '  v_color = a_color;\n' +  // Pass the data to the fragment shader
    '}\n';
// Fragment shader program
var FSHADER_SOURCE =
    'precision mediump float;\n' + // Precision qualifier (See Chapter 6)
    //'varying vec4 v_color;\n' +    // Receive the data from the vertex shader
    'uniform vec4 fragColor;\n' +
    'void main() {\n' +
    '  gl_FragColor = fragColor;\n' +
    '}\n';

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


function init() {
    console.log("Initializing Game...")
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


    //generate bacteria
    bacteriaAlive = generateBacteria(gl);
    bacteriaAmount = bacteriaAlive.length;
    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Begin Frames
    function tick() {
        draw(gl, bacteriaAlive);
        // check for clicks
        canvas.onmousedown = function(e) { click(e, canvas)}

        // If the player score becomes negative, set it to 0
        PLAYER_SCORE = (PLAYER_SCORE < 0) ? 0 : PLAYER_SCORE;

        // update scores
        document.getElementById('infection').innerHTML = "Infection Level: " + Math.floor(GAME_SCORE);
        document.getElementById('playerScore').innerHTML = "Your Score: " + PLAYER_SCORE;
        // Win Conditions
        if (bacteriaAlive.length === 0 && GAME_SCORE < 100) {
            document.getElementById('winState').style.color = "green"
            document.getElementById('winState').innerHTML = "You Win"
            return; //end game
        } 
        // Lose conditions
        else if (GAME_SCORE >= 100){
            document.getElementById('winState').style.color = "red"
            document.getElementById('winState').innerHTML = "You Lose"
            return; //end game
        }
        requestAnimationFrame(tick, canvas);
        
    }
    tick();
}

// Main draw function, clears the canvas and redraws each frame
function draw(gl, bacteriaAlive) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawDish(gl);
    for (var i = 0; i < bacteriaAlive.length; i++) {
        bacteriaAlive[i].grow();
    }
    return 1;
}

// Initialize the vertex buffers for the program
function initVertexBuffers(gl, vertexInputs = []) {
    var vertices = new Float32Array(
        vertexInputs
    );

    var n = vertexInputs.length / 2; // The number of vertices
    //console.log(vertexInputs)
    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to initialize the vertex buffer object');
        return -1;
    }
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);
    return n;
}

// Draw the petri dish
function drawDish(gl) {
    var n = initVertexBuffers(gl, genDiscVertices(0, 0, DISC_RADIUS));
    if (n < 0) {
        console.log('Failed to set the positions of the disc vertices');
        return;
    }
    var fragmentColor = gl.getUniformLocation(gl.program, "fragColor");
    gl.uniform4f(fragmentColor, 1, 1, 1, 1);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
}

// Draw a single bacteria
function drawBacteria(gl, scale, spawnX, spawnY, color) {
    var n = initVertexBuffers(gl, genDiscVertices(spawnX, spawnY, scale))
    if (n < 0) {
        console.log('Failed to set the positions of the disc vertices');
        return;
    }
    var fragmentColor = gl.getUniformLocation(gl.program, "fragColor");
    console.log(color)
    gl.uniform4f(fragmentColor, color[0], color[1], color[2], color[3]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    return;
}

// Last time that this function was called
var g_last = Date.now();
function animate(size) {
    // Calculate the elapsed time
    let now = Date.now()
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
    console.log("generating disc vertices...")
    var vertices = [];
    for (let degrees = 0; degrees <= 360; degrees++) {
        let rads = degrees * (Math.PI / 180);
        //push outer
        vertices.push(radius * Math.cos(rads) + x)
        vertices.push(radius * Math.sin(rads) + y)
        //push center
        vertices.push(x)
        vertices.push(y)
    }
    return vertices;
}

// get distance between both points with BC = √(|bacteriaX-clickX|^2 + |bacteriaY-clickY|^2)
function pointDistance(clickX, clickY, bacteriaX, bacteriaY) {
    return Math.sqrt(Math.pow(Math.abs(bacteriaX-clickX), 2) + Math.pow(Math.abs(bacteriaY-clickY), 2));
}

// Registers a click and checks to see if a bacteria has been clicked on
function click(e, canvas) {
    let x = e.clientX;
    let y = e.clientY;
    let rect = e.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    for (let i = 0; i < bacteriaAlive.length; i++) {
        // if a bacteria was clicked on, destroy it and increase the player score
        if (pointDistance(x, y, bacteriaAlive[i].position[0], bacteriaAlive[i].position[1]) - bacteriaAlive[i].radius < 0) {
            PLAYER_SCORE += Math.ceil(10+(1/(bacteriaAlive[i].radius)));
            bacteriaAlive[i].kill(i)
            break;
        }
    }
}


class Bacteria {
    // Spawn new bacteria with color and location properties
    constructor(gl) {
        this.gl = gl
        this.alive = true;
        this.color = this.generateColor();
        console.log(this.colorVertices)
        this.position = this.genSpawnPoint();
        this.radius = 0;
    }

    // Generate the color of the bacteria and its color vertices
    generateColor() {
        let colors = []
        // Generate RGB
        let R = Math.random() * 0.9;
        let G = Math.random() * 0.9;
        let B = Math.random() * 0.9;
        colors = [R, G, B, 1]
        return colors;
    }

    // set the spawn location along the dish for the bacteria
    genSpawnPoint() {
        let spawn = []
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
                this.kill(bacteriaAlive.indexOf(this))
            } else 
                this.radius += GROWTH_RATE;
            
                
                
            drawBacteria(this.gl, this.radius, this.position[0], this.position[1], this.color);

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
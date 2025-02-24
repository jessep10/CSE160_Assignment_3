// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
    precision mediump float;
    attribute vec4 a_position;
    attribute vec2 a_UV;
    varying vec2 v_UV;
    uniform mat4 u_ModelMatrix; 
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_position;
        v_UV = a_UV;
    }`

// Fragment shader program
var FSHADER_SOURCE = `
    precision mediump float;
    varying vec2 v_UV;
    uniform vec4 u_FragColor;     // Base color
    uniform sampler2D u_Sampler0; // Texture
    uniform int u_whichTexture;

    void main() {
        if (u_whichTexture == -2) {
            gl_FragColor = u_FragColor;
        } else if (u_whichTexture == -1) {
            gl_FragColor = vec4(v_UV, 1.0, 1.0); 
        } else if (u_whichTexture == 0) {
            gl_FragColor = texture2D(u_Sampler0, v_UV);
        } else if (u_whichTexture == 1) {
            // Gradient from top (lighter) to bottom (darker)
            vec3 topColor = vec3(0.678, 0.847, 0.902);  // Light blue (sky color)
            vec3 bottomColor = vec3(0.2, 0.4, 0.8);     // Deep blue (horizon)
            float mixFactor = v_UV.y; // Use the y-coordinate for blending
            gl_FragColor = vec4(mix(bottomColor, topColor, mixFactor), 1.0);
        } else {
            gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0);  
        }
    }`

//Global Variables
let canvas;
let gl;
let a_position;
let a_UV;

let u_FragColor;
let u_size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_whichTexture

function setupWebGL(){
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');
  
    // Get the rendering context for WebGL
    //gl = getWebGLContext(canvas);
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }
  
    gl.enable(gl.DEPTH_TEST);
  }

function connectVariablesToGLSL(){
    //Initialize shaders
    if (!initShaders(gl,VSHADER_SOURCE, FSHADER_SOURCE)){
        console.log('Failed to initialize shaders');
        return;
    }

    // Get the storage location of a_Position
    a_position = gl.getAttribLocation(gl.program, 'a_position')
    if (a_position < 0) {
        console.log('Failed to get the storage location of a_position');
        return;
    }

    //Get the storage location of a a_UV
    a_UV = gl.getAttribLocation(gl.program, 'a_UV')
    if (a_UV < 0) {
        console.log('Failed to get the storage location of a_UV');
        return;
    }

     //Get the storage location of a a_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

     //Get the storage location of a a_ModelMatrix
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

     //Get the storage location of a a_GlobalRotateMatrix
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }
    
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
        console.log('Failed to get the storage location of u_ProjectionMatrix');
        return;
    }
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix');
        return;
    }

    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0){
        console.log('Failed to get the storage location of u_Sampler0');
        return;
    }

    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture) {
        console.log('Failed to get the storage location of u_whichTexture');
        return;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

/*Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
const BACKGROUND = 3;

//UI Global variables
let g_selectedColor=[1.0,1.0,1.0,1.0];
let g_selectedSize=5;
let g_selectedType = POINT;
let g_selectedSegments = 10;
let g_globalAngle = 0;
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_animation=false;
let g_armAngle = 0;
let g_clawAngle = 0;
// Leg movement - each leg has a slightly different phase offset
let g_legAngle1 = 0; 
let g_legAngle2 = 0;
let g_legAngle3 = 0;
let g_lastFrameTime = performance.now(); // Store the last frame timestamp
let g_fps = 0; // Frames per second*/


// Global Variables for Mouse Control
let g_globalAngleX = 0;
let g_globalAngleY = 0;
let g_globalAngleZ = 0;

let g_initialX = 0;        
let g_initialY = 0;
let grow = 0;

//Set up actions for the HTML UI elements

function addActionsForHTMLUI() {

    document.getElementById("angle_slider").addEventListener('mousemove', function() { 
        g_globalAngleX = this.value; 
        renderAllShapes(); 
    });
    

}


function initTexture(gl, n) {
    var image = new Image();
    if (!image) {
        console.log("Failed to create the image object");
        return false;
    }
    image.onload = function(){ sendTexturetoGLSL(image);}

    image.src = './src/sky.jpg';

    return true;
}

// could rename to sendImageToTexture0.... when wanting to add more textures 
function sendTexturetoGLSL(image) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log("failed to creaet the texture object");
        return false;
    }
 
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,  gl.RGB, gl.UNSIGNED_BYTE, image); 
    gl.uniform1i(u_Sampler0, 0);

    console.log("finished loadTexture");
}



function main() {
    setupWebGL();

    connectVariablesToGLSL();

    addActionsForHTMLUI();

    initTexture(gl, 0);

    // Specify the color for clearing <canvas>
    gl.clearColor(0.678,0.847,0.902,1);

    document.onkeydown = keydown;


    canvas.addEventListener('click', function() {
        console.log("clicked");
        removeBlockInFront();
    });
    

    renderAllShapes();


    //renderAllShapes();
    requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
    g_seconds = performance.now() / 1000.0 - g_startTime;
    renderAllShapes();
    requestAnimationFrame(tick);
}


var g_camera = new Camera()

function keydown(ev) {
    // Use WASD for movement and Q/E for panning
    if (ev.keyCode == 87) {  // W key
        g_camera.forward();
    } else if (ev.keyCode == 83) {  // S key
        g_camera.back();
    } else if (ev.keyCode == 65) {  // A key
        g_camera.left();
    } else if (ev.keyCode == 68) {  // D key (for moving right)
        g_camera.right();  // Add this line to move right
    } else if (ev.keyCode == 81) {  // Q key (pan left)
        g_camera.panLeft(10); // You can adjust the rotation angle (e.g., 10 degrees)
    } else if (ev.keyCode == 69) {  // E key (pan right)
        g_camera.panRight(10); // You can adjust the rotation angle (e.g., 10 degrees)
    }

    
    renderAllShapes();  // Renders with update camera 
    console.log(ev.keyCode);
}


var g_map = [
    [1, 1, 1, 0, 0, 1, 1, 1,],
    [1, 0, 1, 1, 0, 1, 0, 1,],
    [1, 0, 0, 0, 0, 1, 0, 1,],
    [1, 1, 0, 1, 1, 1, 0, 1,],
    [1, 0, 0, 1, 0, 0, 0, 1,],
    [1, 1, 0, 1, 1, 1, 0, 1,],
    [1, 0, 0, 0, 0, 0, 0, 1,],
    [1, 1, 1, 1, 1, 1, 1, 1,]
];

function getBlockInFront() {
    var direction = new Vector3(g_camera.at).sub(g_camera.eye).normalize();
    var stepSize = 0.2; // Smaller step size for accuracy
    var maxDistance = 50; // Max distance to check for blocks

    // Iterate forward along the view direction
    for (let i = 0; i < maxDistance / stepSize; i++) {
        
        var checkPosition = new Vector3(g_camera.eye).add(direction.mul(stepSize * i));
        console.log(`check position (${checkPosition.elements[0]}, ${checkPosition.elements[1]}, ${checkPosition.elements[2]})`);

        var row = Math.floor(-checkPosition.elements[2] + 4); // Z-axis controls row
        var col = Math.floor(checkPosition.elements[0] + 4);  // X-axis controls column

        console.log(`Checking block at (row: ${row}, col: ${col})`);

        // Ensure the indices are within the bounds of g_map
        if (row >= 0 && row < g_map.length && col >= 0 && col < g_map[0].length) {
            console.log(`Block value: ${g_map[row][col]}`);
            if (g_map[row][col] === 1) {
                return { x: row, y: col };  // Return correct grid indices
            }
        }
    }

    return null;  // No block found
}

var count = 0 ;
var altered = false;



function removeBlockInFront() {
    var block = getBlockInFront();
    console.log("here")
    console.log(block)
    if (block) {
        console.log(`Trying to remove block at (${block.x}, ${block.y})`);
        console.log(`Before removal: ${g_map[block.x][block.y]}`);
        g_map[block.x][block.y] = 0;
        console.log(`After removal: ${g_map[block.x][block.y]}`);

        grow = grow + 3;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        renderAllShapes();  // Re-render the map to reflect the change
        altered = true;
    } else {
        console.log("No block found in front of the camera.");
    }
}


function drawMap() {
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            if (g_map[x][y] == 1) {
                for (let height = 0; height < 3; height++) { // Change 3 to any height
                    let wall = new Cube();
                    wall.color = [0.6, 0.6, 0.6, 1]; // Light gray walls
                    wall.matrix.translate(x - 4, height - 0.75, y - 4); // Adjust Y for height
                    wall.render();
                }
            }
        }
    }
}


//Renders all points
function renderAllShapes(){

    var startTime = performance.now();

    var projMat = new Matrix4();
    projMat.setPerspective(60, canvas.width/canvas.height, 0.1, 100);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

    var viewMat = new Matrix4();

    viewMat.setLookAt(
        g_camera.eye.elements[0], g_camera.eye.elements[1] + grow, g_camera.eye.elements[2],
        g_camera.at.elements[0], g_camera.at.elements[1] + grow, g_camera.at.elements[2],
        g_camera.up.elements[0], g_camera.up.elements[1], g_camera.up.elements[2]);
    // viewMat.setLookAt(0,0,3,  0,0,-100,  0,1,0);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

    // Combine rotations around the X, Y, and Z axes
    var rotationMatrix = new Matrix4();
    rotationMatrix.rotate(g_globalAngleX, 1, 0, 0);  // Rotate around X-axis
    rotationMatrix.rotate(g_globalAngleY, 0, 1, 0);  // Rotate around Y-axis
    rotationMatrix.rotate(g_globalAngleZ, 0, 0, 1);  // Rotate around Z-axis


    // Send the combined rotation matrix to the shader
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, rotationMatrix.elements);

    // Clear the screen and render the object
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT); 

    drawMap();

    var floor = new Cube();
    floor.color = [1,0,0,1];
    floor.textureNum = 0;
    floor.matrix.translate(0,-0.75,0);
    floor.matrix.scale(10,0,10);
    floor.matrix.translate(-0.5,0,-0.5);
    floor.render();

    var sky = new Cube();
    sky.color = [1,0,0,1];
    sky.textureNum = 1;
    sky.matrix.scale(50,50,50);
    sky.matrix.translate(-0.5,-0.5,-0.5);
    sky.render();


    var head = new Cube();
    head.color = [0.45,0.45,0.45,1.0];
    head.textureNum = 0;
    head.matrix.translate(-.2, 0.2, 0);
    headMatrix = new Matrix4(head.matrix);
    head.matrix.scale(0.4,0.4,0.2);
    head.render();

    var neck = new Cube();
    neck.color = [0.45,0.45,0.45,1.0];
    neck.matrix.translate(-.125, 0.14, 0);
    neck.matrix.scale(0.25,0.05,0.2);
    neck.render();

    //Check the time at the end of the function, and show on web page
    var duration = performance.now() - startTime;
    sendTextToHTML((" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)), 'outputDiv');
}

//Set the text to a HTML element 
function sendTextToHTML(text, html_ID){
    var htmlElm = document.getElementById(html_ID);
    if (!htmlElm) {
        console.log("Failed to get " + htmlElm + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}
 
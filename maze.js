/**
 * Program 7 - Maze
 *
 * Mark Dickerson
 * 5/14/15
 **/

/*
* SPECIAL FEATURES
* Radial Attenuation as well as Angular Attenuation on spotlight
* Camera movement - Designed to mimick human's movement. WASD allows you to look around, and Arrows allow you to move
* Collision Detection - I spent a long time trying to work out bugs but ultimately failed to get it working.
* I deleted it from backward/side-to-side movement but kept it on moving forward so you could see hw it worked
*/

var vertexShader = "vertex-shader-phong";
var fragmentShader = "fragment-shader-phong";

var collisionDetection = true;


window.onload= function main(){




    var gl = initialize();

    var maze = new Maze(gl, 5,5);
    console.log('v2');
    var camera;

    // Camera is positioned at start of maze
    camera  = new Camera(gl, -(2*maze.x)+2*maze.start[0],0.0, -(2*maze.y)+2*maze.start[1]);
    

    Promise.all([ initializeTexture(gl, 1, 'images/rock.jpg'),
          initializeTexture(gl, 2, 'images/secret_floor.jpg')])
      .then(function () {render();})
      .catch(function (error) {alert('Failed to load texture '+  error.message);});
    

    //Captures the key down and key up events and store them.
    var keyMap = {};
    
    window.onkeydown = function(e){
   
        keyMap[e.which] = true;
        //console.log(keyMap);
    }
    
    window.onkeyup = function(e){
       
         keyMap[e.which] = false;

    }
    
    
    /*
     * The render function looks for the keys I care about in my keymap and adds the appropriate
     * adjustments to the camera before rendering the terrain.
     */ 
    var render = function(){
        var collisionBuffer = 0.05;
        if  (keyMap['W'.charCodeAt(0)]){
            var yAngle = 0.0;
            if (camera.rotationMatrix[2][1] != 0.0) {
                var moveDirection = normalize(vec3(camera.rotationMatrix[2][0],0.0,camera.rotationMatrix[2][2]));
                yAngle = (180/Math.PI)*Math.acos(dot(vec3(camera.rotationMatrix[2]),moveDirection));
            }
            if ((yAngle < 30 && camera.rotationMatrix[2][1] < 0.0)|| camera.rotationMatrix[2][1] >= 0.0) {
                camera.pitch(-0.5);
            } 

            
        }
        if (keyMap['S'.charCodeAt(0)]){

            var yAngle = 0.0;
            if (camera.rotationMatrix[2][1] != 0.0) {
                var moveDirection = normalize(vec3(camera.rotationMatrix[2][0],0.0,camera.rotationMatrix[2][2]));
                yAngle = (180/Math.PI)*Math.acos(dot(vec3(camera.rotationMatrix[2]),moveDirection));
            }
            if ((yAngle < 30 && camera.rotationMatrix[2][1] > 0.0)|| camera.rotationMatrix[2][1] <= 0.0) {
                camera.pitch(0.5);
            } 
        }
        /*
        if  (keyMap['Q'.charCodeAt(0)]){
            camera.roll(-.3);
        }
        if (keyMap['E'.charCodeAt(0)]){
            camera.roll(.3);
        }
        */
        
        if  (keyMap['A'.charCodeAt(0)]){
            camera.turn(-1);
        }
        if (keyMap['D'.charCodeAt(0)]){
            camera.turn(1);
        }
        
        if  (keyMap['38']){ // up arrow
            var dir = normalize(vec3(camera.rotationMatrix[2][0],0.0,camera.rotationMatrix[2][2]))
            var loc = vec3(camera.location);
            console.log(dir);

            if(collisionDetection){
                // Collision Detection does not work yet :(
                if (legalMove(maze,dir,loc)) {
                    camera.forward(0.1);
                }
            } else {
                camera.forward(0.1);
            }    

        }
        if (keyMap['40']){ // down arrow
            camera.forward(-0.1);

        }
        if  (keyMap['37']){ // up arrow
            camera.sideways(0.1);
            
        }
        if (keyMap['39']){ // down arrow
            camera.sideways(-0.1);            
        }

        camera.set();

        // Sets Light Position to Camera Position
        var u_LightPosition= gl.getUniformLocation(gl.program, 'u_LightPosition');
        gl.uniform3f(u_LightPosition, camera.location[0],0.0,camera.location[2]);

        // Sets Light Directin to Camera Directin
        var ld = vec3(camera.rotationMatrix[2])
        var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
        gl.uniform3f(u_LightDirection, ld[0],ld[1],ld[2]);

        // Draw
        gl.clear(gl.COLOR_BUFFER_BIT |gl.DEPTH_BUFFER_BIT);
        maze.draw();
        requestAnimationFrame(render);
    };
    
    render();
}

/* Checks to see if move in from loc in direction of dir will run into wall
*/
function legalMove(maze,dir,loc) {

    var target = add(loc,scalev(0.1,dir));
    //var x = Math.floor((target[0]+maze.x*2+1)/2.0);
    // var y = Math.floor((target[2]+maze.y*2+1)/2.0);
    console.log('----------------------------------');
    console.log(maze);
    console.log('location: ' + loc, 'target: ' + target);
    console.log((target[0]+maze.x*2+1)/2.0, (target[2]+maze.y*2+1)/2.0);
    
    if(dir[0] > 0){
        var x = Math.floor((target[0]+maze.x*2+1)/2.0);
    } else {
        var x = Math.ceil((target[0]+maze.x*2+1)/2.0);
    }
    
    if(dir[2] > 0){
        var y = Math.floor((target[2]+maze.y*2+1)/2.0);
    } else {
        var y = Math.ceil((target[2]+maze.y*2+1)/2.0);
    }

    if(maze.maze[x][y] == 0.0){ // If target location is open
        return true;
    } else{
        return false;
    } 
}



function initialize() {
    var canvas = document.getElementById('gl-canvas');
    
    // Use webgl-util.js to make sure we get a WebGL context
    var gl = WebGLUtils.setupWebGL(canvas);
    
    if (!gl) {
        alert("Could not create WebGL context");
        return;
    }
    
    
    // set the viewport to be sized correctly
    gl.viewport(0,0, canvas.width, canvas.height);
    gl.clearColor(0.4, 0.7, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // create program with our shaders and enable it
    gl.program = initShaders(gl, vertexShader, fragmentShader);
    gl.useProgram(gl.program);

    
    gl.u_ModelMatrix =  gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    gl.u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    gl.u_Projection = gl.getUniformLocation(gl.program, 'u_Projection');


    gl.currentTransform = scale(1.0,1.0,1.0);
    gl.matrixStack = new Array();


    gl.uniformMatrix4fv(gl.u_ModelMatrix, false, flatten(gl.currentTransform));
    
    
    // set the perspective projection
    var projection  = perspective(70, canvas.width/canvas.height, 1, 800);
    gl.uniformMatrix4fv(gl.u_Projection, false, flatten(projection));
    
    // BEGIN LIGHTING SETUP
    
    var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);
    
    var u_DiffuseLight = gl.getUniformLocation(gl.program, 'u_DiffuseLight');
    gl.uniform3f(u_DiffuseLight, 0.9, 0.9, 0.9);

    var u_DiffuseLight = gl.getUniformLocation(gl.program, 'u_SpecularLight');
    gl.uniform3f(u_DiffuseLight, 0.9, 0.9, 0.9);

    var u_Shininess = gl.getUniformLocation(gl.program, 'u_Shininess');
    gl.uniform1f(u_Shininess, 3.0);
    // END LIGHTING SETUP

    //get location of attribute text_coord
    gl.a_TexCoord = gl.getAttribLocation(gl.program, "a_TexCoord");
    gl.enableVertexAttribArray(gl.a_TexCoord);
    gl.u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');

    return gl;
}


/*
 * Generates Maze and stores it in an array.
 */
function Maze(gl, x,y) {

    //initialize maze
    // 2 = Unvisited Empty Cell
    // 1 = Wall
    // 0 = Visited Empty Cell
    this.x = x;
    this.y = y;
    this.maze;
    this.start = [0,0];

    var maze = new Array(2*x+1);

    for (var i = 0; i < 2*x+1; i++){
        maze[i] = new Array(2*y+1);
    }
    //Initializing Walls
    for (var i = 0; i < 2*x+1; i+=2){
        for (var j = 0; j < 2*y+1; j++){
            maze[i][j] = 1;
        }
    }
    for (var j = 0; j < 2*y+1; j+=2){
        for (var i = 0; i < 2*x+1; i++){
            maze[i][j] = 1;
        }
    }
    //Initializing Empty Cells
    for (var i = 1; i < 2*x; i+=2){
        for (var j = 1; j < 2*y; j+=2){
            maze[i][j] = 2;
        }
    }

    // Generate Maze
    this.start = [Math.floor(Math.random()*(x-1))*2+1,Math.floor(Math.random()*(y-1))*2+1];
    //maze[start[0]][start[1]] = 0;
    var sNeighbors = [];

    if (this.start[0]-2 > 0)
        sNeighbors.push([this.start[0]-2,this.start[1]]);
    if (this.start[0]+2 < 2*x)
        sNeighbors.push([this.start[0]+2,this.start[1]]);
    if (this.start[1]-2 > 0)
        sNeighbors.push([this.start[0],this.start[1]-2]);
    if (this.start[1]+2 < 2*y)
        sNeighbors.push([this.start[0],this.start[1]+2]);

    sNeighbors = shuffle(sNeighbors);

    generateMaze(this.start,sNeighbors);

    this.maze = maze;

    function generateMaze(current,neighbors) {

        maze[current[0]][current[1]] = 0;

        for (var i = 0; i < neighbors.length; i++) {
            if (maze[neighbors[i][0]][neighbors[i][1]] == 2) {

                
                var wallx = (current[0]+neighbors[i][0])/2;
                var wally = (current[1]+neighbors[i][1])/2;


                maze[wallx][wally] = 0;
                var newNeighbors = [];

                if (neighbors[i][0]-2 > 0 && maze[neighbors[i][0]-2][neighbors[i][1]] == 2)
                    //console.log("new"+[current[0]-2+","+current[1]])
                    newNeighbors.push([neighbors[i][0]-2,neighbors[i][1]]);
                if (neighbors[i][0]+2 < 2*x && maze[neighbors[i][0]+2][neighbors[i][1]] == 2)
                    newNeighbors.push([neighbors[i][0]+2,neighbors[i][1]]);
                if (neighbors[i][1]-2 > 0 && maze[neighbors[i][0]][neighbors[i][1]-2] == 2)
                    newNeighbors.push([neighbors[i][0],neighbors[i][1]-2]);
                if (neighbors[i][1]+2 < 2*y && maze[neighbors[i][0]][neighbors[i][1]+2] == 2)
                    newNeighbors.push([neighbors[i][0],neighbors[i][1]+2]);

                newNeighbors = shuffle(newNeighbors);

                generateMaze(neighbors[i],newNeighbors);
                

            }
        }

    }
    /*
    * Draw's maze
    */
    this.draw = function(){

        cube = new Cube(gl);

                gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.vertexAttribPointer(gl.a_TexCoord, 2, gl.FLOAT, false,  0,0);
        


        for (var i = 0; i < 2*x+1; i++) {
            for (var j = 0; j < 2*y+1; j++) {
                if (maze[i][j] == 1) {
                    // WALL
                    
                    gl.uniform1i(gl.u_Sampler,1);


                    gl.matrixStack.push(gl.currentTransform);   
                    gl.currentTransform = mult(gl.currentTransform, translate(-(2*x)+2*i, 0.0,-(2*y)+2*j)); 
                    cube.draw();
                    gl.currentTransform = gl.matrixStack.pop();
                } else {
                    //FLOOR
                    gl.uniform1i(gl.u_Sampler,2);

                    gl.matrixStack.push(gl.currentTransform);   
                    gl.currentTransform = mult(gl.currentTransform, translate(-(2*x)+2*i, -2.0,-(2*y)+2*j)); 
                    cube.draw();
                    gl.currentTransform = gl.matrixStack.pop();
                    
                    //ROOF
                    gl.uniform1i(gl.u_Sampler,1);


                    gl.matrixStack.push(gl.currentTransform);   
                    gl.currentTransform = mult(gl.currentTransform, translate(-(2*x)+2*i, 2.0,-(2*y)+2*j)); 
                    cube.draw();
                    gl.currentTransform = gl.matrixStack.pop();
                }
            }
        }
    }
    
    /*
    * Print's maze to console
    */
    function printMaze(mArray) {
        line = "\n";
        for (var j = 0; j < 2*y+1; j++){
            for (var i = 0; i < 2*x+1; i++){
                line = line.concat(mArray[i][j]);
            }
            line = line.concat("\n")
        }
        console.log(line);
    }
}

/*
* Shuffles elements in an array
*/
function shuffle(array) {
  var m = array.length, t, i;

  // While there remain elements to shuffle…
  while (m) {

    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}



/*
 * This creates a generic Quaternion object which I use for storing orientation in my camera.
 */
function Quaternion(w,x,y,z) {
    this.w = w;
    this.x = x;
    this.y = y;
    this.z = z;
    
    /* Multiply this quaternion by another and return the result.
    Since multiplcation order is important, note that we are multiplying this*q.
    */
    this.multiply = function(q){
        var w = this.w * q.w - this.x*q.x - this.y*q.y - this.z*q.z;
        var x = this.w * q.x + this.x*q.w + this.y*q.z - this.z*q.y;
        var y = this.w * q.y - this.x*q.z + this.y*q.w + this.z*q.x;
        var z = this.w * q.z + this.x*q.y - this.y*q.x + this.z*q.w;
        return new Quaternion(w,x,y,z);
    }
    
    /* Return the inverse of a quaternion */
    this.conjugate = function(){
        return new Quaternion(this.w, -this.x, -this.y, -this.z);
    }
    
    /* Normalize the quaternion */
    this.normalize = function(){
        var magnitude = Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z + this.w*this.w);
        
        this.w /= magnitude;
        this.x /= magnitude;
        this.y /= magnitude;
        this.z /= magnitude;
    }
    
    /* Convert the quaterion to a rotation matrix */
    this.toRotationMatrix = function(){
        this.normalize();
        var xx = this.x*this.x;
        var yy = this.y*this.y;
        var zz = this.z*this.z;
        var xy = this.x*this.y;
        var xz = this.x*this.z;
        var xw = this.x*this.w;
        var yz = this.y*this.z;
        var yw = this.y*this.w;
        var zw = this.z*this.w;
        
        return mat4(1 - 2*(yy+zz), 2*(xy - zw),     2*(xz + yw),   0,
                    2*(xy+zw),     1 - 2*(xx + zz), 2*(yz - xw),   0,
                    2*(xz-yw),     2*(yz+xw),       1 - 2*(xx+yy), 0,
                    0,             0,               0,             1);
    }
}




/* This is a quaternion based camera.
 The position is stored as a vec4 and the orientation is stored as a Quaternion.
 */
function Camera(gl, x, y, z) {
    this.location = vec4(x, y, z,1);
    this.orientation = new Quaternion(-1,0,0,0);
    this.rotationMatrix = mat4();
    
    
    /*
     *Move the camera forward by amount.
     *
     * Considering the current orientation of the camera, we want to move along the vector N
     * (or more precisely, -N). So we extract N from our transformation matrix, and then use that
     * to update the eye position.
     */
    this.forward = function(amount){
        var n = vec3(this.rotationMatrix[2]);
        n[1] = 0.0;
        n = vec4(normalize(n),1.0);
        var displacement = scalev(-amount, n);
        this.location = add(this.location, displacement);
    }

    this.sideways = function(amount){
        //var n = this.rotationMatrix[2];
        //console.log(this.rotationMatrix[2]);
        //console.log(this.rotationMatrix[1]);
        var n = vec4(cross(this.rotationMatrix[1],this.rotationMatrix[2]),1);
        n = vec4(n[0],0.0,n[2],1.0);
        //console.log(n);
        var displacement = scalev(-amount, n);
        this.location = add(this.location, displacement);
    }
    
    
    /*
     * Roll the camera.
     * All of the rotations work the same way. We build a basic quaterion representing the rotation,
     * multiply our quaternion by it, normalize the result and then regenerate the rotation matrix so
     * that it is available for position calculations.
     */
    this.roll = function(angle){
        var c = Math.cos(radians(angle/2));
        var s = Math.sin(radians(angle/2));
        var tmp = new Quaternion(c, 0, 0, s);
        tmp.normalize();
        this.orientation = tmp.multiply(this.orientation);
        this.rotationMatrix = this.orientation.toRotationMatrix();
    }
    
    /*
     * Pitch the camera.
     * Works like roll().
     */ 
    this.pitch = function(angle){

        var c = Math.cos(radians(angle/2));
        var s = Math.sin(radians(angle/2));
        var tmp = new Quaternion(c, s, 0, 0);
        tmp.normalize();
        this.orientation = tmp.multiply(this.orientation);
        this.rotationMatrix = this.orientation.toRotationMatrix();
    }
    
    /*
     * turn the camera.
     */ 
    this.turn = function(angle){

        var yAngle = 0.0;
        var yDir = 0.0
        if (this.rotationMatrix[2][1] > 0.0) {
            yDir = 1;
        } else if (this.rotationMatrix[2][1] < 0.0){
            yDir = -1;
        }

        if (yDir != 0.0) {
            var moveDirection = normalize(vec3(this.rotationMatrix[2][0],0.0,this.rotationMatrix[2][2]));
            yAngle = (180/Math.PI)*Math.acos(dot(vec3(this.rotationMatrix[2]),moveDirection));
        }

        this.pitch(yDir*yAngle);

        var c = Math.cos(radians(angle/2));
        var s = Math.sin(radians(angle/2));
        var tmp = new Quaternion(c, 0, s, 0);
        tmp.normalize();
        var xzOrientation = new Quaternion(this.orientation.w, 0.0, this.orientation.y, 0.0);
        this.orientation = tmp.multiply(xzOrientation);
        this.rotationMatrix = this.orientation.toRotationMatrix();

        this.pitch(-yDir*yAngle);


    }
    
    /*
     * Set the camera in place by creating a view matrix with the position and the rotation matrix and
     * then pass it down to the graphics card.
     */
    this.set= function(){
        var transform = mult(this.rotationMatrix, translate(-this.location[0], -this.location[1], -this.location[2]) );

        gl.uniformMatrix4fv(gl.u_ViewMatrix, false, flatten(transform));
    }
    
}


/*
* The cube is the building block of my maze
*/
function Cube(gl){
    var vertexBuffer;
    var normalBuffer;
    var texBuffer;
    var indexBuffer;
    var FSIZE;
    var numVertices;
    
   
    // vertices of the cube, we are duplicating points because the faces have different normals
    var vertices  = new Float32Array([
          1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0,-1.0, 1.0,  1.0,-1.0, 1.0, // front face
          1.0, 1.0, 1.0,  1.0,-1.0, 1.0,  1.0,-1.0,-1.0,  1.0, 1.0,-1.0, // right face
          1.0, 1.0,-1.0,  1.0,-1.0,-1.0, -1.0,-1.0,-1.0, -1.0, 1.0,-1.0, // back face
         -1.0, 1.0,-1.0, -1.0,-1.0,-1.0, -1.0,-1.0, 1.0, -1.0, 1.0, 1.0, // left face
          1.0, 1.0, 1.0,  1.0, 1.0,-1.0, -1.0, 1.0,-1.0, -1.0, 1.0, 1.0, // top face
          1.0,-1.0, 1.0, -1.0,-1.0, 1.0, -1.0,-1.0,-1.0,  1.0,-1.0,-1.0, // bottom face
    ]);
    
    
    var normals = new Float32Array([
        0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // front face
        1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // right face
        0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0, // back face
       -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // left face
        0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // top face
        0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // bottom face
    ]);
    
    var textureCoordinates = new Float32Array([
       1.0, 1.0,  0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // front face
       1.0, 1.0,  0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // right face
       1.0, 1.0,  0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // back face
       1.0, 1.0,  0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // left face
       1.0, 1.0,  0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // top face
       1.0, 1.0,  0.0, 1.0, 0.0, 0.0, 1.0, 0.0 // bottom face
    ]);
    

    
    var indices = new Uint8Array([
       0,1,2,  0,2,3, // front face
       4,5,6,  4,6,7,   // right face
       8,9,10, 8,10,11, // back face
       12,13,14,  12,14,15, // left face
       16,17,18, 16,18,19, // top face
       20,21,22, 20,22,23 // bottom face
    ]);
    

    
    vertexBuffer = createBuffer(gl, gl.ARRAY_BUFFER, vertices, 'vertex', gl.STATIC_DRAW);
    normalBuffer = createBuffer(gl, gl.ARRAY_BUFFER, normals, 'normal', gl.STATIC_DRAW);
    indexBuffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, indices, 'index', gl.STATIC_DRAW);
    texBuffer = createBuffer(gl, gl.ARRAY_BUFFER, textureCoordinates, 'texture coordinate', gl.STATIC_DRAW);

    this.draw = function() {

        
        gl.uniformMatrix4fv(gl.u_ModelMatrix, false, flatten(gl.currentTransform));

        enableAttribute(gl, vertexBuffer, 'a_Position', 3, 0, 0);
        enableAttribute(gl, normalBuffer, 'a_Normal', 3, 0, 0);
        enableAttribute(gl, texBuffer, 'a_TexCoord', 2, 0, 0);
        
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
        
    }
    
    
    
}

function initializeTexture(gl, textureid, filename) {
    
    return new Promise(function(resolve, reject){
       var texture = gl.createTexture();

        var image = new Image();
    
    
        image.onload = function(){
            
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
            gl.activeTexture(gl.TEXTURE0 + textureid);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
            
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); //second time?

            gl.generateMipmap(gl.TEXTURE_2D);
            resolve();
        }
        
        
        image.onerror = function(error){
            reject(Error(filename));
        }
    
        image.src = filename; 
    });
}



/*
 * This is helper function to create buffers.
 */
function createBuffer(gl, destination, data, name, type){
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the ',name,' buffer');
        return -1;
    }
    
    gl.bindBuffer(destination, buffer);
    gl.bufferData(destination, data, type);
    return buffer;
}


/*
 * This is a new helper function to simplify enabling attributes.
 * Note that this no longer fails if the attribute can't be found. It gives us a warning, but doesn't crash.
 * This will allow us to use different shaders with different attributes.
 */ 
function enableAttribute(gl, buffer, name, size, stride, offset){
   gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
   var attribute = gl.getAttribLocation(gl.program, name);
   if (attribute >= 0) {
       gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, 0,0);
       gl.enableVertexAttribArray(attribute);
   }else{
       console.log('Warning: Failed to get ',name );

   }


}






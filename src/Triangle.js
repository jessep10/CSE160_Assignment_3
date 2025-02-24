class Triangle{
    constructor(){
        this.type = 'triangle';
        this.position = [0.0,0.0,0.0];
        this.color = [1,1,1,1];
        this.size = 5.0;
    }
    render() {
        var xy = this.position;
        var rgba = this.color;
        var size = this.size;

        //Passes Javascript to GSL code

        //gl.vertexAttrib3f(a_position, xy[0], xy[1], 0.0);
        //Pass the color of a point to u_FragColor variable

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        //Pass the size
        gl.uniform1f(u_size, 4.0);

        //Draw
        //gl.drawArrays(gl.POINTS, 0,1);
        var d = this.size/200.0; 
        drawTriangle([xy[0], xy[1], xy[0]+d, xy[1], xy[0], xy[1]+d]); 
    }
}



function drawTriangle(verticies){
    var n = 3;
    
    //Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create buffer object');
        return -1;
    }

    //Blind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    //Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticies), gl.DYNAMIC_DRAW);

    //Assign the buffer object to a_Position var
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0,0);

    //Enable the assignment to a_Position var
    gl.enableVertexAttribArray(a_position);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}



function drawTriangle3D(verticies){
    var n = 3;
    
    //Create a buffer object 
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create buffer object');
        return -1;
    }
    //Blind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    //Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticies), gl.DYNAMIC_DRAW);

    //Assign the buffer object to a_Position var
    gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0,0);

    //Enable the assignment to a_Position var
    gl.enableVertexAttribArray(a_position);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}


function drawTriangle3DUV(verticies, uv){
    var n = 3;

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create buffer object');
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticies), gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0,0);

    gl.enableVertexAttribArray(a_position);

    var uvBuffer = gl.createBuffer();
    if (!uvBuffer) {
        console.log("Failed to create rthe buffer object");
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.DYNAMIC_DRAW);
    
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0,0);

    gl.enableVertexAttribArray(a_UV);



    gl.drawArrays(gl.TRIANGLES, 0, n);
}
var canvas;
var currentLineSize;
$(document).ready(function () {

    canvas = $("#canvas")[0];
    var layer = $("#layer")[0];
    var width = $("#canvas").width();
    var height = $("#canvas").height();
    var ctx = canvas.getContext("2d");
    var lCtx = layer.getContext('2d');
    var tool, currentColor, currentBrushSize, currentEraserSize, currentFont;
    var tempDraw = [];
    var socket = io();
    var mouseDown = false;
    var iX, iY, fX, fY;


    $(".cnvs").mousedown(function (event) {

        makeMouseDown(event);

    })

    $(".cnvs").mouseup(function () {
        makeMouseUp();
    });

    $(".cnvs").mousemove(function (event) {
        makeMouseMove(event);


    });

    $(".tool").click(function () {

        changeTool($(this).attr("id"));

    });


    //text controls///////////////////////////////   
    $("#txtInsert").click(function (e) {

        insertText(e);

    });

    $("#txtValue").keydown(function (e) {

        //insert text on ENTER        
        if (e.keyCode === 13) insertText();

    });

    $("#txtCancel").click(function () {

        $("#txtDialog").hide(100);
        $("#txtValue").val("");
    });
    //////////////////////////////////////////////

    function insertText(event) {
        $("#txtDialog").hide();
        lCtx.font = $("#txtFontStyle").val() + " " + $("#txtFontSize").val() + "px " + $("#txtFontFamily").val();
        ctx.font = $("#txtFontStyle").val() + " " + $("#txtFontSize").val() + "px " + $("#txtFontFamily").val();
        currentFont = ctx.font;
        var pos = getMousePos(canvas, event);
        lCtx.fillText($("#txtValue").val(), pos.x, pos.y);
        tempDraw.push({
            txtData: $("#txtValue").val()
        });
        $("#txtValue").val("");
        mouseDown = true;

    }

    $("#clear").click(function () {
        clear('canvas');
        clear('layer');
        socket.emit('clear');

    });


    $(".color").click(function () {

        changeColor($(this).css("background-color"));
        $("#currentColor").css("background-color", $(this).css("background-color"));

    });


    $("#save").click(function () {

        var dataUrl = canvas.toDataURL('image/png');
        $(this).attr("href", dataUrl);

    });

    $("#toolWidth").change(function () {

        changeSize($(this).val().toString(), tool);

    });

    function makeMouseMove(event) {
        if (mouseDown) {
            draw(event);
        }

    }

    function makeMouseDown(event) {
        mouseDown = true;
        iX = getMousePos(canvas, event).x;
        iY = getMousePos(canvas, event).y;

        if (tool === 'text') {

            //set the moving text on mouse down
            clear('layer');
            ctx.fillText(tempDraw[0].txtData, iX, iY);
            socket.emit('text', {
                text: tempDraw[0].txtData,
                x: iX,
                y: iY,
                color: currentColor,
                font: ctx.font
            })
            switchBoard('normal');
            changeTool('pencil');
        } else if (tool === 'line' || tool === 'rectangle' || tool === 'ellipse' || tool === 'select') {
            switchBoard('inverse');
        } else if (tool === 'eraser') {
            //make eraser independent ot currentLineSize and currentColor
            lCtx.strokeStyle = "black";
            lCtx.lineWidth = "1";

            ctx.fillStyle = "white";

            switchBoard('inverse');
        }

        tempDraw = [];
    }

    function changeTool(t) {

        tool = t;

        if (tool === 'pencil') {
            changeCursor("url(images/brush.png), auto");
            $("#toolWidth").val(currentBrushSize);
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = currentBrushSize;
        } else if (tool === 'eraser') {
            //change cursor
            changeCursor("url(images/eraser.png), auto");
            $("#toolWidth").val(currentEraserSize);
            switchBoard('inverse');


        } else if (tool === 'line' || tool === 'rectangle' || tool === 'ellipse' || tool === 'select') {

            changeCursor("crosshair");
            ctx.lineWidth = currentLineSize;
            lCtx.lineWidth = currentLineSize;
            $("#toolWidth").val(currentLineSize);
            switchBoard('inverse');

        } else if (tool === 'text') {

            $("#txtDialog").show(100);
            changeCursor("text");
            ctx.fillStyle = currentColor;
            switchBoard('inverse');

        }

    }

    function makeMouseUp() {

        mouseDown = false;

        if (tool === 'pencil') {
            socket.emit("pencil", {
                boardData: tempDraw,
                brushSize: currentBrushSize,
                brushColor: currentColor
            });
        } else if (tool === 'eraser') {

            socket.emit('eraser', {
                eraserData: tempDraw,
                eraserSize: currentEraserSize
            });
            clear('layer');
            switchBoard('normal');

            lCtx.fillStyle = currentColor;
            ctx.fillStyle = currentColor;

        } else if (tool === 'line') {

            // draw in real canvas

            ctx.lineWidth = currentLineSize;
            ctx.beginPath();
            ctx.moveTo(iX, iY);
            ctx.lineTo(fX, fY);
            ctx.stroke();

            //hide the layer
            switchBoard('normal');
            clear('layer');


            tempDraw.push({
                x: iX,
                y: iY
            }); //store in array
            tempDraw.push({
                x: fX,
                y: fY
            }); //''''
            socket.emit('line', {
                points: tempDraw,
                lineSize: currentLineSize,
                lineColor: currentColor
            });


        } else if (tool === 'rectangle') {

            ctx.beginPath();
            ctx.rect(iX, iY, fX - iX, fY - iY);
            ctx.stroke();

            //hide the layer
            $("#canvas").css("z-index", 1);
            $("#layer").css("z-index", 0);
            clear('layer');


            tempDraw.push({
                x: iX,
                y: iY,
                w: (fX - iX),
                h: (fY - iY)
            }); //store in array
            socket.emit('rectangle', {
                points: tempDraw,
                lineSize: currentLineSize,
                lineColor: currentColor
            });


        } else if (tool === 'ellipse') {


            var radius = ((fX - iX) + (fY - iY)) / 4;

            ctx.beginPath();
            ctx.moveTo(iX, iY);
            ctx.bezierCurveTo(iX, fY, fX, fY, fX, iY);
            ctx.moveTo(iX, iY);
            ctx.bezierCurveTo(iX, fY - 2 * (fY - iY), fX, fY - 2 * (fY - iY), fX, iY);
            ctx.stroke();


            //hide the layer
            $("#canvas").css("z-index", 1);
            $("#layer").css("z-index", 0);
            clear('layer');


            socket.emit('ellipse', {
                points: {
                    ix: iX,
                    iy: iY,
                    fx: fX,
                    fy: fY,
                    r: radius
                },
                lineSize: currentLineSize,
                lineColor: currentColor
            });


        } else if (tool === 'select') {

            tempDraw.push({
                selectedPart: ctx.getImageData(iX, iY, fX - iX, fY - iY),
                selected: true
            });

        }

        // clear the array when work is finished
        tempDraw = [];
    }

    function changeColor(color) {

        ctx.strokeStyle = color;
        lCtx.strokeStyle = color;
        ctx.fillStyle = color;
        lCtx.fillStyle = color;
        currentColor = color;

    }

    function changeCursor(cursor) {

        $(".cnvs").css("cursor", cursor);

    }

    function changeSize(size, tool) {

        if (tool === 'pencil') {
            ctx.lineWidth = size;
            currentBrushSize = size;

        } else if (tool === 'eraser') {

            // prevent eraser size from enlarging more than screen
            currentEraserSize = (10 * size) / 2;
        } else if (tool === 'line' || tool === 'rectangle' || tool === 'ellipse') {

            currentLineSize = size;
            ctx.lineWidth = size;
            lCtx.lineWidth = size;
        }

    }

    function clear(element) {

        if (element === 'layer') {
            lCtx.clearRect(0, 0, width, height);
        } else if (element === 'canvas') {
            ctx.clearRect(0, 0, width, height);
        }


    }

    function resetLineWidth() {
        //reset default line width, stroke style, fill style
        if (tool === 'line' || tool === 'rectangle' || tool === 'ellipse') {
            ctx.lineWidth = currentLineSize;
            lCtx.lineWidth = currentLineSize;
        } else if (tool === 'pencil') {
            ctx.lineWidth = currentBrushSize;
            lCtx.lineWidth = currentBrushSize;
        }

        lCtx.strokeStyle = currentColor;
        ctx.strokeStyle = currentColor;

    }

    function switchBoard(type) {
        if (type === 'normal') {
            $("#canvas").css("z-index", 1);
            $("#layer").css("z-index", 0);
        } else if (type === 'inverse') {
            $("#canvas").css("z-index", 0);
            $("#layer").css("z-index", 1);
        }
    }

    function getMousePos(canvas, evt) {

        return {
            x: evt.pageX,
            y: evt.pageY
        };

    }

    function draw(e) {

        var pos = getMousePos(canvas, e);

        if (tool === "pencil") {

            tempDraw.push({
                x: iX,
                y: iY
            });
            fX = pos.x;
            fY = pos.y;
            tempDraw.push({
                x: fX,
                y: fY
            });
            ctx.beginPath();
            ctx.moveTo(iX, iY);
            ctx.lineTo(fX, fY);
            ctx.stroke();
            iX = fX;
            iY = fY;

        } else if (tool === "eraser") {

            clear('layer');
            lCtx.beginPath();
            lCtx.arc(pos.x + 8, pos.y + 8, currentEraserSize, 0, 2 * Math.PI);
            lCtx.stroke();


            ctx.beginPath();
            ctx.arc(pos.x + 8, pos.y + 8, currentEraserSize, 0, 2 * Math.PI);
            ctx.fill();
            tempDraw.push({
                x: pos.x + 8,
                y: pos.y + 8
            });

        } else if (tool === 'line') {

            clear('layer');
            fX = pos.x;
            fY = pos.y;
            lCtx.beginPath();
            lCtx.moveTo(iX, iY);
            lCtx.lineTo(fX, fY);
            lCtx.stroke();
        } else if (tool === 'rectangle') {

            clear('layer');
            fX = pos.x;
            fY = pos.y;
            lCtx.beginPath();
            lCtx.rect(iX, iY, fX - iX, fY - iY);
            lCtx.stroke();

        } else if (tool === 'ellipse') {

            clear('layer');
            fX = pos.x;
            fY = pos.y;

            lCtx.beginPath();
            lCtx.moveTo(iX, iY);
            lCtx.bezierCurveTo(iX, fY, fX, fY, fX, iY); // upper curve
            lCtx.moveTo(iX, iY);
            lCtx.bezierCurveTo(iX, fY - 2 * (fY - iY), fX, fY - 2 * (fY - iY), fX, iY); // lower curve
            lCtx.stroke();

        } else if (tool === 'text') {

            clear('layer');
            lCtx.fillText(tempDraw[0].txtData, pos.x, pos.y);
        } else if (tool === 'select') {

            clear('layer');

            if (tempDraw.length === 0 && mouseDown) { // if nothing is selected

                fX = pos.x;
                fY = pos.y;
                lCtx.lineWidth = 0.1;
                lCtx.setLineDash([4, 4]);
                lCtx.beginPath();
                lCtx.rect(iX, iY, fX - iX, fY - iY);
                lCtx.stroke();

            }

            //already selected
            else {

                lCtx.putImageData(tempDraw[0].selectedPart, pos.x, pos.y);
            }

        }

    }

    socket.on('pencil', function (data) {

        ctx.lineWidth = data.brushSize;
        ctx.strokeStyle = data.brushColor;

        for (var i = 0; i <= data.boardData.length - 2; i += 2) {
            iX = data.boardData[i]['x'];
            iY = data.boardData[i]['y'];
            fX = data.boardData[parseInt(i + 1)]['x'];
            fY = data.boardData[parseInt(i + 1)]['y'];

            ctx.beginPath();
            ctx.moveTo(iX, iY);
            ctx.lineTo(fX, fY);
            ctx.stroke();

        }

        resetLineWidth();

    });

    socket.on('eraser', function (data) {

        ctx.fillStyle = 'white';

        for (var i = 0; i < data.eraserData.length; i++) {
            ctx.beginPath();
            ctx.arc(data.eraserData[i].x, data.eraserData[i].y, data.eraserSize, 0, 2 * Math.PI);
            ctx.fill();

        }

    });

    socket.on('line', function (data) {

        ctx.strokeStyle = data.lineColor;
        ctx.lineWidth = data.lineSize;
        ctx.beginPath();
        ctx.moveTo(data.points[0].x, data.points[0].y);
        ctx.lineTo(data.points[1].x, data.points[1].y);
        ctx.stroke();

        resetLineWidth();

    });

    socket.on('rectangle', function (data) {

        ctx.strokeStyle = data.lineColor;
        ctx.lineWidth = data.lineSize;
        ctx.beginPath();
        ctx.rect(data.points[0].x, data.points[0].y, data.points[0].w, data.points[0].h);
        ctx.stroke();

        resetLineWidth();

    });

    socket.on('ellipse', function (data) {

        ctx.strokeStyle = data.lineColor;
        ctx.lineWidth = data.lineSize;
        ctx.beginPath();
        ctx.moveTo(data.points.ix, data.points.iy);
        ctx.bezierCurveTo(data.points.ix, data.points.fy, data.points.fx, data.points.fy, data.points.fx, data.points.iy);
        ctx.moveTo(data.points.ix, data.points.iy);
        ctx.bezierCurveTo(data.points.ix, data.points.fy - 2 * (data.points.fy - data.points.iy), data.points.fx, data.points.fy - 2 * (data.points.fy - data.points.iy), data.points.fx, data.points.iy);
        ctx.stroke();

        resetLineWidth();

    });

    socket.on('text', function (data) {

        //set passed values
        ctx.font = data.font;
        ctx.fillStyle = data.color;
        ctx.fillText(data.text, data.x, data.y);

        //reset default values
        ctx.font = currentFont;
        ctx.fillStyle = currentColor;
    });

    socket.on('clear', function () {
        ctx.clearRect(0, 0, width, height);
    });

    function setDefaults() {

        //set defaults
        changeColor("black");
        changeSize(5, 'pencil');
        changeSize(2, 'line');
        changeSize(10, 'eraser');
        changeTool("pencil");

        //make brush smooth
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        lCtx.lineJoin = 'round';
        lCtx.lineCap = 'round';

        $("#txtDialog").hide();
    }

    $(window).resize(function () {
        fixWidth();
    });

    function fixWidth() {

        width = $(window).width();
        height = $(window).height();

        $(".cnvs").attr("width", width);
        $(".cnvs").attr("height", height);

        //on resize all settings are cleared
        setDefaults();

    }

    fixWidth();

    $(window).on('beforeunload', function () {
        socket.close();
    });


});

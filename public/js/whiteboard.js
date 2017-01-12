(function (window, document) {

    window.onload = function () {

        var i, j;

        var board = {
            canvas: $("#canvas"),
            ctx: 0,
            layer: $("#layer"),
            lctx: 0,
            mouse: {
                mouseDown: false,
                pos: {
                    initial: {
                        x: 0,
                        y: 0
                    },
                    final: {
                        x: 0,
                        y: 0
                    }
                }
            },
            height: 0,
            width: 0,
            tool: 'pencil',

            drawings: {
                dataUrl: [],
                raw: []
            },

            tools: {

                pencil: {
                    lineWidth: 1,
                },

                chalk: {
                    defaultSize: 5,
                    size: 6,
                },

                marker: {
                    defaultSize: 5,
                    size: 6,
                    opacity: 0.2
                },

                circleBrush: {
                    minSizeCir: 1,
                    maxSizeCir: 5,
                    lineWidth: 1
                },

                doubleBrush: {
                    offset: 1,
                    lineWidth: 1
                },

                spray: {
                    density: 20,
                    lineWidth: 1,
                    defaultSize: 5,
                    size: 6,
                },

                eraser: {
                    size: 10,
                    lineWidth: 1,
                    fillStyle: 'white',
                    resetCanvasStyle: function () {
                        board.ctx.fillStyle = board.tools.shape.fillStyle;
                        board.lctx.fillStyle = board.tools.shape.fillStyle;
                        board.ctx.strokeStyle = board.tools.shape.strokeStyle;
                        board.lctx.strokeStyle = board.tools.shape.strokeStyle;
                        board.ctx.lineWidth = board.tools.shape.lineWidth;
                        board.lctx.lineWidth = board.tools.shape.lineWidth;
                    }
                },

                text: {
                    flag: 0,
                    color: 'black',
                    text: '',
                    fontFamily: 'cursive',
                    fontSize: 12,
                    fontStyle: 'bold'
                },

                shape: {
                    lineWidth: 1,
                    fillStyle: 'black',
                    strokeStyle: 'black'
                }
            },

            setCanvas: function () {

                board.height = $(window).height();
                board.width = $(window).width();

                //set canvas size
                board.canvas.attr('height', board.height);
                board.layer.attr('height', board.height);
                board.canvas.attr('width', board.width);
                board.layer.attr('width', board.width);

                // make graphics better
                board.ctx.lineJoin = 'round';
                board.ctx.lineCap = 'round';
                board.lctx.lineCap = 'round';
                board.lctx.lineJoin = 'round';

                //set chat widget size
                $(".chatWidget").css('left', $(window).width() - $(".chatWidget").width() - 2 * parseInt($(".chatWidget").css('border-width')) - 140);

            },

            makeReady: function () {
                //set canvas context
                board.ctx = $("#canvas")[0].getContext('2d');
                board.lctx = $("#layer")[0].getContext('2d');
            },

            drawer: {
                clear: function (context) {
                    context.clearRect(0, 0, board.width, board.height);
                },

                undo: function (context) {

                    if (board.drawings.dataUrl.length > 1) {
                        board.drawer.clear(context);
                        board.drawings.dataUrl.splice(board.drawings.dataUrl.length - 1, 1);
                        var imgData = board.drawings.dataUrl[board.drawings.dataUrl.length - 1]; // last element
                        var image = new Image();
                        image.src = imgData.toString();
                        context.drawImage(image, 0, 0);
                    }

                },

                pencil: function (context, x1, y1, x2, y2) {

                    context.beginPath();
                    context.moveTo(x1, y1);
                    context.lineTo(x2, y2);
                    context.stroke();
                },

                marker: function (context, x1, y1, x2, y2, size, color) {

                    context.globalAlpha = board.tools.marker.opacity;

                    context.strokeStyle = color; // color for big line
                    context.beginPath();
                    context.moveTo(x1, y1);
                    context.lineTo(x2, y2);
                    context.stroke();

                    context.beginPath();
                    context.lineWidth = size / 2;
                    context.strokeStyle = $("#canvas").css("background-color"); // for small middle line
                    context.moveTo(x1, y1);
                    context.lineTo(x2, y2);
                    context.stroke();

                    // reset values
                    context.globalAlpha = 1;
                    context.strokeStyle = board.tools.shape.fillStyle;
                    context.lineWidth = size;

                },

                chalk: function (context, x1, y1, x2, y2, size) {

                    context.beginPath();
                    context.moveTo(x1, y1);
                    context.lineTo(x2, y2);
                    context.stroke();

                    // Chalk Effect
                    var length = Math.round(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / (5 / size));
                    var xUnit = (x2 - x1) / length;
                    var yUnit = (y2 - y1) / length;
                    for (var i = 0; i < length; i++) {
                        var xCurrent = x1 + (i * xUnit);
                        var yCurrent = y1 + (i * yUnit);
                        var xRandom = xCurrent + (Math.random() - 0.5) * size * 1.2;
                        var yRandom = yCurrent + (Math.random() - 0.5) * size * 1.2;
                        context.clearRect(xRandom, yRandom, Math.random() * 2 + 2, Math.random() + 1);
                    }


                },

                spray: function (context, x, y, size) {

                    for (var i = board.tools.spray.density; i--;) {
                        var offsetX = generateRandom(-size, size);
                        var offsetY = generateRandom(-size, size);
                        context.fillRect(x + offsetX, y + offsetY, 1, 1);
                    }

                },

                doubleBrush: function (context, x1, y1, x2, y2, offset) {

                    //upper
                    context.beginPath();
                    context.moveTo(x1 - generateRandom(0, offset), y1 - generateRandom(0, offset));
                    context.lineTo(x2 - generateRandom(0, offset), y2 - generateRandom(0, offset));
                    context.stroke();

                    //mid
                    context.beginPath();
                    context.moveTo(x1, y1);
                    context.lineTo(x2, y2);
                    context.stroke();

                    //lower
                    context.beginPath();
                    context.moveTo(x1 + generateRandom(0, offset), y1 + generateRandom(0, offset));
                    context.lineTo(x2 + generateRandom(0, offset), y2 + generateRandom(0, offset));
                    context.stroke();
                },

                circleBrush: function (context, x1, y1, x2, y2) {

                    //circle join brush effect

                    //first circle
                    context.beginPath();
                    context.arc(x2, y2, generateRandom(board.tools.circleBrush.minSizeCir, board.tools.circleBrush.maxSizeCir), 0, 2 * Math.PI);
                    context.globalAlpha = Math.random();
                    context.fill();

                    //line 
                    context.lineWidth = board.tools.circleBrush.lineWidth;
                    context.beginPath();
                    context.moveTo(x1, y1);
                    context.lineTo(x2, y2);
                    context.stroke();

                    //second circle                    
                    context.beginPath();
                    context.arc(x2, y2, generateRandom(board.tools.circleBrush.minSizeCir, board.tools.circleBrush.maxSizeCir), 0, 2 * Math.PI);
                    context.globalAlpha = Math.random();
                    context.fill();

                    //reset values
                    context.globalAlpha = 1;
                    context.lineWidth = board.tools.shape.lineWidth;

                },

                text: function (context, text, x, y) {
                    context.fillText(text, x, y);
                },

                rect: function (context, x, y, w, h) {
                    context.strokeRect(x, y, w, h);
                },

                circle: function (context, x1, y1, x2, y2) {

                    var x = (x2 + x1) / 2;
                    var y = (y2 + y1) / 2;

                    var radius = Math.max(
                        Math.abs(x2 - x1),
                        Math.abs(y2 - y1)
                    ) / 2;

                    context.beginPath();
                    context.arc(x, y, radius, 0, Math.PI * 2, false);
                    context.stroke();
                    context.closePath();
                },

                ellipse: function (context, x, y, w, h) {

                    var kappa = .5522848;
                    ox = (w / 2) * kappa, // control point offset horizontal
                        oy = (h / 2) * kappa, // control point offset vertical
                        xe = x + w, // x-end
                        ye = y + h, // y-end
                        xm = x + w / 2, // x-middle
                        ym = y + h / 2; // y-middle

                    context.beginPath();
                    context.moveTo(x, ym);
                    context.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
                    context.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
                    context.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
                    context.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
                    context.closePath();
                    context.stroke();

                },

                line: function (context, x1, y1, x2, y2) {

                    context.beginPath();
                    context.moveTo(x1, y1);
                    context.lineTo(x2, y2);
                    context.stroke();

                },

                triangle: function (context, x, y, w, h) {

                    context.beginPath();
                    context.moveTo(x + w / 2, y);
                    context.lineTo(x + w, y + h);
                    context.lineTo(x, y + h);
                    context.lineTo(x + w / 2, y);
                    context.stroke();

                },

                star: function (context, x, y, w, h) {

                    context.beginPath();
                    context.moveTo(x + w / 2, y);
                    context.lineTo(x + 2 * w / 3, y + h / 3);
                    context.lineTo(x + w, y + h / 2);
                    context.lineTo(x + 2 * w / 3, y + 2 * h / 3);
                    context.lineTo(x + w / 2, y + h);
                    context.lineTo(x + w / 3, y + 2 * h / 3);
                    context.lineTo(x, y + h / 2);
                    context.lineTo(x + w / 3, y + h / 3);
                    context.lineTo(x + w / 2, y);
                    context.stroke();

                },

                arrow: function (context, x1, y1, x2, y2) {

                    //line
                    context.beginPath();
                    context.moveTo(x1, y1);
                    context.lineTo(x2, y2);

                    //pointer
                    var dx = x2 - x1;
                    var dy = y2 - y1;
                    var angle = Math.atan2(dy, dx);
                    var headlen = 10;
                    context.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
                    context.moveTo(x2, y2);
                    context.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));

                    context.stroke();
                },

                face: function (context, x1, y1, x2, y2) {

                    var r = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

                    //face
                    context.beginPath();
                    context.arc(x1, y1, r, 0, 2 * Math.PI);
                    context.stroke();

                    //right eye
                    context.beginPath();
                    context.arc(x1 + r / 2, y1 - r / 4, r / 8, 0, 2 * Math.PI);
                    context.stroke();

                    //left eye
                    context.beginPath();
                    context.arc(x1 - r / 2, y1 - r / 4, r / 8, 0, 2 * Math.PI);
                    context.stroke();

                    //mouth
                    context.beginPath();
                    context.arc(x1, y1 + r / 4, r / 2, 5 * Math.PI / 6, Math.PI / 6, true);
                    context.stroke();

                },

                moon: function (context, x, y, w, h) {

                    context.beginPath();
                    context.moveTo(x + w, y);
                    context.quadraticCurveTo(x + w / 2, y + h / 2, x + w, y + h); // lower curve
                    context.moveTo(x + w, y);
                    context.quadraticCurveTo(x, y + h / 2, x + w, y + h); // upper curve
                    context.stroke();

                },

                love: function (context, x, y, w, h) {

                    context.beginPath();
                    context.moveTo(x + w / 2, y + h / 4);
                    context.quadraticCurveTo(x, y - h / 4, x + w / 2, y + h); // left curve
                    context.moveTo(x + w / 2, y + h / 4);
                    context.quadraticCurveTo(x + w, y - h / 4, x + w / 2, y + h); // left curve
                    context.stroke();

                }
            },

            changeTool: function (t) {

                if (t === 'pencil') {
                    board.switch(1);
                    board.ctx.lineWidth = board.tools.pencil.lineWidth;
                    $("#size").val(board.tools.pencil.lineWidth);
                    board.drawings.raw.push({
                        type: 'pencil',
                        data: []
                    });

                } else if (t === 'chalk') {
                    board.switch(1);
                    board.ctx.lineWidth = board.tools.chalk.size;
                    $("#size").val(parseInt(board.tools.chalk.size) - parseInt(board.tools.chalk.defaultSize));
                    board.drawings.raw.push({
                        type: 'chalk',
                        data: []
                    });


                } else if (t === 'marker') {
                    board.switch(1);
                    board.ctx.lineWidth = board.tools.marker.size;
                    $("#size").val(parseInt(board.tools.marker.size) - parseInt(board.tools.marker.defaultSize));
                    board.drawings.raw.push({
                        type: 'marker',
                        data: []
                    });


                } else if (t === 'circleBrush') {
                    board.switch(1);
                    board.ctx.lineWidth = board.tools.circleBrush.lineWidth;
                    board.drawings.raw.push({
                        type: 'circleBrush',
                        data: []
                    });


                } else if (t === 'doubleBrush') {
                    board.switch(1);
                    board.ctx.lineWidth = board.tools.doubleBrush.lineWidth;
                    $("#size").val(parseInt(board.tools.doubleBrush.offset));
                    board.drawings.raw.push({
                        type: 'doubleBrush',
                        data: []
                    });


                } else if (t === 'spray') {
                    board.switch(1);
                    board.ctx.lineWidth = board.tools.spray.lineWidth;
                    $("#size").val(parseInt(board.tools.spray.size) - parseInt(board.tools.spray.defaultSize));
                    board.drawings.raw.push({
                        type: 'spray',
                        data: []
                    });


                } else if (t === 'line' || t === 'rectangle' || t === 'circle' || t === 'triangle' || t === 'ellipse' || t === 'star' || t === 'arrow' || t === 'face' || t === 'moon' || t === 'love' || t === 'ellipse') {
                    board.switch(0);
                    board.ctx.lineWidth = board.tools.shape.lineWidth;
                    board.lctx.lineWidth = board.tools.shape.lineWidth;
                    $("#size").val(board.tools.shape.lineWidth);

                } else if (t === 'eraser') {
                    board.switch(0);
                    board.ctx.lineWidth = board.tools.eraser.lineWidth;
                    board.lctx.lineWidth = board.tools.eraser.lineWidth;
                    $("#size").val(parseInt(board.tools.eraser.size) / 10);

                } else if (t === 'text') {
                    board.switch(0);
                    $("#textControl").css("visibility", "visible");
                }

                //for text
                if (this.tool === 'text') {
                    $("#textControl").css("visibility", "hidden");
                }

                this.tool = t;
                board.drawer.clear(board.lctx); // for eraser
            },

            changeColor: function (color) {
                $("#currentColor").css('background-color', color);
                board.ctx.strokeStyle = color;
                board.lctx.strokeStyle = color;
                board.ctx.fillStyle = color;
                board.lctx.fillStyle = color;
                board.tools.shape.fillStyle = color;
                board.tools.shape.strokeStyle = color;
            },

            changeSize: function (size) {
                if (board.tool === 'pencil') {
                    board.tools.pencil.lineWidth = size;
                    board.ctx.lineWidth = size;
                } else if (board.tool === 'chalk') {
                    board.tools.chalk.size = parseInt(board.tools.chalk.defaultSize) + parseInt(size);
                    board.ctx.lineWidth = board.tools.chalk.size;
                } else if (board.tool === 'doubleBrush') {
                    board.tools.doubleBrush.offset = parseInt(size);
                } else if (board.tool === 'marker') {
                    board.tools.marker.size = parseInt(board.tools.marker.defaultSize) + parseInt(size);
                    board.ctx.lineWidth = board.tools.marker.size;
                } else if (board.tool === 'spray') {
                    board.tools.spray.size = parseInt(board.tools.spray.defaultSize) + parseInt(size);
                } else if (board.tool === 'eraser') {
                    board.tools.eraser.size = size * 10;
                } else if (board.tool === 'rectangle' || board.tool === 'line' || board.tool === 'circle' || board.tool === 'ellipse' || board.tool === 'star' || board.tool === 'arrow' || board.tool === 'triangle' || board.tool === 'face' || board.tool === 'moon') {
                    board.tools.shape.lineWidth = size;
                    board.ctx.lineWidth = size;
                    board.lctx.lineWidth = size;
                }
            },

            switch: function (mode) {
                if (mode) {
                    $("#canvas").css('zIndex', 2);
                    $("#layer").css('zIndex', 1);
                } else {
                    $("#canvas").css('zIndex', 1);
                    $("#layer").css('zIndex', 2);

                }
            },

        }

        $(".tool").click(function () {
            board.changeTool($(this).attr('id'));
            $(".tool").removeClass('boardBtnSelected');
            $(this).addClass('boardBtnSelected');
        });

        $(".color").click(function () {
            board.changeColor($(this).css('background-color'));
        });

        $("#clear").click(function () {
            board.drawer.clear(board.ctx);
            board.drawer.clear(board.lctx);

            rtMan.socket.emit('drawing', {
                data: {
                    type: 'clear'
                },
                room: rtMan.roomname,
                from: rtMan.username
            });

            board.drawings.raw = [];

        });

        $("#undo").click(function () {
            board.drawer.undo(board.ctx);
        });

        $("#size").change(function () {
            board.changeSize($(this).val());
        });

        $(".cnv").on('mousedown touchstart', function (e) {

            board.mouse.mouseDown = true;
            board.mouse.pos.initial.x = e.pageX;
            board.mouse.pos.initial.y = e.pageY;

            if (board.tool === 'bucket') {
                floodfill(board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.ctx.fillStyle, board.ctx, board.width, board.height, 1)
            } else if (board.tool === 'text') {
                board.drawer.text(board.ctx, board.tools.text.text, board.mouse.pos.final.x, board.mouse.pos.final.y);
                board.tools.text.flag = 0;
                board.drawings.dataUrl.push(board.canvas[0].toDataURL());
                //notify about the last drawn text
                rtMan.socket.emit('drawing', {
                    boardData: {
                        type: 'text',
                        data: {
                            font: board.ctx.font,
                            fillStyle: board.ctx.fillStyle,
                            text: board.tools.text.text,
                            x: board.mouse.pos.final.x,
                            y: board.mouse.pos.final.y
                        }
                    },
                    room: rtMan.roomname,
                    from: rtMan.username
                });

            } else if (board.tool === 'pencil') {
                board.drawings.raw.push({
                    type: 'pencil',
                    data: {
                        strokeStyle: board.tools.shape.strokeStyle,
                        lineWidth: board.tools.pencil.lineWidth,
                        points: [{
                            x: board.mouse.pos.initial.x,
                            y: board.mouse.pos.initial.y
                        }]
                    }
                });

            } else if (board.tool === 'chalk') {
                board.drawings.raw.push({
                    type: 'chalk',
                    data: {
                        strokeStyle: board.tools.shape.strokeStyle,
                        size: board.tools.chalk.size,
                        lineWidth: board.tools.chalk.size,
                        points: [{
                            x: board.mouse.pos.initial.x,
                            y: board.mouse.pos.initial.y
                        }]
                    }
                });

            } else if (board.tool === 'marker') {
                board.drawings.raw.push({
                    type: 'marker',
                    data: {
                        strokeStyle: board.tools.shape.strokeStyle,
                        size: board.tools.marker.size,
                        lineWidth: board.tools.marker.size,
                        points: [{
                            x: board.mouse.pos.initial.x,
                            y: board.mouse.pos.initial.y
                        }]
                    }
                });

            } else if (board.tool === 'doubleBrush') {
                board.drawings.raw.push({
                    type: 'doubleBrush',
                    data: {
                        strokeStyle: board.tools.shape.strokeStyle,
                        offset: board.tools.doubleBrush.offset,
                        points: [{
                            x: board.mouse.pos.initial.x,
                            y: board.mouse.pos.initial.y
                        }]
                    }
                });

            } else if (board.tool === 'circleBrush') {
                board.drawings.raw.push({
                    type: 'circleBrush',
                    data: {
                        strokeStyle: board.tools.shape.strokeStyle,
                        points: [{
                            x: board.mouse.pos.initial.x,
                            y: board.mouse.pos.initial.y
                        }]
                    }
                });

            } else if (board.tool === 'spray') {
                board.drawings.raw.push({
                    type: 'spray',
                    data: {
                        strokeStyle: board.tools.shape.fillStyle,
                        size: board.tools.spray.size,
                        points: [{
                            x: board.mouse.pos.initial.x,
                            y: board.mouse.pos.initial.y
                        }]
                    }
                });

            } else if (board.tool === 'eraser') {
                board.drawings.raw.push({
                    type: 'eraser',
                    data: {
                        size: board.tools.eraser.size,
                        points: [{
                            x: board.mouse.pos.initial.x,
                            y: board.mouse.pos.initial.y
                        }]
                    }
                });

            }

        });

        $(".cnv").on('mouseup touchend', function (e) {

            board.mouse.mouseDown = false;

            if (board.tool === 'line') {
                board.drawer.line(board.ctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x, board.mouse.pos.final.y);
                board.drawings.raw.push({
                    type: 'line',
                    data: {
                        lineWidth: board.tools.shape.lineWidth,
                        strokeStyle: board.tools.shape.strokeStyle,
                        x1: board.mouse.pos.initial.x,
                        y1: board.mouse.pos.initial.y,
                        x2: board.mouse.pos.final.x,
                        y2: board.mouse.pos.final.y
                    }
                });
            } else if (board.tool === 'rectangle') {
                board.drawer.rect(board.ctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x - board.mouse.pos.initial.x, board.mouse.pos.final.y - board.mouse.pos.initial.y);
                board.drawings.raw.push({
                    type: 'rectangle',
                    data: {
                        lineWidth: board.tools.shape.lineWidth,
                        strokeStyle: board.tools.shape.strokeStyle,
                        x: board.mouse.pos.initial.x,
                        y: board.mouse.pos.initial.y,
                        w: board.mouse.pos.final.x - board.mouse.pos.initial.x,
                        h: board.mouse.pos.final.y - board.mouse.pos.initial.y
                    }
                });

            } else if (board.tool === 'circle') {
                board.drawer.circle(board.ctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x, board.mouse.pos.final.y);
                board.drawings.raw.push({
                    type: 'circle',
                    data: {
                        strokeStyle: board.tools.shape.strokeStyle,
                        lineWidth: board.tools.shape.lineWidth,
                        x1: board.mouse.pos.initial.x,
                        y1: board.mouse.pos.initial.y,
                        x2: board.mouse.pos.final.x,
                        y2: board.mouse.pos.final.y
                    }
                });

            } else if (board.tool === 'ellipse') {
                board.drawer.ellipse(board.ctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x - board.mouse.pos.initial.x, board.mouse.pos.final.y - board.mouse.pos.initial.y);
                board.drawings.raw.push({
                    type: 'ellipse',
                    data: {
                        strokeStyle: board.tools.shape.strokeStyle,
                        lineWidth: board.tools.shape.lineWidth,
                        x: board.mouse.pos.initial.x,
                        y: board.mouse.pos.initial.y,
                        w: board.mouse.pos.final.x - board.mouse.pos.initial.x,
                        h: board.mouse.pos.final.y - board.mouse.pos.initial.y
                    }
                });

            } else if (board.tool === 'triangle') {
                board.drawer.triangle(board.ctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x - board.mouse.pos.initial.x, board.mouse.pos.final.y - board.mouse.pos.initial.y);
                board.drawings.raw.push({
                    type: 'triangle',
                    data: {
                        strokeStyle: board.tools.shape.strokeStyle,
                        lineWidth: board.tools.shape.lineWidth,
                        x: board.mouse.pos.initial.x,
                        y: board.mouse.pos.initial.y,
                        w: board.mouse.pos.final.x - board.mouse.pos.initial.x,
                        h: board.mouse.pos.final.y - board.mouse.pos.initial.y
                    }
                });

            } else if (board.tool === 'star') {
                board.drawer.star(board.ctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x - board.mouse.pos.initial.x, board.mouse.pos.final.y - board.mouse.pos.initial.y);
                board.drawings.raw.push({
                    type: 'star',
                    data: {
                        strokeStyle: board.tools.shape.strokeStyle,
                        lineWidth: board.tools.shape.lineWidth,
                        x: board.mouse.pos.initial.x,
                        y: board.mouse.pos.initial.y,
                        w: board.mouse.pos.final.x - board.mouse.pos.initial.x,
                        h: board.mouse.pos.final.y - board.mouse.pos.initial.y
                    }
                });

            } else if (board.tool === 'arrow') {
                board.drawer.arrow(board.ctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x, board.mouse.pos.final.y);
                board.drawings.raw.push({
                    type: 'arrow',
                    data: {
                        strokeStyle: board.tools.shape.strokeStyle,
                        lineWidth: board.tools.shape.lineWidth,
                        x1: board.mouse.pos.initial.x,
                        y1: board.mouse.pos.initial.y,
                        x2: board.mouse.pos.final.x,
                        y2: board.mouse.pos.final.y
                    }
                });

            } else if (board.tool === 'face') {
                board.drawer.face(board.ctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x, board.mouse.pos.final.y);
                board.drawings.raw.push({
                    type: 'face',
                    data: {
                        strokeStyle: board.tools.shape.strokeStyle,
                        lineWidth: board.tools.shape.lineWidth,
                        x1: board.mouse.pos.initial.x,
                        y1: board.mouse.pos.initial.y,
                        x2: board.mouse.pos.final.x,
                        y2: board.mouse.pos.final.y

                    }
                });

            } else if (board.tool === 'moon') {
                board.drawer.moon(board.ctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x - board.mouse.pos.initial.x, board.mouse.pos.final.y - board.mouse.pos.initial.y);
                board.drawings.raw.push({
                    type: 'moon',
                    data: {
                        strokeStyle: board.tools.shape.strokeStyle,
                        lineWidth: board.tools.shape.lineWidth,
                        x: board.mouse.pos.initial.x,
                        y: board.mouse.pos.initial.y,
                        w: board.mouse.pos.final.x - board.mouse.pos.initial.x,
                        h: board.mouse.pos.final.y - board.mouse.pos.initial.y
                    }
                });

            } else if (board.tool === 'love') {
                board.drawer.love(board.ctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x - board.mouse.pos.initial.x, board.mouse.pos.final.y - board.mouse.pos.initial.y);
                board.drawings.raw.push({
                    type: 'love',
                    data: {
                        strokeStyle: board.tools.shape.strokeStyle,
                        lineWidth: board.tools.shape.lineWidth,
                        x: board.mouse.pos.initial.x,
                        y: board.mouse.pos.initial.y,
                        w: board.mouse.pos.final.x - board.mouse.pos.initial.x,
                        h: board.mouse.pos.final.y - board.mouse.pos.initial.y
                    }
                });
            }

            board.drawer.clear(board.lctx);
            board.drawings.dataUrl.push(board.canvas[0].toDataURL());

            //here socket manager will notify other users about the last drawn drawing
            rtMan.socket.emit('drawing', {
                boardData: board.drawings.raw[board.drawings.raw.length - 1],
                room: rtMan.roomname,
                from: rtMan.username
            });

        });

        $(".cnv").on('mousemove touchmove', function (e) {

            board.mouse.pos.final.x = e.pageX;
            board.mouse.pos.final.y = e.pageY;

            if (board.mouse.mouseDown) {

                if (board.tool === 'pencil') {

                    board.drawer.pencil(board.ctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x, board.mouse.pos.final.y);

                    board.drawings.raw[board.drawings.raw.length - 1].data.points.push({
                        x: board.mouse.pos.final.x,
                        y: board.mouse.pos.final.y
                    });

                    board.mouse.pos.initial.x = board.mouse.pos.final.x;
                    board.mouse.pos.initial.y = board.mouse.pos.final.y;
                } else if (board.tool === 'chalk') {

                    board.drawer.chalk(board.ctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x, board.mouse.pos.final.y, board.tools.chalk.size);

                    board.drawings.raw[board.drawings.raw.length - 1].data.points.push({
                        x: board.mouse.pos.final.x,
                        y: board.mouse.pos.final.y
                    });

                    board.mouse.pos.initial.x = board.mouse.pos.final.x;
                    board.mouse.pos.initial.y = board.mouse.pos.final.y;

                } else if (board.tool === 'marker') {
                    board.drawer.marker(board.ctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x, board.mouse.pos.final.y, board.tools.marker.size, board.tools.shape.strokeStyle);

                    board.drawings.raw[board.drawings.raw.length - 1].data.points.push({
                        x: board.mouse.pos.final.x,
                        y: board.mouse.pos.final.y
                    });

                    board.mouse.pos.initial.x = board.mouse.pos.final.x;
                    board.mouse.pos.initial.y = board.mouse.pos.final.y;

                } else if (board.tool === 'circleBrush') {
                    board.drawer.circleBrush(board.ctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x, board.mouse.pos.final.y);

                    board.drawings.raw[board.drawings.raw.length - 1].data.points.push({
                        x: board.mouse.pos.final.x,
                        y: board.mouse.pos.final.y
                    });

                    board.mouse.pos.initial.x = board.mouse.pos.final.x;
                    board.mouse.pos.initial.y = board.mouse.pos.final.y;

                } else if (board.tool === 'doubleBrush') {
                    board.drawer.doubleBrush(board.ctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x, board.mouse.pos.final.y, board.tools.doubleBrush.offset);

                    board.drawings.raw[board.drawings.raw.length - 1].data.points.push({
                        x: board.mouse.pos.final.x,
                        y: board.mouse.pos.final.y
                    });

                    board.mouse.pos.initial.x = board.mouse.pos.final.x;
                    board.mouse.pos.initial.y = board.mouse.pos.final.y;

                } else if (board.tool === 'spray') {
                    board.drawer.spray(board.ctx, board.mouse.pos.final.x, board.mouse.pos.final.y, board.tools.spray.size);

                    board.drawings.raw[board.drawings.raw.length - 1].data.points.push({
                        x: board.mouse.pos.final.x,
                        y: board.mouse.pos.final.y
                    });

                } else if (board.tool === 'line') {
                    board.drawer.clear(board.lctx);
                    board.drawer.line(board.lctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x, board.mouse.pos.final.y);

                } else if (board.tool === 'rectangle') {
                    board.drawer.clear(board.lctx);
                    board.drawer.rect(board.lctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x - board.mouse.pos.initial.x, board.mouse.pos.final.y - board.mouse.pos.initial.y);

                } else if (board.tool === 'circle') {
                    board.drawer.clear(board.lctx);
                    board.drawer.circle(board.lctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x, board.mouse.pos.final.y);

                } else if (board.tool === 'ellipse') {
                    board.drawer.clear(board.lctx);
                    board.drawer.ellipse(board.lctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x - board.mouse.pos.initial.x, board.mouse.pos.final.y - board.mouse.pos.initial.y);

                } else if (board.tool === 'triangle') {
                    board.drawer.clear(board.lctx);
                    board.drawer.triangle(board.lctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x - board.mouse.pos.initial.x, board.mouse.pos.final.y - board.mouse.pos.initial.y);


                } else if (board.tool === 'star') {
                    board.drawer.clear(board.lctx);
                    board.drawer.star(board.lctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x - board.mouse.pos.initial.x, board.mouse.pos.final.y - board.mouse.pos.initial.y);

                } else if (board.tool === 'arrow') {
                    board.drawer.clear(board.lctx);
                    board.drawer.arrow(board.lctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x, board.mouse.pos.final.y);

                } else if (board.tool === 'face') {
                    board.drawer.clear(board.lctx);
                    board.drawer.face(board.lctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x, board.mouse.pos.final.y);

                } else if (board.tool === 'moon') {
                    board.drawer.clear(board.lctx);
                    board.drawer.moon(board.lctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x - board.mouse.pos.initial.x, board.mouse.pos.final.y - board.mouse.pos.initial.y);

                } else if (board.tool === 'love') {
                    board.drawer.clear(board.lctx);
                    board.drawer.love(board.lctx, board.mouse.pos.initial.x, board.mouse.pos.initial.y, board.mouse.pos.final.x - board.mouse.pos.initial.x, board.mouse.pos.final.y - board.mouse.pos.initial.y);

                } else if (board.tool === 'eraser') {
                    board.drawer.clear(board.lctx);

                    board.ctx.beginPath();
                    board.ctx.fillStyle = $("#canvas").css('background-color');
                    board.ctx.arc(board.mouse.pos.final.x, board.mouse.pos.final.y, board.tools.eraser.size, 0, 2 * Math.PI);
                    board.ctx.fill();

                    board.drawings.raw[board.drawings.raw.length - 1].data.points.push({
                        x: board.mouse.pos.final.x,
                        y: board.mouse.pos.final.y
                    });

                    board.tools.eraser.resetCanvasStyle();

                }

            }

            if (board.tool === 'eraser') {
                board.drawer.clear(board.lctx);

                board.ctx.lineWidth = board.tools.eraser.lineWidth;
                board.lctx.lineWidth = board.tools.eraser.lineWidth;

                board.lctx.fillStyle = "white";
                board.lctx.beginPath();
                board.lctx.arc(board.mouse.pos.final.x, board.mouse.pos.final.y, board.tools.eraser.size, 0, 2 * Math.PI);
                board.lctx.fill();

                board.lctx.strokeStyle = "black";
                board.lctx.beginPath();
                board.lctx.arc(board.mouse.pos.final.x, board.mouse.pos.final.y, board.tools.eraser.size, 0, 2 * Math.PI);
                board.lctx.stroke();

                board.tools.eraser.resetCanvasStyle();
            } else if (board.tools.text.flag === 1) {
                board.drawer.clear(board.lctx);
                board.drawer.text(board.lctx, board.tools.text.text, board.mouse.pos.final.x, board.mouse.pos.final.y);
            }

        });

        $("#txtClose").click(function () {
            $("#textControl").css("visibility", "hidden");
            $("#txtText").val("")
        })

        $("#txtInsert").click(function () {
            board.tools.text.flag = 1;
            board.tools.text.text = $("#txtText").val();
            board.ctx.font = board.tools.text.fontStyle + " " + board.tools.text.fontSize + "px " + board.tools.text.fontFamily;
            $("#textControl").css("visibility", "hidden");
            board.lctx.font = board.ctx.font;
            $("#txtText").val("");
        });

        $(".txtFontStyle").click(function () {
            board.tools.text.fontStyle = $(this).attr("data-value");
            $(".txtFontStyle").removeClass('boardBtnSelected');
            $(this).addClass('boardBtnSelected');
        });

        $("#txtFontFamily").change(function () {
            board.tools.text.fontFamily = $(this).val();
        });

        $("#txtFontSize").change(function () {
            board.tools.text.fontSize = $(this).val();
        });

        $(window).resize(function () {

            // save image data
            var imgData = board.canvas[0].toDataURL();
            var image = new Image();
            image.src = imgData.toString();

            //save linewidth and color
            var lW = board.ctx.lineWidth;
            var clr = board.ctx.strokeStyle;

            //reset canvas
            board.setCanvas();

            //reset linewidth and color
            board.ctx.lineWidth = lW;
            board.ctx.strokeStyle = clr;
            board.lctx.lineWidth = lW;
            board.lctx.strokeStyle = clr;

            //draw image data
            board.ctx.drawImage(image, 0, 0);

            if (chat.status) chat.maximize();
            else chat.minimize();

        });

        window.onbeforeunload = function () {
            return "";
        }

        //expose it to global scope so that other files can use it
        window.board = board;

        function loadJS(filename, callback) {

            var script = document.createElement('script');
            script.src = 'js/' + filename + ".js";

            script.onload = function () {

                callback();

            }

            document.head.appendChild(script);

        }

        loadJS('chat', function () {
            chat.maximize();
        });
        loadJS('realtime', function () {
            rtMan.createSocket();
            rtMan.socket.emit('coming', {
                roomname: rtMan.roomname,
                username: rtMan.username
            });
        });
        board.makeReady();
        board.setCanvas();

        document.getElementById('currentColor').jscolor.fromString('373737');
        board.changeColor('#373737');
        $("#textControl").css("visibility", "hidden");

        function generateRandom(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

    };

}(window, document));

//the onchange event for jscolor need to in global scope
function updateCurrentColor(jscolor) {
    board.changeColor("#" + jscolor);
}
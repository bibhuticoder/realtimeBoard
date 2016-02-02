var app = require('express')();
app.set('port', process.env.PORT || 3000);
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = app.get('port');
var path = require('path');


app.use( require( 'express' ).static( path.join( __dirname, 'public' ) ) );


// routing
app.get('/', function (req, res) {
    res.sendFile('index.html');
});

io.sockets.on('connection', function (socket) {
    
    socket.on('pencil',function(data){
        socket.broadcast.emit("pencil",data);
        
    });
    
    socket.on('line',function(data){
        socket.broadcast.emit('line',data);
       
    });
    
    socket.on('rectangle',function(data){
        socket.broadcast.emit('rectangle',data);
       
    });
    
    socket.on('ellipse',function(data){
        socket.broadcast.emit('ellipse',data);
       
    });

    socket.on('text',function(data){
        socket.broadcast.emit('text',data);
       
    });
    
    socket.on('eraser',function(data){
        socket.broadcast.emit('eraser',data);
       
    });
    
    socket.on('clear',function(){
        socket.broadcast.emit('clear');
        
    });
    
});

console.log("Listening to " + port);
server.listen(port, process.env.IP);

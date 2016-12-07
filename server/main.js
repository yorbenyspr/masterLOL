var express = require('../node_modules/express');  

var app = express();  

var server = require('http').Server(app);  

var io = require('../node_modules/socket.io')(server);
var clients =[];
var sequence =1;
server.listen(8082, function() {  

    console.log('Servidor corriendo en http://localhost:8081');

});

// Event fired every time a new client connects:
io.on('connection', function(socket) {

    console.log('New client connected (id=' + socket.id + ').');

    clients.push(socket);



    // When socket disconnects, remove it from the list:

    socket.on('disconnect', function() {

        var index = clients.indexOf(socket);

        if (index != -1) {

            clients.splice(index, 1);

            console.log('Client gone (id=' + socket.id + ').');

        }

    });

});


// Every 1 second, sends a message to a random client:

setInterval(function() {

    var randomClient;

    if (clients.length > 0) {

        randomClient = Math.floor(Math.random() * clients.length);

        clients[randomClient].emit('foo', sequence++);

        if(sequence%10==0)
		io.emit('foo','for all');

    }

}, 1000);
  

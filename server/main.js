var express = require('../node_modules/express');  
var repository = require('../node_modules/db_connection');
//var r=repository('mongodb://192.168.58.130:27017/test').setValue('persona/jean/hijos/amy',{test:'Test'});
var r=repository('mongodb://192.168.58.130:27017/test').removeValue('persona/jean/hijos/amy');
var app = express();  

var server = require('http').Server(app);  

var WebSocketServer = require('../node_modules/websocket').server;
var clients =[];
var sequence =1;
server.listen(8081, function() {  

    console.log('Servidor corriendo en http://localhost:8081');

});
//Creating websocket server
var wServer= new WebSocketServer({httpServer: server,autoAcceptConnections:false});
//Used for accept or reject connections
wServer.on('request', function(webSocketRequest){
	console.log('New Request');
	webSocketRequest.accept();

});
//Called when a client is connected
wServer.on('connect', function(webSocketConnection){
	console.log('New Connection');
	clients.push(webSocketConnection);
	
});

//Called when a client close the connection
wServer.on('close', function(webSocketConnection,closeReason,description){
	
	var index = clients.indexOf(webSocketConnection);
	if (index != -1) {

            clients.splice(index, 1);
	    console.log('Closed Connection ' + closeReason +" "+ description);

        }
	
});

	/**
    *
    * @author Yorbenys
    * Sending data to one client
    * Every 10 second send data to all client
    */
setInterval(function() {

    var randomClient;

    if (clients.length > 0) {

        randomClient = Math.floor(Math.random() * clients.length);

        clients[randomClient].send( sequence++);

        if(sequence%10==0)
	for(var connection in clients)
		clients[connection].send("For All");

    }

}, 1000);


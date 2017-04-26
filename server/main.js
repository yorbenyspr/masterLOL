var express = require('../node_modules/express');  
var repository = require('../app_modules/db_connection');
var eventLayer = require('../app_modules/event_layer');
var logger = require('../node_modules/simple-node-logger').createSimpleLogger('project.log');
//Event Layer
eventLayer.on('DataChange',DataChange);
eventLayer.on('ChildAdded',ChildAdded);
eventLayer.on('ChildChanged',ChildChanged);
eventLayer.on('ChildRemoved',ChildRemoved);
eventLayer.on('ChildMoved',ChildMoved);
//End event
repository('mongodb://192.168.58.130:27017/test',logger);
//var r=repository('mongodb://192.168.58.130:27017/test',logger).setValue('persona/jean/hijos/amy',{test:'TestAmy'});
//var r=repository('mongodb://192.168.58.130:27017/test',logger).removeValue('persona');
//var r=repository('mongodb://192.168.58.130:27017/test',logger).getValue('persona/jean',function(data,err){console.log(data);console.log(err);});
var app = express();  

var server = require('http').Server(app);  

var WebSocketServer = require('../node_modules/websocket').server;
var clients =[];
var sequence =1;
server.listen(8081, function() {  
	logger.info('Started server in http://localhost:8081');
});
//Creating websocket server
var wServer= new WebSocketServer({httpServer: server,autoAcceptConnections:false});
//Used for accept or reject connections
wServer.on('request', function(webSocketRequest){
	console.log('New Request');
	webSocketRequest.accept();
	logger.info('New request to MarterLol from client');

});
//Called when a client is connected
wServer.on('connect', function(webSocketConnection){
	console.log('New Connection');
	clients.push(webSocketConnection);
	logger.info('New connection in MarterLol');
});

//Called when a client close the connection
wServer.on('close', function(webSocketConnection,closeReason,description){
	
	var index = clients.indexOf(webSocketConnection);
	if (index != -1) {

            clients.splice(index, 1);
	    //console.log('Closed Connection ' + closeReason +" "+ description);
	    logger.info('Closed Connection from MasterLol ' + closeReason +" "+ description);

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
        logger.info('Sending message from MasterLol to client');
        if(sequence%10==0)
        {
        	for(var connection in clients)
				clients[connection].send("For All");

			logger.info('Sending message from MasterLol to all connected clients');
        }
    }

}, 1000);

///Events Functions

function DataChange(jsonObject, url){
    logger.info('DataChange');
};

function ChildAdded(jsonObject, url){
    logger.info('ChildAdded');
};

function ChildChanged(jsonObject, url){
    logger.info('ChildChanged');
};

function ChildRemoved(jsonObject, url){
    logger.info('ChildRemoved');
};

function ChildMoved(jsonObject, url){
    logger.info('ChildMoved');
};
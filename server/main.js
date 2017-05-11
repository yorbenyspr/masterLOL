var express = require('../node_modules/express');
var confManager = require('../app_modules/configuration');  
var urlController = require('../app_modules/url_controller');
var logger = require('../app_modules/logger');
var app = express();  

var server = require('http').Server(app);  
var WebSocketServer = require('../node_modules/websocket').server;
server.listen(8081, function() {  
    logger.info('Started server in http://localhost:8081');
});
//Creating websocket server
var clientConnectionId= 1;
var wServer= new WebSocketServer({httpServer: server,autoAcceptConnections:false});
//Used for accept or reject connections
wServer.on('request', function(webSocketRequest){
    webSocketRequest.accept();
    logger.info('New request to MarterLol from client');

});
//Called when a client is connected
wServer.on('connect', function(webSocketConnection){
    webSocketConnection['id']=clientConnectionId;
    clientConnectionId++;
    logger.info('New connection in MarterLol, client id: ', webSocketConnection['id']);
    webSocketConnection.on('message',function(message){
        console.log('Message from client id: ',webSocketConnection['id'], 'message: ', message.utf8Data);
        //Converting the string message to jsonrpc object
        var data = message.utf8Data;
        reciveMessageFromClient(webSocketConnection,data);
    });
});

//Called when a client close the connection. I a client were disconnected from server unsubscribe that client from all event
wServer.on('close', function(webSocketConnection,closeReason,description){
        clientConnectionId--;
        logger.info('Closed Connection from MasterLol ' + closeReason +" "+ description," client id: ", webSocketConnection['id']);
        urlController.unsubscribe(webSocketConnection,"all","all");
        urlController.ClientDisconnected(webSocketConnection); 
});

function reciveMessageFromClient(socket,data){
    urlController.handleJSONRPC(socket,data);
};
//When an exception is unhandled call the function 'unhandledException' in 'logger' module  
process.on('uncaughtException', logger.unhandledException);
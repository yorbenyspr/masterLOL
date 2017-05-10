var express = require('../node_modules/express');
var confManager = require('../app_modules/configuration');  
var repository = require('../app_modules/db_connection')(confManager.getMongoServerUrl());
var logger = require('../app_modules/logger');
var eventController = require('../app_modules/event_controller');
//repository.setValue('persona/jean/hijos/amy',{test:'TestAmy'});
//repository.setValue('persona/jean',{test:'TestJean'});
//repository.removeValue('persona');
//repository.getValue('persona/jean',function(data,err){console.log(data);console.log(err);});
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

//Called when a client close the connection
wServer.on('close', function(webSocketConnection,closeReason,description){
        clientConnectionId--;
        logger.info('Closed Connection from MasterLol ' + closeReason +" "+ description," client id: ", webSocketConnection['id']); 
});

function reciveMessageFromClient(socket,data){
    try
    {
        var jsonrpc = JSON.parse(data);
        if(jsonrpc['jsonrpc'] === "2.0")//Only accept jsonrpc v 2.0
        {
            jsonrpc.params.unshift(socket);
            var methodName= jsonrpc.method;
            global[methodName].apply(global,jsonrpc.params);
        }

    } 
    catch(e)
    {
        logger.error('Error reading jsonrpc. Exception: ',e,'. Module "main" on function "reciveMessageFromClient"');
    } 
};
global["subscribe"]=function (socket,eventName,url){
    repository.createIfNotExists(url,socket.id);
    eventController.subscribe(socket,eventName,url);
    logger.info('Client subscribe to event ',eventName,' for url ',url,' client id ',socket.id);
};

global["unsubscribe"]=function (socket,eventName,url){
    eventController.unsubscribe(socket,eventName,url);
    logger.info('Client unsubscribe from event ',eventName,' for url ',url,' client id ',socket.id);
};

//When an exception is unhandled call the function 'unhandledException' in 'logger' module  
process.on('uncaughtException', logger.unhandledException);
/*
// Event fired every time a new client connects:
io.on('connection', function(socket) {

    logger.info('New connection in MarterLol client id: ',socket.id);
// Event fired every time a client disconnect from server
    socket.on('disconnect', function() {
        eventController.unsubscribe(socket,'all','all');
        logger.info('Client disconnected from masterLol client id: ',socket.id);
    });

    socket.on('subscribe', function(eventName,url) {
        repository.createIfNotExists(url,socket.id);
        eventController.subscribe(socket,eventName,url);
        logger.info('Client subscribe to event ',eventName,' for url ',url,' client id ',socket.id);
    });

    socket.on('unsubscribe', function(eventName,url) {
        eventController.unsubscribe(socket,eventName,url);
        logger.info('Client unsubscribe from event ',eventName,' for url ',url,' client id ',socket.id);
    });

});
//When an exception is unhandled call the function 'unhandledException' in 'logger' module  
process.on('uncaughtException', logger.unhandledException);
*/
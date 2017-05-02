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
var io = require('../node_modules/socket.io')(server);
server.listen(8081, function() {  

    logger.info('Started server in http://localhost:8081');

});

// Event fired every time a new client connects:
io.on('connection', function(socket) {

    logger.info('New connection in MarterLol client id: ',socket.id);
// Event fired every time a client disconnect from server
    socket.on('disconnect', function() {
        eventController.unsubscribe(socket,'all','all');
        logger.info('Client disconnected from masterLol client id: ',socket.id);
    });

    socket.on('subscribe', function(eventName,url) {
        eventController.subscribe(socket,eventName,url);
        logger.info('Client subscribe to event ',eventName,' for url ',url,' client id ',socket.id);
    });

    socket.on('unsubscribe', function(eventName,url) {
        eventController.unsubscribe(socket,eventName,url);
        logger.info('Client unsubscribe from event ',eventName,' for url ',url,' client id ',socket.id);
    });

});

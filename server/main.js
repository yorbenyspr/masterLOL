var express = require('../node_modules/express');
var confManager = require('../app_modules/configuration');  
var urlController = require('../app_modules/url_controller');
var logger = require('../app_modules/logger');
var app = express();  

var server = require('http').Server(app);  
var WebSocketServer = require('../node_modules/ws');
server.listen(8081, function() {  
    logger.info('Started server in http://localhost:8081');
});
//Creating websocket server
var clientConnectionId= 1;
var wServer= new WebSocketServer.Server({ server });
//Called when a client is connected
wServer.on('connection', function(webSocketConnection,req){
    webSocketConnection['id']=clientConnectionId;
    clientConnectionId++;
    logger.info('New connection in MarterLol, client id: ', webSocketConnection['id']);

    //Ping and Pong Messages. Used for know if a client has open the connection channel
    webSocketConnection.isAlive = true;
    webSocketConnection.countPing = 0;
    webSocketConnection.on('pong', connectionAlive);
    
    //Set default send function to custom function
    var defaultSend = webSocketConnection.send;
    webSocketConnection.send = customSend;
    webSocketConnection.defaultSend = defaultSend;

    //Called when a client send messages to the server
    webSocketConnection.on('message',function(message){
        console.log('Message from client id: ',webSocketConnection['id'], 'message: ', message);
        //Converting the string message to jsonrpc object
        var data = message;
        reciveMessageFromClient(webSocketConnection,data);
    });

    //Called when a client close the connection. If a client were disconnected from server unsubscribe that client from all event
    webSocketConnection.on('close',function(){
        clientConnectionId--;
        logger.info('Closed Connection from MasterLol client id: ', webSocketConnection['id']);
        urlController.unsubscribe({"socket":webSocketConnection,"eventName":"all","url":"all","requestID":null,"responseToClient":false});
        urlController.ClientDisconnected(webSocketConnection);
    });
});

logger.info("Making ping to clients every: ",confManager.getPingInterval(),' "ms"');

//Function for send ping message to the client
const interval = setInterval(function ping() {
  wServer.clients.forEach(function each(webSocketConnection) {
    if(typeof(webSocketConnection.countPing) === 'undefined')
        webSocketConnection.countPing = 1;
    
    if (webSocketConnection.isAlive === false && webSocketConnection.countPing >= confManager.getMaxPing()) 
    {
        logger.info('Client does not response ping message from master lol. Client id: ',webSocketConnection.id,'. Terminate connection');
        urlController.unsubscribe({"socket":webSocketConnection,"eventName":"all","url":"all","requestID":null,"responseToClient":false});
        return webSocketConnection.terminate();
    }

    webSocketConnection.isAlive = false;
    webSocketConnection.countPing = webSocketConnection.countPing + 1;
    logger.info('Send ping message from master lol to client id: ',webSocketConnection.id);
    webSocketConnection.ping('', false, true);
  });
}, confManager.getPingInterval());

//Used for know if a client has open the connection channel
function connectionAlive() {
    logger.info('Client response with pong message. Client id: ',this.id);
    this.isAlive = true;
    this.countPing = 0;
}
//Custom function for send message to client
function customSend(message){
    ws = this;
    ws.defaultSend(message, function ack(error) {
        // If error is not defined, the send has been completed, otherwise the error
        // object will indicate what failed.
        if(typeof(error) !== 'undefined')
        {
            if(typeof(error.message) !== 'undefined')
                error = error.message;
            logger.error('Error sending message to client from MasterLol. Message: ',error,'. Module "main" function "customSend"');
        }
    });
};
function reciveMessageFromClient(socket,data){
    urlController.handleJSONRPC(socket,data);
};
//When an exception is unhandled call the function 'unhandledException' in 'logger' module  
process.on('uncaughtException', logger.unhandledException);
var WebSocketClient = require('../node_modules/websocket').client;

 

var client = new WebSocketClient();

client.on('connect',function(webSocketConnection){
	console.log('Client connected');
	webSocketConnection.on('message',function(message){
		console.log('Message from server '+message.utf8Data);	
	});
});

client.connect('ws://localhost:8081/', null);

 



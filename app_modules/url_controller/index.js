var confManager = require('../configuration');  
var repository = require('../fireloldb')(confManager.getMongoServerUrl());
var logger = require('../logger');
var eventController = require('../event_controller');
var URLController = function(){
	var that = this;
	that.handleJSONRPC = function(socket,data)
	{
		var requestID = null;
		try
    	{
        	var jsonrpc = JSON.parse(data);
        	if(Object.prototype.toString.call(jsonrpc.params) !=="[object Object]")
        	{
        		requestID = typeof(jsonrpc.id) !=='undefined' ? jsonrpc.id : null;
        		var jsonRPC = {"jsonrpc": "2.0", "error": {"code": -32000, "message": "Bag Request"}, "id": requestID};
  				var strindRep = JSON.stringify(jsonRPC);
  				socket.send(strindRep);
	    		logger.info('Bag Request from client. JSONRPC: ', data);
	    		return;
        	}
        	if(jsonrpc['jsonrpc'] === "2.0")//Only accept jsonrpc v 2.0
        	{
        		if(typeof(jsonrpc.id) !=='undefined')
        			jsonrpc.params.requestID=jsonrpc.id;
        		else
        			jsonrpc.params.requestID=null;
            	jsonrpc.params.socket=socket;
            	var methodName= jsonrpc.method;
            	that[methodName].apply(that,[jsonrpc.params]);
        	}

    	} 
    	catch(e)
    	{
			if(typeof(e.message) !== 'undefined')
				e = e.message;
        	logger.error('Error reading jsonrpc. Exception: ',e,'. Module "url_controller" on function "handleJSONRPC"');
        	var jsonRPC = {"jsonrpc": "2.0", "error": {"code": -32000, "message": "Bag Request"}, "id": requestID};
  			var strindRep = JSON.stringify(jsonRPC);
  			logger.error('Sending Bag Request to the client from module: "url_controller" method: "handleJSONRPC"');
  			socket.send(strindRep);
    	} 
	};

	that.ClientDisconnected = function(socket)
	{
		eventController.removeFromTemporals(socket);
	};
	//socket,eventName,url
	that["subscribe"]=function (paramsObj){
		if(that.validateSubscribeUnsubscribe(paramsObj,"subscribe"))
		{
			eventController.addToTemporals(paramsObj.socket);
    		eventController.subscribe(paramsObj.socket,paramsObj.eventName,paramsObj.url,paramsObj.requestID);
    		logger.info('Client subscribe to event ',paramsObj.eventName,' for url ',paramsObj.url,' client id ',paramsObj.socket.id);
    		return;
		}
	};
    //socket,eventName,url
	that["unsubscribe"]=function (paramsObj){
		if(that.validateSubscribeUnsubscribe(paramsObj,"unsubscribe"))
		{
			var responseToClient = true;
			if(typeof(paramsObj.responseToClient) !== 'undefined')
			{
				responseToClient = paramsObj.responseToClient;
			}
			eventController.addToTemporals(paramsObj.socket);
    		eventController.unsubscribe(paramsObj.socket,paramsObj.eventName,paramsObj.url,paramsObj.requestID,responseToClient);
    		logger.info('Client unsubscribe from event ',paramsObj.eventName,' for url ',paramsObj.url,' client id ',paramsObj.socket.id);
    	}
	};

	//Expose events to clients
	//socket,url
	that["onDataChange"]=function (paramsObj){
		paramsObj.eventName = "onDataChange";
    	that.subscribe(paramsObj);
	};
	//socket,url
	that["onChildAdded"]=function (paramsObj){
		paramsObj.eventName = "onChildAdded";
    	that.subscribe(paramsObj);
	};
	//socket,url
	that["onChildChanged"]=function (paramsObj){
		paramsObj.eventName = "onChildChanged";
    	that.subscribe(paramsObj);
	};
	//socket,url
	that["onChildRemoved"]=function (paramsObj){
		paramsObj.eventName = "onChildRemoved";
    	that.subscribe(paramsObj);
	};
	//socket,url
	that["onChildMoved"]=function (paramsObj){
		paramsObj.eventName = "onChildMoved";
    	that.subscribe(paramsObj);
	};
	//End events

	//Expose methods to clients
	//repository.setValue('persona/jean/hijos/amy',{test:'TestAmy'});
    //repository.setValue('persona/jean',{test:'TestJean'});
	//repository.removeValue('persona');
	//repository.getValue('persona/jean',function(data,err){console.log(data);console.log(err);});
	//socket,url,jsonObject
	that["setValue"]=function (paramsObj){
		if(typeof(paramsObj.socket) !== 'undefined' && typeof(paramsObj.url) !== 'undefined' && typeof(paramsObj.jsonObject) !== 'undefined')
		{
			eventController.addToTemporals(paramsObj.socket);
			repository.setValue(paramsObj.url,paramsObj.jsonObject,paramsObj.socket.id,paramsObj.requestID,false);	
		}
    	else
    	{
    		that.sendBagRequestMessage(paramsObj);
    	}
    	
	};
	//socket,url
	that["removeValue"]=function (paramsObj){
		if(typeof(paramsObj.socket) !== 'undefined' && typeof(paramsObj.url) !== 'undefined')
		{
			eventController.addToTemporals(paramsObj.socket);
    		repository.removeValue(paramsObj.url,paramsObj.socket.id,paramsObj.requestID);
    	}
    	else
    	{
    		that.sendBagRequestMessage(paramsObj);
    	}
	};
	//socket,url
	that["getValue"]=function (paramsObj){
		if(typeof(paramsObj.socket) !== 'undefined' && typeof(paramsObj.url) !== 'undefined')
		{
			eventController.addToTemporals(paramsObj.socket);
    		repository.getValue(paramsObj.url,paramsObj.socket.id,paramsObj.requestID);
    	}
    	else
    	{
    		that.sendBagRequestMessage(paramsObj);
    	}
	};
	//end methods

	//Utils
	that.validateSubscribeUnsubscribe = function(paramsObj,typeE){
		if(typeof(paramsObj.socket) !== 'undefined' && typeof(paramsObj.eventName) !== 'undefined' && typeof(paramsObj.url) !== 'undefined')
		{
    		return true;
		}
		else if(typeof(paramsObj.socket) !== 'undefined')
		{
			var jsonRPC = {"jsonrpc": "2.0", "error": {"code": -32000, "message": "Bag Request for "+ typeE}, "id": paramsObj.requestID};
  			var strindRep = JSON.stringify(jsonRPC);
  			paramsObj.socket.send(strindRep);
  			return false;
		}
	};

	that.sendBagRequestMessage = function(paramsObj){
		try
		{
			var jsonRPC = {"jsonrpc": "2.0", "error": {"code": -32000, "message": "Bag Request"}, "id": paramsObj.requestID};
  			var strindRep = JSON.stringify(jsonRPC);
  			paramsObj.socket.send(strindRep);
		}catch(e){
			if(typeof(e.message) !== 'undefined')
				e = e.message;
        	logger.error('Error reading jsonrpc. Exception: ',e,'. Module "url_controller" on function "handleJSONRPC"');
		}
	};
	//End
	//Get the structure for firelol when the application start
	//Check that structure is on db otherwise create it
	var firelolDbStructure = confManager.getFireLolDbStructure();
	repository.checkForStructure(firelolDbStructure);

};

var urlController = new URLController();
module.exports = urlController;
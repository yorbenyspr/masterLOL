var confManager = require('../configuration');  
var repository = require('../db_connection')(confManager.getMongoServerUrl());
var logger = require('../logger');
var eventController = require('../event_controller');
var URLController = function(){
	var that = this;
	that.handleJSONRPC = function(socket,data)
	{
		try
    	{
        	var jsonrpc = JSON.parse(data);
        	if(Object.prototype.toString.call(jsonrpc.params) !=="[object Object]")
        	{
        		var requestID = typeof(jsonrpc.id) !=='undefined' ? jsonrpc.id : null;
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
            	that[methodName].apply(that,jsonrpc.params);
        	}

    	} 
    	catch(e)
    	{
			if(typeof(e.message !== 'undefined'))
				e = e.message;
        	logger.error('Error reading jsonrpc. Exception: ',e,'. Module "url_controller" on function "handleJSONRPC"');
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
    		repository.createIfNotExists(paramsObj.url,paramsObj.socket.id,paramsObj.requestID);
    		eventController.subscribe(paramsObj.socket,paramsObj.eventName,paramsObj.url);
    		logger.info('Client subscribe to event ',paramsObj.eventName,' for url ',paramsObj.url,' client id ',paramsObj.socket.id);
    		return;
		}
	};
    //socket,eventName,url
	that["unsubscribe"]=function (paramsObj){
		if(that.validateSubscribeUnsubscribe(paramsObj,"unsubscribe"))
		{
    		eventController.unsubscribe(paramsObj.socket,paramsObj.eventName,paramsObj.url);
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
    	
	};
	//socket,url
	that["removeValue"]=function (paramsObj){
		if(typeof(paramsObj.socket) !== 'undefined' && typeof(paramsObj.url) !== 'undefined')
		{
			eventController.addToTemporals(paramsObj.socket);
    		repository.removeValue(paramsObj.url,paramsObj.socket.id,paramsObj.requestID);
    	}
	};
	//socket,url
	that["getValue"]=function (paramsObj){
		if(typeof(paramsObj.socket) !== 'undefined' && typeof(paramsObj.url) !== 'undefined')
		{
			eventController.addToTemporals(paramsObj.socket);
    		repository.getValue(paramsObj.url,paramsObj.socket.id,paramsObj.requestID);
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
	//End
};

var urlController = new URLController();
module.exports = urlController;
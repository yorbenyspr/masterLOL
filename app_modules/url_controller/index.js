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
        	if(jsonrpc['jsonrpc'] === "2.0")//Only accept jsonrpc v 2.0
        	{
        		if(typeof(jsonrpc.id) !=='undefined')
        			jsonrpc.params.push(jsonrpc.id);
            	jsonrpc.params.unshift(socket);
            	var methodName= jsonrpc.method;
            	that[methodName].apply(that,jsonrpc.params);
        	}

    	} 
    	catch(e)
    	{
        	logger.error('Error reading jsonrpc. Exception: ',e,'. Module "url_controller" on function "handleJSONRPC"');
    	} 
	};

	that.ClientDisconnected = function(socket)
	{
		eventController.removeFromTemporals(socket);
	};

	that["subscribe"]=function (socket,eventName,url){
    	repository.createIfNotExists(url,socket.id);
    	eventController.subscribe(socket,eventName,url);
    	logger.info('Client subscribe to event ',eventName,' for url ',url,' client id ',socket.id);
	};

	that["unsubscribe"]=function (socket,eventName,url){
    	eventController.unsubscribe(socket,eventName,url);
    	logger.info('Client unsubscribe from event ',eventName,' for url ',url,' client id ',socket.id);
	};

	//Expose events to clients
	that["onDataChange"]=function (socket,url){
    	that.subscribe(socket,"onDataChange",url);
	};
	that["onChildAdded"]=function (socket,url){
    	that.subscribe(socket,"onChildAdded",url);
	};
	that["onChildChanged"]=function (socket,url){
    	that.subscribe(socket,"onChildChanged",url);
	};
	that["onChildRemoved"]=function (socket,url){
    	that.subscribe(socket,"onChildRemoved",url);
	};
	that["onChildMoved"]=function (socket,url){
    	that.subscribe(socket,"onChildMoved",url);
	};
	//End events

	//Expose methods to clients
	//repository.setValue('persona/jean/hijos/amy',{test:'TestAmy'});
    //repository.setValue('persona/jean',{test:'TestJean'});
	//repository.removeValue('persona');
	//repository.getValue('persona/jean',function(data,err){console.log(data);console.log(err);});
	that["setValue"]=function (socket,url,jsonObject){
    	repository.setValue(url,jsonObject);
	};
	that["removeValue"]=function (socket,url){
    	repository.removeValue(url);
	};
	that["getValue"]=function (socket,url,requestID){
		if(typeof(requestID) === 'undefined')
			requestID = null;
		eventController.addToTemporals(socket);
    	repository.getValue(url,socket.id,requestID);
	};
	//end methods
};

var urlController = new URLController();
module.exports = urlController;
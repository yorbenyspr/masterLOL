var eventLayer = require('../event_layer')
var logger = require('../logger');
var firelolUtils = require('../firelolutils');
var events = ["onDataChange","onChildAdded","onChildChanged","onChildRemoved","onChildMoved"];

function validateEvent(eventName){
	if(events.indexOf(eventName) === -1)
		throw "Invalid event: " + eventName;
};

function validateUrlForEvent(url){
	firelolUtils.validateUrl(url);
	var arrE = url.split('/');
	if(arrE.indexOf("") !== -1 || arrE.indexOf(" ") !== -1 || arrE.length <= 0)
		throw "Invalid url: " + url;
};
var EventController = function(){
		var clients = new Map();
		var temporalClients = [];
		this.subscribe = function(clientObject,eventName,url,requestID)
		{
			var suscribed = true;
			var errorMessage = "Cant't subscribe to event: " + eventName + " url: " + url; 
			var url = {"url":url,"requestID":requestID};
			try
			{
				validateEvent(eventName);
				validateUrlForEvent(url.url);
				if(typeof(clients.get(clientObject)) === 'undefined')
				{
					var eventMap = new Map();
					eventMap.set(eventName,[url]);
					clients.set(clientObject,eventMap);
				}
				else
				{
					if(typeof(clients.get(clientObject).get(eventName))=== 'undefined')
					{
						clients.get(clientObject).set(eventName,[url]);
					}
					else
					{
						var urls = clients.get(clientObject).get(eventName);
						if(urls.indexOf(url) < 0)
						{
							urls.push(url);
							clients.get(clientObject).set(eventName,urls);
						}
						else
							throw "You are already subscribed to the event: " + eventName + " for url: " + url.url;
					}
				}

			}
			catch(e)
			{
				suscribed = false;
				if(typeof(e.message) !== 'undefined')
					e = e.message;
				errorMessage = e;
			}
			if(suscribed)
				this.OperationResult(clientObject.id,requestID,url,true,false,null,false);
			else
				this.OperationResult(clientObject.id,requestID,url,null,true,errorMessage,false);
		};
		this.unsubscribe = function(clientObject,eventName,url,requestID,responseToClient)
		{
			try
			{
				if(typeof(responseToClient)==='undefined')
				{
					responseToClient = true;
				}

				if(eventName === 'all')// Erase all event from that object
				{
					clients.delete(clientObject);
				}
				else if(url === 'all')// Erase all url from that client 
				{
					clients.get(clientObject).delete(eventName);
				}
				else //Erase that url from that event
				{
					var urls = clients.get(clientObject).get(eventName);
					var index = -1;
					for (var i = 0; i < urls.length; i++) 
  						{
  							var item = urls[i];
  							if(item.url === url)
  							{
  								index = i;
  								break;
  							}
  						}
					if(index > -1)
						urls.splice(index,1);
					clients.get(clientObject).set(eventName,urls);
				}

				if(responseToClient)
					this.OperationResult(clientObject.id,requestID,url,true,false,null,false);	
			}
			catch(e)
			{
				if(typeof(e.message) !== 'undefined')
					e = e.message;
				logger.error('Error unsubscribing client from MasterLol. Exception: ',e,'. Module "event_controller" function unsubscribe');
				
				if(responseToClient)
					this.OperationResult(clientObject.id,requestID,url,null,true,e,false);
			}
		};
		var sendEventToClients = function(eventName,jsonObject,url)
		{
			clients.forEach(function(value, key) {
				try
				{
					var urlsArray = value.get(eventName); 
  					if(typeof(urlsArray) !== 'undefined')
  					{
  						for (var i = 0; i < urlsArray.length; i++) 
  						{
  							var item = urlsArray[i];
  							if(item.url === url)
  							{
  								var requestID = null;
  								if(typeof(item.requestID) !== 'undefined')
  								{
  									requestID = item.requestID;
  								}
  								var jsonRPC = {"jsonrpc": "2.0", "method": eventName, "params": {"jsonObject":jsonObject, "url":url},"id":requestID};
  								var strindRep = JSON.stringify(jsonRPC);
  								key.send(strindRep);
  								logger.info('Sending message from MasterLol to client');
  								break;
  							}
  						}
  					}
  				}
  				catch(e)
  				{
  					if(typeof(e.message) !== 'undefined')
						e = e.message;
  					logger.error('Error sending message from MasterLol to client. Exception: ',e,'. Module "event_controller" function sendEventToClients');
  				}
				});
		};
		//When and url is removed unsubscribe all events listening for that url and its childs
		var unsubscribeEventsForUrlAndItsChild = function(url){
			var regularExpresion = new RegExp("^("+url+")"); //Check for childs of url
			clients.forEach(function(value, key) {
				value.forEach(function(urls,eventName) {
					try
					{
						for (var i = 0; i < urls.length; i++) {
							var urlObject=urls[i];
							if(urlObject.url === url || regularExpresion.test(urlObject.url))
							{
								urls.splice(i,1);
								i--;
							}
						}
					}
					catch(e)
					{
						if(typeof(e.message) !== 'undefined')
							e = e.message;
						logger.error('Error unsubscribing client from MasterLol. Exception: ',e,'. Module "event_controller" function "unsubscribeEventsForUrlAndItsChild"');
					}
					
				});
			});
		};

	    this.DataChange = function(jsonObject, url)
	    {
	    	logger.info('Triggered DataChange Event');
	    	sendEventToClients('onDataChange',jsonObject,url);
	    };

	    this.ChildAdded = function(jsonObject, url)
	    {
	    	logger.info('Triggered ChildAdded Event');
	    	sendEventToClients('onChildAdded',jsonObject,url);
	    };

	    this.ChildChanged = function(jsonObject, url)
	    {
	    	logger.info('Triggered ChildChanged Event');
	    	sendEventToClients('onChildChanged',jsonObject,url);
	    };

	    this.ChildRemoved = function(jsonObject, url,unsubscribe)
	    {
	    	logger.info('Triggered ChildRemoved Event');
	    	sendEventToClients('onChildRemoved',jsonObject,url);
	    	//Unsubcribe events for that url and its childs
	    	if(typeof(unsubscribe) !== 'undefined' && unsubscribe === true )
	    	{
	    		unsubscribeEventsForUrlAndItsChild(url);
	    	}
	    };

	    this.ChildMoved = function(jsonObject, url)
	    {
	    	logger.info('Triggered ChildMoved Event');
	    	sendEventToClients('onChildMoved',jsonObject,url);
	    };

	    this.OperationResult = function(socketID,requestID,url,result,error,errorMessage,toSubscribe)
	    {
	    	logger.info('Triggered OperationResult Event');
	    	for(var i = 0; i < temporalClients.length; i++) {
	    		var remove = false;
	    		try
	    		{
	    			if(temporalClients[i].id === socketID)
	    			{
	    				remove = true;
	    				var jsonRPC = {"jsonrpc": "2.0", "result": result, "id": requestID};
	    				if(error)
	    					jsonRPC = {"jsonrpc": "2.0", "error": {"code": -32000, "message": errorMessage}, "id": requestID};
  						var strindRep = JSON.stringify(jsonRPC);
  						temporalClients[i].send(strindRep);
	    				logger.info('Sending result from MasterLol to client');
	    				return;
	    			}
	    		}
	    		catch(e)
	    		{
	    			remove = true;
	    			if(typeof(e.message) !== 'undefined')
						e = e.message;
	    			logger.error('Error sending message from MasterLol to client. Exception: ',e,'. Module "event_controller" function GetValueResult');
	    		}
	    		finally
	    		{
	    			if(remove)
	    			{
	    				temporalClients.splice(i,1);//Remove from temporal clients
	    				logger.info('Removing client from temporal');
	    			}
	    		}
	        }
	    };

	    this.ErrorCreatingURL = function(url,socket)
	    {
	    	logger.info('Triggered ErrorCreatingURL Event');
	    	clients.forEach(function(value, key) {
	    		try
	    		{
	    			if(key.id === socket)
	    			{
	    				var jsonRPC = {"jsonrpc": "2.0", "error": {"code": -32000, "message": 'Error creating URL: ' + url}, "id": null};
  						var strindRep = JSON.stringify(jsonRPC);
  						key.send(strindRep);
	    				logger.info('Sending error from MasterLol to client');
	    			}
	    		}
	    		catch(e)
	    		{
	    			if(typeof(e.message) !== 'undefined')
						e = e.message;
	    			logger.error('Error sending message from MasterLol to client. Exception: ',e,'. Module "event_controller" function ErrorCreatingURL');
	    		}
	        });
	    };

	    this.addToTemporals = function(socket)
	    {
	    	temporalClients.push(socket);
	    };

	    this.removeFromTemporals = function(socket)
	    {
	    	var index = temporalClients.indexOf(socket);
	    	while(index > -1)
	    	{	try
	    		{
	    		    temporalClients.splice(index,1);
	    		    index = temporalClients.indexOf(socket);
	    		    logger.info('Removing client from temporals');	
	    		}
	    		catch(e)
	    		{
	    		    var message = "";
	    		    if(typeof(e.message) !== 'undefined')
	    		    message = e.message;
	    		    logger.error('Error removing from temporal clients. Message: '+ message);
	    		}
	    	}
	    };

	    //Event Layer
	eventLayer.on('DataChange',this.DataChange);
	eventLayer.on('ChildAdded',this.ChildAdded);
	eventLayer.on('ChildChanged',this.ChildChanged);
	eventLayer.on('ChildRemoved',this.ChildRemoved);
	eventLayer.on('ChildMoved',this.ChildMoved);
	eventLayer.on('ErrorCreatingURL',this.ErrorCreatingURL);
	eventLayer.on('OperationResult',this.OperationResult);
	//End event
};

var eventC = new EventController();
module.exports = eventC;

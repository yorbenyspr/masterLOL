var eventLayer = require('../event_layer')
var logger = require('../../node_modules/simple-node-logger').createSimpleLogger('project.log');
var EventController = function(){
		var clients = new Map();
		this.subscrite = function(clientObject,eventName,url)
		{
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
					urls.push(url);
					clients.get(clientObject).set(eventName,urls);
				}
			}
		};
		this.unsubscrite = function(clientObject,eventName,url)
		{
			if(eventName === 'all')// Erase all event from that object
			{
				clients.remove(clientObject);
			}
			else if(url === 'all')// Erase all url from that client 
			{
				clients.get(clientObject).remove(eventName);
			}
			else //Erase that url from that event
			{
				var urls = clients.get(clientObject).get(eventName);
				urls.splice(arrE.indexOf(url),1);
				clients.get(clientObject).set(eventName,urls);

			}
		};
		var sendEventToClients = function(eventName,jsonObject,url)
		{
			clients.forEach(function(value, key) {
				try
				{
  					if(typeof(value.get(eventName)) !== 'undefined')
  					{
  						if(value.get(eventName).indexOf(url) > -1)
  						{

  							key.emit(eventName,jsonObject,url);
  							logger.info('Sending message from MasterLol to client');
  						}
  					}
  				}
  				catch(e)
  				{
  					logger.error('Error sending message from MasterLol to client. Exception: ',e);
  				}
				});
		};
	    this.DataChange = function(jsonObject, url)
	    {
	    	sendEventToClients('DataChange',jsonObject,url);
	    };

	    this.ChildAdded = function(jsonObject, url)
	    {
	    	sendEventToClients('ChildAdded',jsonObject,url);
	    };

	    this.ChildChanged = function(jsonObject, url)
	    {
	    	sendEventToClients('ChildChanged',jsonObject,url);
	    };

	    this.ChildRemoved = function(jsonObject, url)
	    {
	    	sendEventToClients('ChildRemoved',jsonObject,url);
	    };

	    this.ChildMoved = function(jsonObject, url)
	    {
	    	sendEventToClients('ChildMoved',jsonObject,url);
	    };

	    //Event Layer
	eventLayer.on('DataChange',this.DataChange);
	eventLayer.on('ChildAdded',this.ChildAdded);
	eventLayer.on('ChildChanged',this.ChildChanged);
	eventLayer.on('ChildRemoved',this.ChildRemoved);
	eventLayer.on('ChildMoved',this.ChildMoved);
	//End event
};

var eventC = new EventController();
module.exports = eventC;

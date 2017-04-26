var util = require('util');
var emitter = require('events').EventEmitter;
var EventManager = function(){

	    this.DataChange = function(jsonObject, url)
	    {
	    	
	    };

	    this.ChildAdded = function(jsonObject, url)
	    {

	    };

	    this.ChildChanged = function(jsonObject, url)
	    {

	    };

	    this.ChildRemoved = function(jsonObject, url)
	    {

	    };

	    this.ChildMoved = function(jsonObject, url)
	    {

	    };
};
util.inherits(EventManager, emitter);
var eventM = new EventManager();
eventM.on('DataChange',eventM.DataChange);
eventM.on('ChildAdded',eventM.ChildAdded);
eventM.on('ChildChanged',eventM.ChildChanged);
eventM.on('ChildRemoved',eventM.ChildRemoved);
eventM.on('ChildMoved',eventM.ChildMoved);
module.exports = eventM;

/**
*Helpers Functions
*/
/**
* Check if an string is empty or white spaces
*/
function isEmptyOrSpaces(str) {
    return str === null || str.match(/^ *$/) !== null;
};

function urlFromDotNotation(str){
	return str.replace(new RegExp("[.]", 'g'), '/');
};

function parentUrlForUrl(url){
	var arrE = url.split('/');
	var parent = '';
	for (var i = 0; i < arrE.length-1; i++) {
		var str = arrE[i];
		if(!isEmptyOrSpaces(str))
			parent+=str;

		if(i < arrE.length - 2)
			parent+= '/';
	};

	return parent;
};

function lastChildForUrl(url){
	var arrE = url.split('/');
	for (var i = arrE.length - 1; i >= 0; i--) {
		var str = arrE[i];
		if(!isEmptyOrSpaces(str))
			return str;
	};
	throw "Cant'get the last child for url: " + url;
};
/**
* @author Yorbenys
* Validate an URL and return its array representation
*/
function validateUrl(url){
	var regEx = new RegExp("[a-zA-Z0-9]{1,768}(/[a-zA-Z0-9]{1,768})?$")
	if(!regEx.test(url))
		throw 'Bag url: '+ url;
	var arrE = url.split('/');
	while(arrE.indexOf("")!=-1 || arrE.indexOf(" ") != -1 )
			{
				if(arrE.indexOf("")!=-1)
					arrE.splice(arrE.indexOf(""),1);//Quitando string vacios
				else if(arrE.indexOf(" ") != -1)
					arrE.splice(arrE.indexOf(" "),1);//Quitando string que solo es un espacio en blanco
			}
	if(arrE.length > 32)
		throw "The node key can't be greater than 32 levels";
	for(var i = 0; i < arrE.length; i++)
	{
		if(arrE[i].length > 768)
			throw "The node key can't be greater than 768 bytes"; 
	}
	if(arrE.indexOf("_idfireloldb") != -1)
		throw "Bag Url";
	return arrE;

}
function getDotNotationFromUrl(url){
	var arrE = validateUrl(url);
	var dotNotation = '';
	for (var i = 0; i < arrE.length; i++) {
		var str = arrE[i];
		if(isEmptyOrSpaces(str))
		{
			throw "Invalid url";
		}
		dotNotation += str;
		if(i < arrE.length - 1)
			dotNotation += '.';
	};

	if(isEmptyOrSpaces(dotNotation))
		throw "Invalid url";
	return dotNotation;
};
/*End Helper Functions*/
var mongoClient = require('../../node_modules/mongodb');
var eventLayer = require('../event_layer');
var logger = require('../logger');
module.exports = function(dbUrl){

	/*
	* @author Yorbenys
	* Update a child property
	*/
	this.setValue = function(url,jsonObject,socketID,requestID){
		var errMessage = 'Error updating property';
		try
		{
			var dotNotation = getDotNotationFromUrl(url);
			url = urlFromDotNotation(dotNotation);
			mongoClient.connect(dbUrl,function(err,db){
					if(err != null)
					{
						errMessage = err.message;
						logger.error("Can't connect to ", dbUrl, ' to set value');
						eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
						return;
					}
					//Search on firelol collection the property indicated by the url if exist update it
					//Otherwise send an error
					var queryObject = {_idfireloldb: "fireloldb"};
					queryObject[dotNotation] =  {$exists:true};
					var setObject = {};
					setObject[dotNotation] = jsonObject;
					db.collection('firelol').update(queryObject,{$set:setObject},function(err,result){
						if(err != null)
						{
							errMessage = err.message;
                            logger.error("Can't Update the element at position: ", url);
                            eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
						}
						else
						{
							try
							{
								if(result != null && result.result.nModified > 0)
								{
									var parentUrl = parentUrlForUrl(url);
									var lastChild = lastChildForUrl(url);
									logger.info("Updated element on url: ",url);
                            		eventLayer.emit('DataChange',jsonObject,url);
                            		var jsonObjectForParent = {};
                            		jsonObjectForParent[lastChild] = jsonObject;
                            		eventLayer.emit('ChildChanged',jsonObjectForParent,parentUrl);
                            		eventLayer.emit('OperationResult',socketID,requestID,url,true,false,null,false);
								}
								else
								{
									errMessage = "Can't update url : "+ url + ". Url does not exists";
									//Found the url but in that position the object is equals to jsonObject
									if(result != null && result.result.n > 0)
									{
										errMessage = "Element not updated. The jsonObject is equals to the jsonObject in url: " + url;
									}
									logger.info(errMessage);
									eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
								}
							}
							catch(e)
							{
								if(typeof e.message !== 'undefined')
									e = e.message;
								errMessage = e;
								logger.error('Error en module : "firelol" function: "setValue", error: ',errMessage);
								eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
								return;
							}
						}
					});
				});

		}
		catch(e)
		{
			if(typeof e.message !== 'undefined')
				e = e.message;
			errMessage = e;
			logger.error('Error en module : "firelol" function: "setValue", error: ',errMessage);
			eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
			return;
		}
	};

	/*
	* @author Yorbenys
	* Add a child property
	* If the structure does no exist it is created
	* If the structure exist then the las property is updated
	*/
	this.addChild = function(url,jsonObject,socketID,requestID){
		var errMessage = 'Error adding child';
		try
		{
			var dotNotation = getDotNotationFromUrl(url);
			url = urlFromDotNotation(dotNotation);
			mongoClient.connect(dbUrl,function(err,db){
					if(err != null)
					{
						errMessage = err.message;
						logger.error("Can't connect to ", dbUrl, ' to add child');
						eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
						return;
					}
					//Create the structure for the url in db if it does not exists
					//If the structure exists then send an error.
					var queryObject = {_idfireloldb: "fireloldb"};
					queryObject[dotNotation] =  {$exists:false};
					var setObject = {};
					setObject[dotNotation] = jsonObject;
					db.collection('firelol').update(queryObject,{$set:setObject},function(err,result){
						if(err != null)
						{
							errMessage = err.message;
                            logger.error("Can't create url: ", url);
                            eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
						}
						else
						{
							try
							{
								if(result !== null && result.result.nModified > 0 && result.result.n > 0)
								{
									logger.info("Created url: ",url);
                            		var parentUrl = parentUrlForUrl(url);
                            		var lastChild = lastChildForUrl(url);
                            		var jsonObjectForParent = {};
                            		jsonObjectForParent[lastChild] = jsonObject;
                            		eventLayer.emit('ChildAdded',jsonObjectForParent,parentUrl);
                            		eventLayer.emit('OperationResult',socketID,requestID,url,true,false,null,false);
								}
								else
								{
									errMessage = "Can't add child for url : "+ url + ". Url already exists";
									logger.info(errMessage);
									eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
								}
							}
							catch(e)
							{
								if(typeof e.message !== 'undefined')
									e = e.message;
								errMessage = e;
								logger.error('Error en module : "firelol" function: "setValue", error: ',errMessage);
								eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
								return;
							}
						}
					});
				});

		}
		catch(e)
		{
			if(typeof e.message !== 'undefined')
				e = e.message;
			errMessage = e;
			logger.error('Error en module : "firelol" function: "setValue", error: ',errMessage);
			eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
			return;
		}
	};
	//If the url exists get the value in the url
	//Otherwise return null
	this.getValue = function(url,socketID,requestID){
		try
		{
			var errMessage = "Can't get jsonObject for url: " + url;
			var dotNotation = getDotNotationFromUrl(url);
			url = urlFromDotNotation(dotNotation);
			mongoClient.connect(dbUrl,function(err,db){
					if(err != null)
					{
						errMessage = err.message;
						logger.error("Can't connect to ", dbUrl, ' to add child');
						eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
						return;
					}

					//Get The value for that url
					var queryObject = {_idfireloldb: "fireloldb"};
					queryObject[dotNotation] =  {$exists:true};
					var selectObject = {_id:false};
					selectObject[dotNotation] = true;

					db.collection('firelol').findOne(queryObject,selectObject,function(err,result){
						if(err != null)
						{
							errMessage = err.message;
							logger.error("Can't connect to ", dbUrl, ' to add child');
							eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
							return;
						}
						try
						{
							if(result != null)
							{
								var properties = dotNotation.split('.');
								for (var i = 0; i < properties.length; i++) {
									result= result[properties[i]];
								};
							}
							eventLayer.emit('OperationResult',socketID,requestID,url,result,false,null,false);
						}
						catch(e)
						{
							if(typeof e.message !== 'undefined')
								e = e.message;
							errMessage = e;
							logger.error('Error en module : "firelol" function: "setValue", error: ',errMessage);
							eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
							return;
						}
					});
				});
		}
		catch(e)
		{
			if(typeof e.message !== 'undefined')
				e = e.message;
			errMessage = e;
			logger.error('Error en module : "firelol" function: "setValue", error: ',errMessage);
			eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
			return;
		}
	};
	/**
	*Check if the structure is in db otherwise create it
	*The firelol structure must have a property named/value "_idfireloldb": "fireloldb"
	*/
	this.checkForStructure = function(structure){
		var errMessage = "Can't check json structure for fireloldb please try restart the server";
		structure._idfireloldb = 'fireloldb';
		mongoClient.connect(dbUrl,function(err,db){
			if(err != null)
			{
				errMessage = err.message;
				logger.error(errMessage);
				return;
			}

			db.collection('firelol').findOne({'_idfireloldb':structure._idfireloldb},function(error,result){
				if(err != null)
				{
					errMessage = err.message;
					logger.error(errMessage);
					return;
				}

				if(result === null)
				{
					db.collection('firelol').insert(structure,function(error){
						if(err != null)
						{
							errMessage = err.message;
							logger.error(errMessage);
							return;
						}
						logger.info("Firelol Db structure checked");
					});
				}
				else
				{
					logger.info("Firelol Db structure checked");
				}
			});


	});
		};
	return this;
}
/**
*
* @author Yorbenys
* From an url get the array representation
*/
var getArrayFromUrl = function(url)
{
	var arrE = url.split('/');
			while(arrE.indexOf("")!=-1 || arrE.indexOf(" ") != -1 )
			{
				if(arrE.indexOf("")!=-1)
					arrE.splice(arrE.indexOf(""),1);//Quitando string vacios
				else if(arrE.indexOf(" ") != -1)
					arrE.splice(arrE.indexOf(" "),1);//Quitando string que solo es un espacio en blanco
			}
	return arrE;
};
/**
*
* @author Yorbenys
* Finds an element into an array by its id
*/
var findElement = function(arr,id)
{
	for(var pos=0;pos < arr.length;pos++)
	{
        if(arr[pos]._id===id)
			return {obj:arr[pos],index:pos,ar:arr};
    }
	return null;
}
/**
*
* @author Yorbenys
* Create the needed object structure
*/
var createObject = function(arrE,jsonData,insertIn)//Crea la estructura de objeto necesaria
{
	var parent=insertIn;
	var objAux=insertIn;
	while(arrE.length>0)
	{
		var id= arrE.splice(0,1)[0];
		var obj={_id:id,'jsonData':null,childrens:[]};
		if(arrE.length==0)
		{
			obj['jsonData']=jsonData;
		}
		if(parent==null)
			parent = obj;
		if(objAux != null)
			objAux.childrens.push(obj);
        objAux = obj;
    }
	return parent;
};
var mongoClient = require('../../node_modules/mongodb');
var eventLayer = require('../event_layer');
var logger = require('../logger');
module.exports = function(dbUrl){
	/**
	*
	* @author Yorbenys
	* Create a tree with url representation
	* A 3th parameter can be passed as 3 that indicate that an event is send if occours an error creating the three
	*/
	this.setValue=function(url,jsonObject,socketID,requestID,toSubscribe){
			var errMessage = "Error subscribing client";
			if(!toSubscribe)
				errMessage = "Error setting value";
			mongoClient.connect(dbUrl,function(err,db){
			if(err != null)
			{
				errMessage = err.message;
				logger.error("Can't connect to ", dbUrl, ' to set value');
				eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,toSubscribe);
				return;
			}
			logger.info("Success connection to ", dbUrl);
			var arrE = getArrayFromUrl(url);
			if(arrE.length >0)
			{
				var root= arrE.splice(0,1)[0];
				db.collection('url').findOne({_id:root},function(err,document){
					if(err != null)
					{
						errMessage = err.message;
						logger.error("Can't find the element ", root);
						eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,toSubscribe);
						return;
					}
					if(document != null)
					{

						var parent = document;
						if(arrE.length==0)//El elemento root es quien se desea modificar
						{
							parent.jsonData=jsonObject;
							db.collection('url').update({_id:parent._id},{$set:parent},function(err, result){
                            		if(err != null)
                            		{  			
										errMessage = err.message;
                            			logger.error("Can't Update the element ", parent._id);
                            			eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,toSubscribe);
                            		}
                            		else
                            		{
                            			logger.info("Updated element ");
                            			eventLayer.emit('DataChanged',jsonObject,url);
                            			eventLayer.emit('OperationResult',socketID,requestID,url,true,false,null,toSubscribe);
                            		}

                            });
						}
						else
						{
							var obj={'obj':parent,index:0,ar:parent.childrens};
							var objAux=obj.obj;//First insert into parent
							while(obj != null)
							{
								if(obj.obj._id === arrE[arrE.length-1])
								{
									arrE.splice(0,1);
									break;
								}
								obj=findElement(obj.obj.childrens,arrE[0]);
								if(obj != null)
								{
									objAux = obj.obj;
									if(arrE.length>1)
		 							 	arrE.splice(0,1);
		 						}
								
							}
							var childAdded = false;
							if(arrE.length==0)//Hoja encontrada
                            	objAux.jsonData=jsonObject;
                            else
                            {
                            	createObject(arrE,jsonObject,objAux); //Hay que crear los elementos
                            	childAdded = true;
                            }
                            db.collection('url').update({_id:parent._id},{$set:parent},function(err, result){
                            		if(err != null)
                            		{
                            			errMessage = err.message;
                            			logger.error("Can't Update the element ", parent._id);
                            			eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,toSubscribe);
                            		}
                            		else
                            		{
                            			logger.info("Updated element ");
                            			if(childAdded)
                            			{
                            				eventLayer.emit('ChildAdded',jsonObject,url);
                            			}
                            			else
                            			{
                            				eventLayer.emit('DataChanged',jsonObject,url);
                            			}
                            		}
                            		eventLayer.emit('OperationResult',socketID,requestID,url,true,false,null,toSubscribe);
                            });
							
							
						}


					}
					else
					{
						arrE.unshift(root);
						var obj = createObject(arrE,jsonObject,null);
						if(obj != null)
						{
							db.collection('url').insert(obj,function(err,document){
								if(err != null)
								{
									errMessage = err.message;
									logger.error("Can't insert the element ");
									eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,toSubscribe);
									return;
								}
								else
								{
									logger.info("Inserted element ");
									eventLayer.emit('ChildAdded',jsonObject,url,socket);
									eventLayer.emit('OperationResult',socketID,requestID,url,true,false,null,toSubscribe);
								}
							});
						}
					}
				});
			}
				
		    				
			
			
			
			
		});				
			};
	/**
	*
	* @author Yorbenys
	* Romove the last child in the url
	*/
	this.removeValue= function(url,socketID,requestID){
		var errMessage = "Error deleting object";
		mongoClient.connect(dbUrl,function(err,db){
					if(err != null)
					{
						errMessage = err.message;
						logger.error("Can't connect to ", dbUrl, ' to remove value');
						eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
						return;
					}
					logger.info("Success connection to ", dbUrl);
                    var arrE =getArrayFromUrl(url);
                    if(arrE.length==1)//Eliminar el elemento root
                    {
                    	db.collection('url').remove({_id:arrE[0]},function(err,result){
                    		if(err != null)
                    		{
                    			errMessage = err.message;
                    			logger.error("Can't delete");
                    			eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
                    			return;
                    		}
                    		else
                    		{
                    			logger.info("Element deleted");
                    			eventLayer.emit('ChildRemoved',result,url);
                    			eventLayer.emit('OperationResult',socketID,requestID,url,true,false,null,false);
                    			return;
                    		}
                    	});
                    }
                    else if(arrE.length>0)
                    {
                    	db.collection('url').findOne({_id:arrE[0]},function(err,result){
                    		if(err !=null)
                    		{
                    			errMessage = err.message;
                            	logger.error("Can't find ",arrE[0]);
                            	eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
                            	return;
                    		}
                            var obj=result;
                            arrE.splice(0,1);
							if(obj != null && arrE.length>0)
							{
								obj={'obj':obj,index:0,ar:obj.childrens};
								while(obj != null)
								{
									if(obj.obj._id === arrE[arrE.length-1])
										break;
									obj=findElement(obj.obj.childrens,arrE[0]);
									if(arrE.length>1)
		  							arrE.splice(0,1);
								}
								if(obj!=null)
								{
									obj.ar.splice(obj.index,1);
									db.collection('url').update({_id:result._id},{$set:result},function(err, result){
                            		if(err != null)
                            		{
                            			errMessage = err.message;
                            			logger.error("Can't update element");
                            			eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
                            		}
                            		else
                            		{
 										logger.info("Updated element");
 										eventLayer.emit('ChildRemoved',result,url);
 										eventLayer.emit('OperationResult',socketID,requestID,url,true,false,null,false);	                           			
                            		}

                            		});
								}

							}
                    	});
                    }
		});
	};
	
	/**
	*
	* @author Yorbenys
	* Get Value for an element
	* The callbackFunc is called with two params "data,error"
	*/
	this.getValue= function(url,socketID,requestID){
		var errMessage = "Can't get value";
		mongoClient.connect(dbUrl,function(err,db){
					if(err != null)
					{
						errMessage = err.message;
						logger.error("Can't connect to ", dbUrl, ' to get value');
						try
						{
							eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
							//eventLayer.emit('GetValueResult',socketID,requestID,url,null,err);
						}catch(e){
							if(typeof(e.message) !== 'undefined')
								e = e.message;
							logger.error("Exception: ", e, ". Module: db_connection, function 'getValue'");
						}
						return;
						eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
					}
					logger.info("Success connection to ", dbUrl);
                    var arrE =getArrayFromUrl(url);
                    if(arrE.length>0)
                    {
                    	db.collection('url').findOne({_id:arrE[0]},function(err,result){
                    		if(err !=null)
                    		{
                    			errMessage = err.message;
                            	logger.error("Can't find ",arrE[0]);
                            	try
								{
									eventLayer.emit('OperationResult',socketID,requestID,url,null,true,errMessage,false);
								}catch(e){
									if(typeof(e.message) !== 'undefined')
										e = e.message;
									logger.error("Exception: ", e, ". Module: db_connection, function 'getValue'");
								}
								return;
                    		}
                            var obj=result;
                            arrE.splice(0,1);
							if(obj != null && arrE.length>0)
							{
								obj={'obj':obj,index:0,ar:obj.childrens};
								while(obj != null)
								{
									if(obj.obj._id === arrE[arrE.length-1])
										break;
									obj=findElement(obj.obj.childrens,arrE[0]);
									if(arrE.length>1)
		  							arrE.splice(0,1);
								}
								if(obj!=null)//Elemento encontrado
								{
									try
									{
										eventLayer.emit('OperationResult',socketID,requestID,url,obj.obj.jsonData,false,null,false);
										//eventLayer.emit('GetValueResult',socketID,requestID,url,obj.obj.jsonData,null);
									}catch(e){
										if(typeof(e.message) !== 'undefined')
											e = e.message;
										logger.error("Exception: ", e, ". Module: db_connection, function 'getValue'");
									}
									return;
								}
								else
								{
									try
									{
										eventLayer.emit('OperationResult',socketID,requestID,url,"Not found",false,null,false);
										//eventLayer.emit('GetValueResult',socketID,requestID,url,{},"Not Found");
									}catch(e){
										if(typeof(e.message) !== 'undefined')
											e = e.message;
										logger.error("Exception: ", e, ". Module: db_connection, function 'getValue'");
									}
									return;
								}
							}
							else if(obj != null)//Es el dato que se está buscando
							{
								try
								{
									eventLayer.emit('OperationResult',socketID,requestID,url,obj.obj.jsonData,false,null,false);
									//eventLayer.emit('GetValueResult',socketID,requestID,url,obj.jsonData,null);
								}catch(e){
									if(typeof(e.message) !== 'undefined')
										e = e.message;
									logger.error("Exception: ", e, ". Module: db_connection, function 'getValue'");
								}
								return;
							}
							else
							{
								try
								{
									eventLayer.emit('OperationResult',socketID,requestID,url,"Not Found",false,null,false);
									//eventLayer.emit('GetValueResult',socketID,requestID,url,null,"Not Found");
								}catch(e){
									if(typeof(e.message) !== 'undefined')
										e = e.message;
									logger.error("Exception: ", e, ". Module: db_connection, function 'getValue'");
								}
								return;
							}
						});
                    }
                    else
                    {
                    	try
						{
							eventLayer.emit('OperationResult',socketID,requestID,url,null,true,"Bad url",false);
							//eventLayer.emit('GetValueResult',socketID,requestID,url,null,"Bad url");
						}catch(e){
							if(typeof(e.message) !== 'undefined')
								e = e.message;
							logger.error("Exception: ", e, ". Module: db_connection, function 'getValue'");
						}
						return;
                    }

                });

	};
	//Create an url if not exists
	this.createIfNotExists = function(url,socket,requestID){
		var errMessage = "Error subscribing client";
		mongoClient.connect(dbUrl,function(err,db){
			if(err != null)
			{
				errMessage = err.message;
				logger.error("Can't connect to ", dbUrl, ' to set value');
				eventLayer.emit('OperationResult',socket,requestID,url,null,true,errMessage,true);
				return;
			}
			logger.info("Success connection to ", dbUrl);
			var arrE = getArrayFromUrl(url);
			if(arrE.length >0)
			{
				var root= arrE.splice(0,1)[0];
				db.collection('url').findOne({_id:root},function(err,document){
					if(err != null)
					{
						errMessage = err.message;
						logger.error("Can't find the element ", root);
						eventLayer.emit('OperationResult',socket,requestID,url,null,true,"Error subscribing client",true);
						return;
					}
					var createUrl = false;
					if(document == null)
					{
						createUrl = true;
					}
					else
					{
						var obj={'obj':document,index:0,ar:document.childrens};
						while(obj != null)
						{
							if(obj.obj._id === arrE[arrE.length-1])
							{
								arrE.splice(0,1);
								break;
							}
							obj=findElement(obj.obj.childrens,arrE[0]);
							if(obj != null)
							{
								if(arrE.length>1)
		 							arrE.splice(0,1);
		 					}
								
						}
						if(arrE.length!=0)
							createUrl = true;
					}

					if(createUrl)
					{
						logger.info("Creating url: ",url);
						this.setValue(url,null,socket,requestID,true);
					}
					else
					{
						eventLayer.emit('OperationResult',socket,requestID,url,true,false,null,true);
					}

				});
			}
		});

	};				
        return this;
}

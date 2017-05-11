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
	this.setValue=function(url,jsonObject){
			var emitEventOnError = false;
			var socket = arguments[3];
			if(typeof(arguments[2]!=='undefined' && arguments[2] === true))
				emitEventOnError = true;
			mongoClient.connect(dbUrl,function(err,db){
			if(err != null)
			{
				logger.error("Can't connect to ", dbUrl, ' to set value');
				if(emitEventOnError)
					eventLayer.emit('ErrorCreatingURL',url,socket);
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
						logger.error("Can't find the element ", root);
						if(emitEventOnError)
							eventLayer.emit('ErrorCreatingURL',url,socket);
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
                            			logger.error("Can't Update the element ", parent._id);
                            			if(emitEventOnError)
											eventLayer.emit('ErrorCreatingURL',url,socket);
                            		}
                            		else
                            		{
                            			logger.info("Updated element ");
                            			eventLayer.emit('DataChanged',jsonObject,url);
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
                            			logger.error("Can't Update the element ", parent._id);
                            			if(emitEventOnError)
											eventLayer.emit('ErrorCreatingURL',url,socket);
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
									logger.error("Can't insert the element ");
									if(emitEventOnError)
										eventLayer.emit('ErrorCreatingURL',url,socket);
									return;
								}
								else
								{
									logger.info("Inserted element ");
									eventLayer.emit('ChildAdded',jsonObject,url,socket);
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
	this.removeValue= function(url){
		mongoClient.connect(dbUrl,function(err,db){
					if(err != null)
					{
						logger.error("Can't connect to ", dbUrl, ' to remove value');
						return;
					}
					logger.info("Success connection to ", dbUrl);
                    var arrE =getArrayFromUrl(url);
                    if(arrE.length==1)//Eliminar el elemento root
                    {
                    	db.collection('url').remove({_id:arrE[0]},function(err,result){
                    		if(err != null)
                    		{
                    			logger.error("Can't delete");
                    			return;
                    		}
                    		else
                    		{
                    			logger.info("Element deleted");
                    			eventLayer.emit('ChildRemoved',jsonObject,url);
                    			return;
                    		}
                    	});
                    }
                    else if(arrE.length>0)
                    {
                    	db.collection('url').findOne({_id:arrE[0]},function(err,result){
                    		if(err !=null)
                    		{
                            	logger.error("Can't find ",arrE[0]);
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
                            			logger.error("Can't update element");
                            		}
                            		else
                            		{
 										logger.info("Updated element");
 										eventLayer.emit('ChildRemoved',jsonObject,url);	                           			
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
		mongoClient.connect(dbUrl,function(err,db){
					if(err != null)
					{
						logger.error("Can't connect to ", dbUrl, ' to get value');
						try
						{
							eventLayer.emit('GetValueResult',socketID,requestID,url,null,err);
						}catch(e){
							logger.error("Exception: ", e, ". Module: db_connection, function 'getValue'");
						}
						return;
					}
					logger.info("Success connection to ", dbUrl);
                    var arrE =getArrayFromUrl(url);
                    if(arrE.length>0)
                    {
                    	db.collection('url').findOne({_id:arrE[0]},function(err,result){
                    		if(err !=null)
                    		{
                            	logger.error("Can't find ",arrE[0]);
                            	try
								{
									eventLayer.emit('GetValueResult',socketID,requestID,url,null,err);
								}catch(e){
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
										eventLayer.emit('GetValueResult',socketID,requestID,url,obj.obj.jsonData,null);
									}catch(e){
										logger.error("Exception: ", e, ". Module: db_connection, function 'getValue'");
									}
									return;
								}
								else
								{
									try
									{
										eventLayer.emit('GetValueResult',socketID,requestID,url,{},"Not Found");
									}catch(e){
										logger.error("Exception: ", e, ". Module: db_connection, function 'getValue'");
									}
									return;
								}
							}
							else if(obj != null)//Es el dato que se está buscando
							{
								try
								{
									eventLayer.emit('GetValueResult',socketID,requestID,url,obj.jsonData,null);
								}catch(e){
									logger.error("Exception: ", e, ". Module: db_connection, function 'getValue'");
								}
								return;
							}
							else
							{
								try
								{
									eventLayer.emit('GetValueResult',socketID,requestID,url,null,"Not Found");
								}catch(e){
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
							eventLayer.emit('GetValueResult',socketID,requestID,url,null,"Bad url");
						}catch(e){
							logger.error("Exception: ", e, ". Module: db_connection, function 'getValue'");
						}
						return;
                    }

                });

	};
	//Create an url if not exists
	this.createIfNotExists = function(url,socket){
		mongoClient.connect(dbUrl,function(err,db){
			if(err != null)
			{
				logger.error("Can't connect to ", dbUrl, ' to set value');
				eventLayer.emit('ErrorCreatingURL',url,socket);
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
						logger.error("Can't find the element ", root);
						eventLayer.emit('ErrorCreatingURL',url,socket);
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
						this.setValue(url,null,true,socket);
					}

				});
			}
		});

	};				
        return this;
}

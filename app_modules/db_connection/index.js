/**
*
* @author Yorbenys
* From an url get the array representation
*/
var getArrayFromUrl = function(url)
{
	var arrE = url.split('/');
			while(arrE.indexOf("")!=-1 || arrE.indexOf("") != -1 )
			{
				arrE.splice(arrE.indexOf(""),1);//Quitando string vacios
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
var eventLayer = require('../event_layer')
module.exports = function(dbUrl,logger){
	/**
	*
	* @author Yorbenys
	* Create a tree with url representation
	*/
	this.setValue=function(url,jsonObject){
			mongoClient.connect(dbUrl,function(err,db){
			if(err != null)
			{
				logger.error("Can't connect to ", dbUrl, ' to set value');
				return;
			}
			var arrE = getArrayFromUrl(url);
			if(arrE.length >0)
			{
				var root= arrE.splice(0,1)[0];
				db.collection('url').findOne({_id:root},function(err,document){
					if(err != null)
					{
						logger.error("Can't find the element ", root);
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
                            			logger.error("Can't Update the element ", parent._id);
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
                            			logger.error("Can't Update the element ", parent._id);
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
									return;
								}
								else
								{
									logger.info("Inserted element ");
									eventLayer.emit('ChildAdded',jsonObject,url);
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
	this.getValue= function(url,callbackFunc){
		mongoClient.connect(dbUrl,function(err,db){
					if(err != null)
					{
						logger.error("Can't connect to ", dbUrl, ' to remove value');
						try
						{
							callbackFunc(null,err);
						}catch(e){}
						return;
					}
                    var arrE =getArrayFromUrl(url);
                    if(arrE.length>0)
                    {
                    	db.collection('url').findOne({_id:arrE[0]},function(err,result){
                    		if(err !=null)
                    		{
                            	logger.error("Can't find ",arrE[0]);
                            	try
								{
									callbackFunc(null,err);
								}catch(e){}
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
										callbackFunc(obj.obj.jsonData,null);
									}catch(e){}
									return;
								}
								else
								{
									try
									{
										callbackFunc({},"Not Found");
									}catch(e){}
									return;
								}
							}
							else if(obj != null)//Es el dato que se está buscando
							{
								try
								{
									callbackFunc(obj.jsonData,err);
								}catch(e){}
								return;
							}
							else
							{
								try
								{
									callbackFunc(null,"Not Found");
								}catch(e){}
								return;
							}
						});
                    }
                    else
                    {
                    	try
						{
							callbackFunc(null,"Bad url");
						}catch(e){}
						return;
                    }

                });

	};				
        return this;
}

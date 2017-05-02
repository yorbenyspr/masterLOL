var logger = null;
var confManager = require('../configuration');
if(typeof(confManager.getAppLevel()) !=='undefined' && confManager.getAppLevel().toLowerCase()==='debug')
{
	logger = require('../../node_modules/simple-node-logger').createSimpleLogger('project.log');//Log to console and file
}
else
{
	logger=require('simple-node-logger').createSimpleFileLogger('project.log');//Log only to a file 
}
var Logger =  function()
{
	this.info = function()
	{
		logger.info.apply(logger,arguments);
	};

	this.error = function()
	{
		logger.error.apply(logger,arguments);
	};

	this.unhandledException = function(err)
	{
		logger.error('An unhandled exception occur. Exception: ',err);
	};
};

var loggerM = new Logger();
module.exports = loggerM;
var fs = require('fs');
var path = require('path');
var jsonDir =  path.join(__dirname,'mongodb.json');
var appjsonDir = path.join(__dirname,'app.json');
var fireloldbjsonDir = path.join(__dirname,'fireloldb.json');
var confjson = JSON.parse(fs.readFileSync(jsonDir, 'utf8'));
var appjson = JSON.parse(fs.readFileSync(appjsonDir, 'utf8'));
var fireLolDbStructurejson = JSON.parse(fs.readFileSync(fireloldbjsonDir, 'utf8'));
var Configuration = function()
{
	this.getMongoServerUrl = function()
	{
		return confjson.url;
	};
	this.getAppLevel = function()
	{
		return appjson.level;
	};
	this.getPingInterval = function()
	{
		return appjson.pingInterval;
	};
	this.getMaxPing = function()
	{
		return appjson.maxPing;
	};
	this.getFireLolDbStructure = function()
	{
		return fireLolDbStructurejson;
	};
}
var confManager = new Configuration();
module.exports = confManager;
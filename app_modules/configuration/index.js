var fs = require('fs');
var path = require('path');
var jsonDir =  path.join(__dirname,'mongodb.json');
var appjsonDir = path.join(__dirname,'app.json');
var confjson = JSON.parse(fs.readFileSync(jsonDir, 'utf8'));
var appjson = JSON.parse(fs.readFileSync(appjsonDir, 'utf8'));
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
}
var confManager = new Configuration();
module.exports = confManager;
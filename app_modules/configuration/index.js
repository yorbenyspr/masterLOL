var fs = require('fs');
var path = require('path');
var jsonDir =  path.join(__dirname,'mongodb.json');
var confjson = JSON.parse(fs.readFileSync(jsonDir, 'utf8'));
var Configuration = function()
{
	this.getMongoServerUrl = function()
	{
		return confjson.url;
	};
}
var confManager = new Configuration();
module.exports = confManager;
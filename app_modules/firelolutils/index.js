var FireLolUtils = function() {
	this.validateUrl = function (url){
		var regEx = new RegExp("[a-zA-Z0-9]{1,768}(/[a-zA-Z0-9]{1,768})?$")
		if(!regEx.test(url))
			throw 'Bag url: '+ url;
		return true;
	};
};

var firelolUtils = new FireLolUtils();

module.exports = firelolUtils; 
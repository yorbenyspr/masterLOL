var FireLolUtils = function() {
	var invalidCharCode = [127,36,35,91,93,46];
	this.validateUrl = function (url){
		var regEx = new RegExp("[a-zA-Z0-9]{1,768}(/[a-zA-Z0-9]{1,768})?$")
		if(!regEx.test(url))
			throw 'Bag url: '+ url;
		var arrE = url.split("/");
		if(arrE.length > 32)
			throw 'Bag url: '+ url;
		for (var i = 0; i < arrE.length; i++) {
			var str = arrE[i];
			if(str.length > 768 || hasInvalidCharacters(str))
				throw 'Bag url: '+ url;
		};
		return true;
	};
	/**
	*Check if an string have invalid characters for url
	*/
	var hasInvalidCharacters = function(str){
		for (var i = 0; i < str.length; i++) {
			var charCode = str.charCodeAt(i);
			if((charCode >= 0 && charCode <= 31) || invalidCharCode.indexOf(charCode) > -1)
				return true;
		};
		return false;
	};
	/**
	* Check if an string is empty or white spaces
	*/
	this.isEmptyOrSpaces = function(str) {
    	return str === null || str.match(/^ *$/) !== null;
	};
};

var firelolUtils = new FireLolUtils();

module.exports = firelolUtils; 
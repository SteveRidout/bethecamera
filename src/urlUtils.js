"use strict";

// Functions to deal with URLs

define(['src/getUrl'], function (getUrlPlugin) {

	// Gets the absolute URL for a relative path using requireJS
	var getResourceUrl = function (resourcePath, data) {
		var url;
		require(['src/getUrl!' + resourcePath], function (newUrl) {
			url = newUrl;
		});
		// TODO: fix in case of no initial query string (would need '?' instead of '&')
		if (typeof(data) != "undefined") {
			$.each(data, function (key, value) {
				url += "&" + key + "=" + value;
			});
		}
		return url;
	};

	return {
		getResourceUrl : getResourceUrl
	};
});

"use strict";

// This fetches and caches the mustache templates, and
// runs mustache on them

define(
		[	'src/urlUtils',
			'external/mustache'
		],
		function (
			urlUtils,
			Mustache
		) {

	// map of filename (minus .mustache extension) to contents
	var templateCache = {};

	var toHtml = function (template, data, templateLiteral /* optional */) {
		if (templateLiteral) {
			return Mustache.to_html(template, data);
		}

		if (!(template in templateCache)) {
			$.ajax({
				url : urlUtils.getResourceUrl("html/" + template + ".mustache"),
				dataType : "text",
				success : function (data) {
					templateCache[template] = data;
				},
				error : function () {
					console.error("Couldn't fetch mustache template: " + template);
				},
				async: false
			});
		}

		return Mustache.to_html(templateCache[template], data);
	};

	return {
		toHtml : toHtml
	};
});

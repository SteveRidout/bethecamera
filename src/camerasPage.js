"use strict";

define(
		[	'src/CameraSettings',
			'src/cameraTable'
		], function (
			CameraSettings,
			cameraTable
		) {
	var cameraSettings = new CameraSettings();

	$(document).ready(function () {
		cameraTable.setup($('#cameraTableContainer'), $('#amazonLink'),
			cameraSettings, function () {});
	});
});

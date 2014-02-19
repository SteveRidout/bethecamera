"use strict";

define(
		[	'src/cameraEngine',
			'src/cameraControls',
			'src/scene',
			'src/CameraSettings',
			'src/cameraSelector'
		], function (
			cameraEngine,
			cameraControls,
			scene,
			CameraSettings,
			cameraSelector
		) {
	var cameraSettings = new CameraSettings();

	$(document).ready(function () {
		if ($.browser.chrome !== true) {
			$('#browserWarning').css('display', 'block');
		}

		scene.init(cameraSettings, $('#sceneSelector'));
		cameraControls.setup(cameraSettings, scene.drawScene, scene.getFocalLength());
		cameraSelector.setup(cameraSettings, $('#cameraSelector'), scene.drawScene);
	});
});


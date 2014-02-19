"use strict";

define(
		[	'src/exposureFunctions',
			'src/cameraData'
		], function (
			exposureFunctions,
			cameraData
		) {
	var cameraSettings,
		selectElement,
		onChangeCallback;

	var setup = function (
			_cameraSettings, _selectElement, _onChangeCallback) {

		cameraSettings = _cameraSettings;
		selectElement = _selectElement;
		onChangeCallback = _onChangeCallback;

		var tableData = {
			cameras : []
		};

		// to group similar cameras
		var cameraTypes = {};

		// convert to displayed version
		$.each(cameraData.cameras, function (cameraIndex, camera) {
			var thisCameraType = camera.cropFactor + ", ";

			var displayItems = [camera.name];
			var apertureString = "f" + camera.lens[0].maxAperture;

			if (camera.lens.length > 1) {
				displayItems.push(camera.lens[0].focalLength + "-" + camera.lens[1].focalLength + "mm");
				if (camera.lens[1].maxAperture !== camera.lens[0].maxAperture) {
					apertureString += "-" + camera.lens[1].maxAperture;
				}
			} else {
				displayItems.push(camera.lens[0].focalLength + "mm");
			}
			displayItems.push(apertureString);

			selectElement.append(
				$('<option>').attr('data-index', cameraIndex).text(displayItems.join(', ')));
		});

		selectElement.change(function () {
			var selectedIndex = selectElement.find('option:selected').attr('data-index');
			console.log('selected ', selectedIndex);
			updateCamera(selectedIndex);
		});
			
		updateCamera(0);
	};

	var updateCamera = function (cameraIndex) {
		var camera = cameraData.cameras[cameraIndex];

		camera.focalLength50 = Math.round(500 / camera.cropFactor) / 10;

		if (camera.cropFactor === 1) {
			camera.fullFrame = true;
		}

		if ("ISO" in camera) {
			cameraSettings.cameraSpec.minISO = camera.ISO.min;
			cameraSettings.cameraSpec.maxISO = camera.ISO.max;
		}
		if ("cropFactor" in camera) {
			cameraSettings.cameraSpec.cropFactor = camera.cropFactor;
		} else {
			cameraSettings.cameraSpec.cropFactor = categories[0].cropFactor;
		}

		cameraSettings.cameraSpec.lens = camera.lens;
		console.log("cameraSpec = " + JSON.stringify(cameraSettings.cameraSpec));

		if (typeof(onChangeCallback) !== "undefined") {
			// TODO: not clean - cropFactor is within cameraSpec, but is currently needed
			onChangeCallback(['cameraSpec', 'cropFactor']);
		}
	};

	return {
		setup : setup
	};
});


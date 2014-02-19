"use strict";

define(
		[	'src/cameraEngine',
			'src/cameraControls',
			'src/mustache',
			'src/urlUtils'
		],
		function (
			cameraEngine,
			cameraControls,
			mustache,
			urlUtils
		) {
	var scenes = [
			{
				name : "Tree Bear",
				layers : [
					{
						name : "background",
						source : "content/treeDog/tree-dog-24-back-540.jpg",
						focalDistance : 15 // in meters
					},
					{
						name : "foreground",
						source : "content/treeDog/tree-dog-24-fore-540.png",
						focalDistance : 1.3
					}
				],
				hdrToLdrMultiplier : 1.8,
				sceneEV : 9,
				EVOffset : 3,
				width : 540,
				height : 360,
				focalLength : 24,
				location : "Retiro Park, Madrid",
				description : "Poor little bear."
			},
			{
				name : "Tree Bear",
				layers : [
					{
						name : "background",
						source : "content/treeDog/tree-dog-50-back-540.jpg",
						focalDistance : 15 // in meters
					},
					{
						name : "foreground",
						source : "content/treeDog/tree-dog-50-fore-540.png",
						focalDistance : 1.3
					}
				],
				hdrToLdrMultiplier : 1.8,
				sceneEV : 9,
				EVOffset : 3,
				width : 540,
				height : 360,
				focalLength : 50,
				location : "Retiro Park, Madrid",
				description : "If we zoom in while keeping the aperture constant, the background becomes more blurred."
			},
			{
				name : "Tree Bear",
				layers : [
					{
						name : "background",
						source : "content/treeDog/tree-dog-80-back-540.jpg",
						focalDistance : 15 // in meters
					},
					{
						name : "foreground",
						source : "content/treeDog/tree-dog-80-fore-540.png",
						focalDistance : 1.3
					}
				],
				hdrToLdrMultiplier : 1.2,
				sceneEV : 9,
				EVOffset : 0,
				width : 540,
				height : 360,
				focalLength : 80,
				location : "Retiro Park, Madrid",
				description : "At 80mm we're in the telephoto range, and at a distance of only 1.3m from our subject we can acheive a very shallow depth of field effect by using a large aperture. Remember a larger aperture means lower f-stop.",
				notes: "With a very large aperture the tree in the foreground should start to become blurred, even when the dog is in focus, this shows a weakness of the simulation method, which simplifies the scene into only two layers"
			},
			{
				name : "Church",
				layers : [
					{
						name : "",
						source : "content/cathedral/cathedral-540.jpg",
						focalDistance : 40 // in meters
					}
				],
				
				hdrToLdrMultiplier : 1.4,
				sceneEV : 11,
				EVOffset : 0,
				width : 540,
				height : 360,
				focalLength : 35,
				description : "Taken while the sun was setting. At this focal range and distance the whole image stays in focus, even when using a large aperture."
			},
			{
				name : "Lounge",
				layers : [
					{
						name : "background",
						source : "content/loungeScene/lounge-hdr-background.jpg",
						focalDistance : 8
					},
					{
						name : "foreground",
						source : "content/loungeScene/lounge-hdr-foreground.png",
						focalDistance : 1.5,
					}
				],
				
				hdrToLdrMultiplier : 2,
				sceneEV : 3,
				EVOffset : 2.3,
				width : 540,
				height : 360,
				focalLength : 50,
				description: "This is a low-light scene. The scene is static, so you can improve the quality by using a slower shutter speed."
			},
			{
				name : "Lounge, moving dog",
				layers : [
					{
						name : "background",
						source : "content/loungeScene/lounge-hdr-background.jpg",
						focalDistance : 8
					},
					{
						name : "foreground",
						source : "content/loungeScene/lounge-hdr-foreground.png",
						focalDistance : 1.5,
						horizontalMotionBlur : 8 // in pixels / second
					}
				],
				hdrToLdrMultiplier : 2,
				sceneEV : 3,
				EVOffset : 2.3,
				width : 540,
				height : 360,
				focalLength : 50,
				description : "This is a low-light scene and the dog is moving on a conveyor belt just out of shot, so the shutter speed needs to be kept reasonably fast to avoid motion blur. This makes it impossible to get a sharp, low noise image with a typical compact camera and shows the advantage of having a camera with a large aperture."
			}
		],
		sceneDefinition,
		leftToLoad,
		largeCanvas,
		layerImages,
		layerCanvases,
		layerContexts,
		hdrBuffer,
		mainContext,
		defocusedContextsCache, // defocused buffers stored in cache
		drawSceneTimer,
		drawSceneTime = 100,
		drawSceneVariables = [],
		cameraSettings,
		initialising = true;
	
	var loadImage = function (sourceFile) {
		console.log("loading image " + sourceFile);
		leftToLoad++;
		var image = new Image();
		image.onload = imageLoaded;
		image.src = urlUtils.getResourceUrl(sourceFile);
		return image;
	};

	var imageLoaded = function () {
		console.log("image loaded");
		leftToLoad--;

		if (leftToLoad === 0) {
			onLoaded();
		}
	};

	var onLoaded = function () {
		$('#loading').hide();

		$.each(layerImages, function (i, layer) {
			addLayer(layer, i);
			addLayer(layer, i);
		});

		// create HDR image buffer
		hdrBuffer.width = sceneDefinition.width;
		hdrBuffer.height = sceneDefinition.height;

		// set focus to last layer
		cameraSettings.focusLayer = sceneDefinition.layers.length - 1;

		if (sceneDefinition.layers.length > 1) {
			$('input[name=focus][value=back]').attr('disabled', false);
		} else {
			$('input[name=focus][value=back]').attr('disabled', true);
			$('input[name=focus][value=fore]').prop('checked', true);
		}

		$('input[name=focus]:checked').change();
		drawScene(['scene']);
	};

	var cacheSize = 0;
	var getDefocusedLayer = function (
			layerIndex, defocusBlurRadius, horizontalMotionBlur /* optional */) {
		horizontalMotionBlur = horizontalMotionBlur || 0;
		defocusBlurRadius = Math.abs(defocusBlurRadius);

		var round;
		// limit radius values for effective caching
		if (defocusBlurRadius < 1) {
			round = 0.25;
		} else if (defocusBlurRadius < 6) {
			round = 0.5;
		} else {
			round = 1;
		}

		defocusBlurRadius = Math.round(defocusBlurRadius / round) * round;

		var cacheKey = "l:" + layerIndex + ", " + "r:" + defocusBlurRadius;

		if (!(cacheKey in defocusedContextsCache) || (horizontalMotionBlur > 0)) {
			defocusedContextsCache[cacheKey] = cameraEngine.fastBlur(
				layerCanvases[layerIndex], defocusBlurRadius + horizontalMotionBlur, defocusBlurRadius);

			cacheSize++;
			console.log("cache miss, cache size: " + cacheSize);
		}
		
		return defocusedContextsCache[cacheKey];
	};
	
	var focusChanged = function (cameraSettings) {
		console.time("focus");

		var bufferContext = hdrBuffer.getContext('2d');

		$.each(layerCanvases, function (i, layerCanvas) {
			var defocusBlurRadius,
				horizontalMotionBlur,
				defocusedBuffer,
				focus = sceneDefinition.layers[
					Math.min(cameraSettings.focusLayer, sceneDefinition.layers.length - 1)].focalDistance;
			
			defocusBlurRadius = Math.abs(
				1.0 / focus - 1.0 / sceneDefinition.layers[i].focalDistance) / 
				(cameraSettings.aperture * cameraSettings.cameraSpec.cropFactor) *
				sceneDefinition.focalLength * sceneDefinition.focalLength / 160;

			horizontalMotionBlur = sceneDefinition.layers[i].horizontalMotionBlur || 0;

			console.log("hblur for layer " + i + " = " + horizontalMotionBlur);
			
			defocusedBuffer = getDefocusedLayer(i, defocusBlurRadius,
				horizontalMotionBlur * cameraSettings.shutter);
			bufferContext.drawImage(defocusedBuffer, 0, 0);
		});

		console.timeEnd("focus");
	};

	var addLayer = function (image, index) {
		layerCanvases[index] = document.createElement('canvas');
		layerCanvases[index].width = sceneDefinition.width;
		layerCanvases[index].height = sceneDefinition.height;
		layerContexts[index] = layerCanvases[index].getContext('2d');
		layerContexts[index].drawImage(image, 0, 0);
	};

	var drawScene = function (variablesChanged) {
		drawSceneVariables = drawSceneVariables.concat(variablesChanged);
		
		if (leftToLoad > 0) {
			console.log("drawScene cancelled, still loading");
			return;
		}

		clearTimeout(drawSceneTimer);
		drawSceneTimer = setTimeout(function () {
			var tempVars = drawSceneVariables;
			drawSceneVariables = [];
			actualDrawScene(tempVars);
		}, Math.min(drawSceneTime, 100));
	};

	var actualDrawScene = function (variablesChanged) {
		if (variablesChanged.indexOf("cameraSpec") > -1 || variablesChanged.indexOf("scene") > -1) {
			console.log("cameraSpec changed");

			if (cameraSettings.supportsFocalLength(
					sceneDefinition.focalLength / cameraSettings.cameraSpec.cropFactor)) {
				$('#simulationStatus').text("");
			} else {
				$('#simulationStatus').text("Note: the selected camera/lens combination " +
						"doesn't support this photo's focal length of " +
						sceneDefinition.focalLength + "mm (full frame equivalent).");
			}

			cameraControls.setup(cameraSettings, drawScene,
					sceneDefinition.focalLength / cameraSettings.cameraSpec.cropFactor);
			return;
		}

		var oldAperture = cameraSettings.aperture;
		cameraSettings.calculate(sceneDefinition.sceneEV,
				sceneDefinition.focalLength / cameraSettings.cameraSpec.cropFactor);
		cameraControls.updateDisplay();
		
		if (oldAperture !== cameraSettings.aperture) {
			variablesChanged.push('aperture');
		}

		console.log("f" + cameraSettings.aperture + "  " + cameraSettings.focus + "m  " + 
			Math.floor(cameraSettings.ISO) + "ISO   " + cameraSettings.shutter + "s  " +
			cameraSettings.cameraSpec.cropFactor + "x");

		focusChanged(cameraSettings);

		var bufferContext = hdrBuffer.getContext('2d');

		var startTime = new Date().getTime();
		console.time("drawPhoto");
		console.log("camera EV = " + cameraSettings.EV());
		cameraEngine.drawPhoto(
			bufferContext.getImageData(0, 0, sceneDefinition.width, sceneDefinition.height),
			mainContext, sceneDefinition.sceneEV - cameraSettings.EV() + sceneDefinition.EVOffset,
			cameraSettings.cameraSpec.cropFactor * Math.sqrt(cameraSettings.ISO) * 256 / 600,
			sceneDefinition.hdrToLdrMultiplier);
		console.timeEnd("drawPhoto");

		drawSceneTime = new Date().getTime() - startTime;
	};

	var init = function (_cameraSettings, sceneSelectorElement) {
		cameraSettings = _cameraSettings;

		largeCanvas = document.getElementById('largeCanvas');
		hdrBuffer = document.createElement('canvas');

		if (!largeCanvas || !largeCanvas.getContext) {
			chromeFrameInstallPrompt();
			return;
		}
		else {
			mainContext = largeCanvas.getContext('2d');
			if (!mainContext) {
				chromeFrameInstallPrompt();
				return;
			}
		}

		var defaultScene = 1;

		loadScene(defaultScene);
		
		sceneSelectorElement.html(mustache.toHtml('sceneSelector', {scenes: scenes}));
		sceneSelectorElement.change(function () {
			var index = sceneSelectorElement.find('option').index(sceneSelectorElement.find('option:selected'));
			console.log('change scene: ', index);
			loadScene(index);
		});

		sceneSelectorElement.find('option').eq(defaultScene).prop('selected', true);
	};

	var loadScene = function (sceneIndex) {
		// reset
		leftToLoad = 0;
		layerImages = [];
		layerCanvases = [];
		layerContexts = [];
		defocusedContextsCache = {};

		sceneDefinition = scenes[sceneIndex];
		console.log("loading scene " + sceneIndex + ": " + sceneDefinition.name);
		$('#sceneInfo').html(mustache.toHtml('sceneInfo', sceneDefinition));

		$('#loading').fadeIn(400);

		$.each(sceneDefinition.layers, function (i, layerDefinition) {
			layerImages[i] = loadImage(layerDefinition.source);
		});
	};

	var chromeFrameInstallPrompt = function () {
		CFInstall.check({
			mode: "overlay",
			destination: "http://bethecamera.com"
		});
	};

	return {
		init : init,
		drawScene : drawScene,
		cache : function () {
			return defocusedContextsCache;
		},
		getFocalLength : function () {
			return sceneDefinition.focalLength;
		}
	};
});

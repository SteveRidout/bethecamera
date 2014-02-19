"use strict";

define(['src/exposureFunctions'], function (exposureFunctions) {
	var ISOValues = [],
		apertureValues = [],
		shutterValues = [],
		cropFactor = [],
		exposureValues = [],
		ISOSlider,
		apertureSlider,
		shutterSlider,
		exposureSlider,
		settingsChanged,
		cameraSettings,
		modeSelector,
		initialising = true;

	var updateDisplay = function (ISO) {
		$('#ISOAmount').val(cameraSettings.ISO + " ISO");
		$('#apertureAmount').val("f" + cameraSettings.aperture);
		if (cameraSettings.shutter < 0.5) {
			$('#shutterAmount').val("1/" + Math.round(1 / cameraSettings.shutter) + " s");
		}
		else {
			$('#shutterAmount').val(Math.round(cameraSettings.shutter * 10) / 10 + " s");
		}
		var EVAmount = "";
		if (cameraSettings.EVComp > 0) {
			EVAmount = "+";
		} else if (cameraSettings.EVComp < 0) {
			EVAmount = "-";
		}
		$('#exposureAmount').val(EVAmount + Math.abs(Math.round(100 *
				exposureFunctions.roundEV(cameraSettings.EVComp)) / 100));

		// TODO: update slider positions
		ISOSlider.slider({
			value : ISOValues.indexOf(exposureFunctions.roundISO(cameraSettings.ISO))
		});
		apertureSlider.slider({
			value : apertureValues.indexOf(exposureFunctions.roundAperture(cameraSettings.aperture))
		});
		shutterSlider.slider({
			value : shutterValues.indexOf(exposureFunctions.roundShutter(cameraSettings.shutter))
		});

		var sliderEV = Math.min(exposureValues[exposureValues.length - 1], Math.max(exposureValues[0],
				exposureFunctions.roundEV(cameraSettings.EVComp)));
		exposureSlider.slider({
			value : exposureValues.indexOf(sliderEV)
		});

		$('#simulationError').text(cameraSettings.error);
	};

	var ISOChanged = function (event, ui) {
		cameraSettings.ISO = ISOValues[ui.value];
		updateDisplay();
		if (!initialising) {
			settingsChanged(["ISO"]);
		}
	};
	
	var apertureChanged = function (event, ui) {
		cameraSettings.aperture = apertureValues[ui.value];
		updateDisplay();
		if (!initialising) {
			settingsChanged(["aperture"]);
		}
	};
	
	var shutterChanged = function (event, ui) {
		cameraSettings.shutter = shutterValues[ui.value];
		updateDisplay();
		if (!initialising) {
			settingsChanged(["shutter"]);
		}
	};

	var exposureChanged = function (event, ui) {
		cameraSettings.EVComp = exposureValues[ui.value];
		updateDisplay();
		if (!initialising) {
			settingsChanged(["EVComp"]);
		}
	};
	
	var focusChanged = function () {
		var focusPlaneName = $('input[name=focus]:checked').val();
		console.log("focus plane: " + focusPlaneName);

		$('label[data-focus]').removeClass('selected');
		$('label[data-focus=' + focusPlaneName + ']').addClass('selected');

		if (focusPlaneName === "fore") {
			cameraSettings.focusLayer = 1;
		} else {
			cameraSettings.focusLayer = 0;
		}
		settingsChanged(["focus"]);
	};

	var modeChanged = function () {
		var mode = $('input[name=mode]:checked').val();

		$('label[data-mode]').removeClass('selected');
		$('label[data-mode=' + mode + ']').addClass('selected');

		console.log("Mode : " + mode);

		cameraSettings.mode = mode;
		//cameraSettings.calculate(5);

		if (!initialising) {
			settingsChanged(["aperture", "ISO", "shutter"]);
		}

		switch (mode) {
		case "A" :
			// disable all controls
			ISOSlider.slider('disable');
			apertureSlider.slider('disable');
			shutterSlider.slider('disable');
			exposureSlider.slider('enable');
			break;
		case "Av" :
			ISOSlider.slider('disable');
			apertureSlider.slider('enable');
			shutterSlider.slider('disable');
			exposureSlider.slider('enable');
			break;
		case "Tv" :
			ISOSlider.slider('disable');
			apertureSlider.slider('disable');
			shutterSlider.slider('enable');
			exposureSlider.slider('enable');
			break;
		case "M" :
			// enable all controls
			ISOSlider.slider('enable');
			apertureSlider.slider('enable');
			shutterSlider.slider('enable');
			exposureSlider.slider('disable');
			break;
		default :
			console.log("Mode not recognised");
			break;
		}
	};
	
	var touchHandler = function (event, ui) {
		var touches = event.changedTouches,
			first = touches[0],
			type = "";
		
		switch(event.type) {
		case "touchstart": type = "mousedown"; break;
		case "touchmove":  type="mousemove"; break;
		case "touchend":   type="mouseup"; break;
		default: return;
		}

		var simulatedEvent = document.createEvent("MouseEvent");
		simulatedEvent.initMouseEvent(type, true, true, window, 1, 
								  first.screenX, first.screenY, 
								  first.clientX, first.clientY, false, 
								  false, false, false, 0/*left*/, null);
		
		first.target.dispatchEvent(simulatedEvent);
		event.preventDefault();
	};

	var setup = function (_cameraSettings, _settingsChanged, focalLength) {
		cameraSettings = _cameraSettings;
		settingsChanged = _settingsChanged;

		ISOSlider = $('#ISOSlider');
		apertureSlider = $('#apertureSlider');
		shutterSlider = $('#shutterSlider');
		exposureSlider = $('#exposureSlider');

		console.log("cam spec = " + JSON.stringify(cameraSettings.cameraSpec));

		ISOValues = exposureFunctions.ISORange(
			cameraSettings.cameraSpec.minISO, cameraSettings.cameraSpec.maxISO);
		apertureValues = exposureFunctions.apertureRange(
			cameraSettings.maxApertureAtFocalLength(focalLength),
			cameraSettings.cameraSpec.minAperture);
		shutterValues = exposureFunctions.shutterRange(
			cameraSettings.cameraSpec.minShutter, cameraSettings.cameraSpec.maxShutter);
		exposureValues = exposureFunctions.EVRange(-3, 3);

		console.log("ap vals = " + JSON.stringify(apertureValues));

		ISOSlider.slider({
			value : ISOValues.indexOf(exposureFunctions.roundISO(cameraSettings.ISO)),
			min: 0,
			max: ISOValues.length - 1,
			step: 1,
			slide: ISOChanged
		});
		apertureSlider.slider({
			value : apertureValues.indexOf(exposureFunctions.roundAperture(cameraSettings.aperture)),
			min: 0,
			max: apertureValues.length - 1,
			step: 1,
			slide: apertureChanged
		});
		shutterSlider.slider({
			value : shutterValues.indexOf(exposureFunctions.roundShutter(cameraSettings.shutter)),
			min: 0,
			max: shutterValues.length - 1,
			step: 1,
			slide: shutterChanged
		});
		exposureSlider.slider({
			value : exposureValues.indexOf(exposureFunctions.roundEV(cameraSettings.EVComp)),
			min: 0,
			max: exposureValues.length - 1,
			step: 1,
			slide: exposureChanged
		});

		$('.ui-slider-handle').each(function (i, element) {
		    element.addEventListener("touchstart", touchHandler, true);
		    element.addEventListener("touchmove", touchHandler, true);
		    element.addEventListener("touchend", touchHandler, true);
		    element.addEventListener("touchcancel", touchHandler, true);
		});

		if (initialising) {
			$('input[name=focus][value=fore]').prop('checked', true)
			$('input[name=focus]').change(focusChanged);
			focusChanged();

			$('input[name=mode][value=A]').prop('checked', true);
			$('input[name=mode]').change(modeChanged);
			modeChanged();
		}

		restrictSettings();

		initialising = false;
	};

	var restrictSettings = function () {
		// restrict camera settings
		var oldISO = cameraSettings.ISO;
		var oldAperture = cameraSettings.aperture;
		var oldShutter = cameraSettings.shutter;

		cameraSettings.ISO = Math.min(Math.max(
			cameraSettings.ISO, ISOValues[0]), ISOValues[ISOValues.length - 1]);
		cameraSettings.aperture = Math.min(Math.max(
			cameraSettings.aperture, apertureValues[0]), apertureValues[apertureValues.length - 1]);
		cameraSettings.shutter = Math.min(Math.max(
			cameraSettings.shutter, shutterValues[0]), shutterValues[shutterValues.length - 1]);

		var variablesChanged = [];
		if (oldISO !== cameraSettings.ISO) {
			variablesChanged.push("ISO");
		}
		if (oldAperture !== cameraSettings.aperture) {
			variablesChanged.push("aperture");
		}
		if (oldShutter !== cameraSettings.shutter) {
			variablesChanged.push("shutter");
		}

		updateDisplay();

		if (!initialising) {
			settingsChanged(variablesChanged.concat(['cropFactor']));
		}
	};

	return {
		setup : setup,
		restrictSettings : restrictSettings,
		updateDisplay : updateDisplay
	};
});

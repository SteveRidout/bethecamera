"use strict";

// Stores and manipulates exposure settings like f-stop, shutter speed, ISO

define(['src/exposureFunctions'], function (exposureFunctions) {
	var CameraSettings = function (mode, ISO, aperture, shutter, cameraSpec) {
		this.mode = mode || "Auto";
		this.ISO = ISO || 800;
		this.aperture = aperture || 2;
		this.shutter = shutter || 1 / 16;
		this.EVComp = 0;

		this.focusLayer = 1;

		this.cameraSpec = cameraSpec || this.DEFAULT_CAMERA_SPEC;

		this.error = "";
	};

	CameraSettings.prototype.DEFAULT_CAMERA_SPEC = {
		cropFactor : 1,
		minISO : 100,
		maxISO : 6400,
		minAperture : 32,
		minShutter : 1 / 2048,
		maxShutter : 2,
		lens : [
			{
				focalLength : 24,
				maxAperture : 4
			},
			{
				focalLength : 105,
				maxAperture : 4
			}
		]
	};

	CameraSettings.prototype.maxApertureAtFocalLength = function (focalLength) {
		var focalLengthA = this.cameraSpec.lens[0].focalLength,
			maxApertureA = this.cameraSpec.lens[0].maxAperture,
			focalLengthB = this.cameraSpec.lens[this.cameraSpec.lens.length - 1].focalLength,
			maxApertureB = this.cameraSpec.lens[this.cameraSpec.lens.length - 1].maxAperture;

		var result;
		if (maxApertureA === maxApertureB) {
			result = maxApertureA;
		} else if (focalLength < focalLengthA) {
			result = maxApertureA;
		} else if (focalLength > focalLengthB) {
			result = maxApertureB;
		} else {
			result = maxApertureA + (maxApertureB - maxApertureA) *
				(focalLength - focalLengthA) / (focalLengthB - focalLengthA);
		}

		console.log("max ap at " + focalLength + "mm = " + result);
		return exposureFunctions.roundAperture(result);
	};
	
	// TODO: move to cameraSpec.js ??
	// update camera settings based on the given scene exposure
	CameraSettings.prototype.calculate = function (sceneEV, focalLength) {
		var minISO = this.cameraSpec.minISO || 100,
			maxISO = this.cameraSpec.maxISO || 3200,
			minAperture = this.cameraSpec.minAperture,
			maxAperture = this.maxApertureAtFocalLength(focalLength),
			minShutter = this.cameraSpec.minShutter,
			maxShutter = this.cameraSpec.maxShutter,
			targetEV = sceneEV - this.EVComp;

		this.error = "";

		switch (this.mode) {
		case "A":
			// allow full range of values, no extra constraints
			break;
		case "Av":
			console.log("Av calculate");
			// Constrain the aperture
			minAperture = this.aperture;
			maxAperture = this.aperture;
			break;
		case "Tv":
			// Constrain the shutter
			minShutter = this.shutter;
			maxShutter = this.shutter;
			break;
		case "M":
			// just update the EVComp
			this.EVComp = sceneEV - this.EV();
			return;
		}

		var maxPossibleEV = exposureFunctions.EV(minISO, minAperture, minShutter);
		var minPossibleEV = exposureFunctions.EV(maxISO, maxAperture, maxShutter);

		if (targetEV <= minPossibleEV) {
			// Dark scene - use max possible values
			this.ISO = maxISO;
			this.aperture = maxAperture;
			this.shutter = maxShutter;
		} else if (targetEV >= maxPossibleEV) {
			// Bright scene - use min possible values
			this.ISO = minISO;
			this.aperture = minAperture;
			this.shutter = minShutter;
		} else {
			// The general case, need to find an exact match
			// Priorities in order:
			// - shutter speed at target or lower/faster
			// - lowest ISO
			// - ISO lower than target
			
			var targetShutter = Math.min(Math.max(1 / 128, minShutter), maxShutter);
			var targetSlowShutter = Math.min(Math.max(0.5, minShutter), maxShutter);
			var targetISO = Math.min(Math.max(400, minISO), maxISO);

			console.log("target ISO = " + targetISO);
			console.log("max ISO = " + maxISO);
			console.log("target shutter = " + targetShutter);

			var EVAtTargetSlowShutter = exposureFunctions.EV(maxISO, maxAperture, targetSlowShutter);
			var EVAtTargetISO = exposureFunctions.EV(targetISO, maxAperture, targetShutter);
			var EVAtMinISO = exposureFunctions.EV(minISO, maxAperture, targetShutter);
			var EVAtMinShutter = exposureFunctions.EV(minISO, maxAperture, minShutter);

			var fraction;

			if (targetEV <= EVAtTargetSlowShutter) {
				// keep aperture wide and ISO max
				
				this.ISO = maxISO;
				this.aperture = maxAperture;
				this.shutter = maxShutter / Math.pow(2, targetEV - minPossibleEV);
			} else if (targetEV <= EVAtTargetISO) {
				// keep aperture wide
				this.aperture = maxAperture;

				// use ISO between max and target
				// use shutter between targetSlow and target
				
				fraction = (EVAtTargetISO - targetEV) / (EVAtTargetISO - EVAtTargetSlowShutter);

				console.log("fraction = " + fraction);

				this.ISO = exposureFunctions.thirdsToISO(
						fraction         * exposureFunctions.ISOToThirds(maxISO) +
						(1.0 - fraction) * exposureFunctions.ISOToThirds(targetISO)
					);
				this.shutter = exposureFunctions.thirdsToShutter(
						fraction         * exposureFunctions.shutterToThirds(targetSlowShutter) +
						(1.0 - fraction) * exposureFunctions.shutterToThirds(targetShutter)
					);
			} else if (targetEV <= EVAtMinISO) {
				// use max aperture
				this.aperture = maxAperture;

				// use target shutter
				this.shutter = targetShutter;

				fraction = (EVAtMinISO - targetEV) / (EVAtMinISO - EVAtTargetISO);

				// calculate ISO
				this.ISO = exposureFunctions.thirdsToISO(
						fraction         * exposureFunctions.ISOToThirds(targetISO) +
						(1.0 - fraction) * exposureFunctions.ISOToThirds(minISO)
					);
			} else if (targetEV <= EVAtMinShutter) {
				// use max aperture and minimum ISO
				this.aperture = maxAperture;
				this.ISO = minISO;

				fraction = (EVAtMinShutter - targetEV) / (EVAtMinShutter - EVAtMinISO);

				// calculate shutter
				this.shutter = exposureFunctions.thirdsToShutter(
						fraction         * exposureFunctions.shutterToThirds(targetShutter) +
						(1.0 - fraction) * exposureFunctions.shutterToThirds(minShutter)
					);
			} else {
				// use min ISO and min shutter
				this.ISO = minISO;
				this.shutter = minShutter;

				var fraction = (maxPossibleEV - targetEV) / (maxPossibleEV - EVAtMinShutter);

				// calculate aperture
				this.aperture = exposureFunctions.thirdsToAperture(
						fraction         * exposureFunctions.apertureToThirds(maxAperture) +
						(1.0 - fraction) * exposureFunctions.apertureToThirds(minAperture)
					);
			}
		}
		console.log("EV: " + this.EV() + " / " + targetEV);
		if (exposureFunctions.roundEV(this.EV()) > exposureFunctions.roundEV(targetEV)) {
			this.error = "Scene too dark";
		} else if (exposureFunctions.roundEV(this.EV()) < exposureFunctions.roundEV(targetEV)) {
			this.error = "Scene too light";
		}
	};

	CameraSettings.prototype.EV = function () {
		return exposureFunctions.EV(this.ISO, this.aperture, this.shutter);
	};

	CameraSettings.prototype.supportsFocalLength = function (focalLength) {
		console.log("checking focal length: " + focalLength);
		var minFocalLength = this.cameraSpec.lens[0].focalLength,
			maxFocalLength = this.cameraSpec.lens[this.cameraSpec.lens.length - 1].focalLength;

		return (focalLength * 0.98 <= maxFocalLength) &&
			(focalLength * 1.02 >= minFocalLength);
	};

	return CameraSettings;
});

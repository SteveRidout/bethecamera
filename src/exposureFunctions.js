"use strict";

// Functions for manipulating exposure settings like f-stop, shutter speed, ISO

define([], function () {
	// Returns the ISO value plus the given number of thirds of stops
	var ISOToThirds = function (ISO) {
		return Math.round(Math.log(ISO / 100) / Math.LN2 * 3);
	};
	var thirdsToISO = function (thirds) {
		var iso = Math.pow(2, thirds / 3) * 100,
			round;

		if (iso < 50) {
			round = 5;
		} else if (iso < 1000) {
			round = 10;
		} else if (iso < 1600) {
			round = 50;
		} else {
			round = 100;
		}

		return Math.round(iso / round) * round;
	};
	var ISORange = function (lowerBound, upperBound) {
		return xRange(lowerBound, upperBound, ISOToThirds, thirdsToISO);
	};
	var roundISO = function (ISO) {
		return thirdsToISO(ISOToThirds(ISO));
	};

	// Aperture
	var apertureToThirds = function (aperture) {
		return Math.round(Math.log(aperture) / Math.LN2 * 6);
	};
	var thirdsToAperture = function (thirds) {
		return Math.round(Math.pow(2, thirds / 6) * 10) / 10;
	};
	var apertureRange = function (lowerBound, upperBound) {
		return xRange(lowerBound, upperBound, apertureToThirds, thirdsToAperture);
	};
	var roundAperture = function (aperture) {
		return thirdsToAperture(apertureToThirds(aperture));
	};

	// Shutter speed
	var shutterToThirds = function (shutter) {
		return Math.round(Math.log(shutter) / Math.LN2 * 3);
	};
	var thirdsToShutter = function (thirds) {
		return Math.pow(2, thirds / 3);
	};
	var shutterRange = function (lowerBound, upperBound) {
		return xRange(lowerBound, upperBound, shutterToThirds, thirdsToShutter);
	};
	var roundShutter = function (shutter) {
		return thirdsToShutter(shutterToThirds(shutter));
	};

	// converts general property x to range, in thirds of a stop increments
	var xRange = function (lowerBound, upperBound, xToThirds, thirdsToX) {
		var range = [],
			thirds = xToThirds(lowerBound),
			currentX = thirdsToX(thirds);

		while (currentX <= upperBound) {
			range.push(currentX);
			thirds++;
			currentX = thirdsToX(thirds);
		}
		return range;		
	};
	
	// returns the current EV100, Exposure Value at ISO 100
	var EV = function (ISO, aperture, shutter) {
		return Math.log((100 * aperture * aperture) / (shutter * ISO)) / Math.LN2;
	};
	var EVToThirds = function (EV) {
		return Math.round(EV * 3);
	};
	var thirdsToEV = function (thirds) {
		return Math.round(100 * thirds / 3) / 100;
	};
	var roundEV = function (EV) {
		return thirdsToEV(EVToThirds(EV));
	};
	var EVRange = function (lowerBound, upperBound) {
		return xRange(lowerBound, upperBound, EVToThirds, thirdsToEV);
	};

	var lightScore = function (aperture, cropFactor) {
		return 10 + Math.log(1 / (aperture * aperture * cropFactor * cropFactor)) / Math.LN2;
	};

	return {
		ISOToThirds : ISOToThirds,
		thirdsToISO : thirdsToISO,
		ISORange : ISORange,
		roundISO : roundISO,

		apertureToThirds : apertureToThirds,
		thirdsToAperture : thirdsToAperture,
		apertureRange : apertureRange,
		roundAperture : roundAperture,
		
		shutterToThirds : shutterToThirds,
		thirdsToShutter : thirdsToShutter,
		shutterRange : shutterRange,
		roundShutter : roundShutter,

		EV : EV,
		roundEV : roundEV,
		EVRange : EVRange,

		lightScore : lightScore
	};
});

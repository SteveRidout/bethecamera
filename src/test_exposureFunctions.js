"use strict";

define(['src/exposureFunctions'], function (exposureFunctions) {
	module("exposureFunctions");

	test("convert to thirds and back", function () {
		equal(exposureFunctions.thirdsToISO(exposureFunctions.ISOToThirds(100)), 100, "ISO");
		equal(exposureFunctions.thirdsToISO(exposureFunctions.ISOToThirds(200)), 200, "ISO");
		equal(exposureFunctions.thirdsToISO(exposureFunctions.ISOToThirds(400)), 400, "ISO");
		equal(exposureFunctions.thirdsToAperture(exposureFunctions.apertureToThirds(1)), 1, "Aperture");
		equal(exposureFunctions.thirdsToAperture(exposureFunctions.apertureToThirds(1.4)), 1.4, "Aperture");
		equal(exposureFunctions.thirdsToAperture(exposureFunctions.apertureToThirds(2)), 2, "Aperture");
		equal(exposureFunctions.thirdsToShutter(exposureFunctions.shutterToThirds(1/64)), 1/64, "Shutter");
	});
});

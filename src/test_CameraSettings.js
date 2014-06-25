"use strict";

define(['src/CameraSettings'], function (CameraSettings) {
	module("cameraSettings");

	test("auto exposure", function () {
		var settings = new CameraSettings();

		// tests below expect a max aperture of f2
		settings.cameraSpec.lens = [
			{
				focalLength: 50,
				maxAperture: 2
			}
		];

		equal(settings.ISO, 800);
		equal(settings.aperture, 2);
		equal(settings.shutter, 1 / 16);

		var desc = "EV";
		equal(settings.EV(), 3, desc);

		settings.ISO *= 2;
		equal(settings.EV(), 2, desc);

		settings.shutter /= 4;
		equal(settings.EV(), 4, desc);

		settings.aperture *= 2;
		equal(settings.EV(), 6, desc);

		var roughlyEqual = function (actual, expected, description) {
			description = description || "";
			ok(Math.abs(actual - expected) < 0.015,
				description + ", actual: " + actual + ", expected: " + expected);
		};

		// roughly equal using log scale
		var roughlyEqualLog = function (actual, expected, description) {
			description = description || "";
			ok(Math.abs(Math.log(actual) - Math.log(expected)) / Math.LN2 < 0.015,
				description + ", actual: " + actual + ", expected: " + expected);
		};

		var checkScene = function (EV, ISO, aperture, shutter) {
			settings.calculate(EV, 50);

			roughlyEqual(settings.EV(), EV, "EV: " + EV + " matches");

			roughlyEqualLog(settings.ISO, ISO, "EV: " + EV + ", ISO: " + ISO);
			roughlyEqualLog(settings.aperture, aperture, "EV: " + EV + ", aperture: " + aperture);
			roughlyEqualLog(settings.shutter, shutter, "EV: " + EV + ", shutter: " + shutter);
		};

		checkScene(-5, 6400, 2, 2);
		checkScene(-4, 6400, 2, 1);
		checkScene(-3, 6400, 2, 1 / 2);
		checkScene(-2, 4850, 2, 0.33);
		checkScene( 2, 1600, 2, 1 / 16);
		checkScene( 7, 400, 2, 1 / 128);
		checkScene( 8, 200, 2, 1 / 128);
		checkScene( 9, 100, 2, 1 / 128);
		checkScene( 10, 100, 2, 1 / 256);
		checkScene( 11, 100, 2, 1 / 512);
		checkScene( 13, 100, 2, 1 / 2048);
		checkScene( 15, 100, 4, 1 / 2048);
		checkScene( 17, 100, 8, 1 / 2048);
		checkScene( 17, 100, 8, 1 / 2048);
		checkScene( 19, 100, 16, 1 / 2048);
		checkScene( 21, 100, 32, 1 / 2048);
	});
});

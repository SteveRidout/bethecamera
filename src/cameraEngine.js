"use strict";

define([], function () {
	var fastBlur = function (input, horizontalRadius, verticalRadius /* optional */) {
		var toHdr = new Array(256);

		// TODO: rename, not really contrast
		// lower number makes more pronounced bokeh
		var contrast = 32;

		for (var i=0; i<256; i++) {
			toHdr[i] = Math.pow(2, i/contrast);
		}

		if (typeof(verticalRadius) === "undefined") {
		   verticalRadius = horizontalRadius;
		}

		verticalRadius = Math.abs(verticalRadius);
		var radius = Math.floor(verticalRadius);
		var fraction = Math.round(16 * (verticalRadius - radius));

		var remainingFraction = 16 - fraction;

		var width = input.width;
		var height = input.height;

		var vBlur = document.createElement('canvas');
		vBlur.width = width;
		vBlur.height = height;
		
		var inputContext = input.getContext('2d');
		var vBlurContext = vBlur.getContext('2d');

		var inputImage = inputContext.getImageData(0, 0, width, height);
		var vBlurImage = vBlurContext.getImageData(0, 0, width, height);

		var invLog2 = 1.0 / Math.log(2);

		// vertical blur
		//
		// x         - the pixel we are currently calculating
		// boxTop    - the position of the top of the box (inc. fractional part)
		// boxBottom - the position of the bottom of the box (inc. fractional part)
		for (var x=0; x<width; x++) {
			var boxTop = 0;
			var boxBottom = -1;
			var boxR = 0;
			var boxG = 0;
			var boxB = 0;
			var boxA = 0;
			var alpha;
			var topFraction;
			var bottomFraction;
			for (var y=0; y<height; y++) {
				while ((boxBottom < y + radius + 1) && (boxBottom < height)) {
					if (boxBottom > -1) {
						// add the remaining part of the fraction
						alpha = inputImage.data[(x + width*boxBottom)*4 + 3] * remainingFraction;

						if (alpha > 0) {
							boxA += alpha;
							boxR += toHdr[inputImage.data[(x + width * boxBottom) * 4 + 0]] * alpha;
							boxG += toHdr[inputImage.data[(x + width * boxBottom) * 4 + 1]] * alpha;
							boxB += toHdr[inputImage.data[(x + width * boxBottom) * 4 + 2]] * alpha;
						}
					}
					boxBottom++;

					if (boxBottom < height) {
						// add the fractional part
						bottomFraction = fraction;
						alpha = inputImage.data[(x + width*boxBottom)*4 + 3] * fraction;
						if (alpha > 0) {
							boxA += alpha;
							boxR += toHdr[inputImage.data[(x + width * boxBottom) * 4 + 0]] * alpha;
							boxG += toHdr[inputImage.data[(x + width * boxBottom) * 4 + 1]] * alpha;
							boxB += toHdr[inputImage.data[(x + width * boxBottom) * 4 + 2]] * alpha;
						}
					} else {
						bottomFraction = 0;
					}
				}

				if (boxTop < y - radius - 1) {
					alpha = inputImage.data[(x + width*boxTop)*4 + 3];
					
					if (boxTop > 0) {
						topFraction = fraction;
						alpha *= fraction;
					} else {
						topFraction = 0;
						alpha *= 16;
					}

					if (alpha > 0) {
						boxA -= alpha;
						boxR -= toHdr[inputImage.data[(x + width*boxTop)*4 + 0]] * alpha;
						boxG -= toHdr[inputImage.data[(x + width*boxTop)*4 + 1]] * alpha;
						boxB -= toHdr[inputImage.data[(x + width*boxTop)*4 + 2]] * alpha;
					}
					boxTop++;

					alpha = inputImage.data[(x + width*boxTop)*4 + 3] * remainingFraction;
					if (alpha > 0) {
						boxA -= alpha;
						boxR -= toHdr[inputImage.data[(x + width*boxTop)*4 + 0]] * alpha;
						boxG -= toHdr[inputImage.data[(x + width*boxTop)*4 + 1]] * alpha;
						boxB -= toHdr[inputImage.data[(x + width*boxTop)*4 + 2]] * alpha;
					}
				}
			
				var boxSize = 16 * (boxBottom - boxTop - 1) + topFraction + bottomFraction;

				if (boxA > 0)
				{
					vBlurImage.data[(x + width*y)*4 + 0] =
						contrast * Math.log(boxR/boxA)*invLog2;
					vBlurImage.data[(x + width*y)*4 + 1] =
						contrast * Math.log(boxG/boxA)*invLog2;
					vBlurImage.data[(x + width*y)*4 + 2] =
						contrast * Math.log(boxB/boxA)*invLog2;
				}
				vBlurImage.data[(x + width*y)*4 + 3] = boxA / boxSize;
			}
		}

		var output = document.createElement('canvas');
		output.width = width;
		output.height = height;
		var outputContext = output.getContext('2d');
		var outputImage = outputContext.getImageData(0,0,width,height);

		horizontalRadius = Math.abs(horizontalRadius);
		radius = Math.floor(horizontalRadius);
		fraction = Math.round(16 * (horizontalRadius - radius));
		remainingFraction = 16 - fraction;
				
		// horizontal blur
		for (var y=0; y<height; y++)
		{
			var boxLeft = 0;
			var boxRight = -1;
			var boxR = 0;
			var boxG = 0;
			var boxB = 0;
			var boxA = 0;
			var alpha;
			var leftFraction;
			var rightFraction;
			for (var x=0; x<width; x++)
			{
				while ((boxRight < x + radius + 1) && (boxRight < width))
				{
					if (boxRight > -1) {
						// add the remaining part of the fraction
						alpha = vBlurImage.data[(boxRight + width * y) * 4 + 3] * remainingFraction;

						if (alpha > 0) {
							boxA += alpha;
							boxR += toHdr[vBlurImage.data[(boxRight + width * y) * 4 + 0]] * alpha;
							boxG += toHdr[vBlurImage.data[(boxRight + width * y) * 4 + 1]] * alpha;
							boxB += toHdr[vBlurImage.data[(boxRight + width * y) * 4 + 2]] * alpha;
						}
					}
					boxRight++;

					if (boxRight < width) {
						// add the fractional part
						rightFraction = fraction;
						alpha = vBlurImage.data[(boxRight + width * y) * 4 + 3] * fraction;
						if (alpha > 0) {
							boxA += alpha;
							boxR += toHdr[vBlurImage.data[(boxRight + width * y) * 4 + 0]] * alpha;
							boxG += toHdr[vBlurImage.data[(boxRight + width * y) * 4 + 1]] * alpha;
							boxB += toHdr[vBlurImage.data[(boxRight + width * y) * 4 + 2]] * alpha;
						}
					} else {
						rightFraction = 0;
					}
				}

				if (boxLeft < x - radius - 1)
				{
					alpha = vBlurImage.data[(boxLeft + width*y)*4 + 3];
					
					if (boxLeft > 0) {
						leftFraction = fraction;
						alpha *= fraction;
					} else {
						leftFraction = 0;
						alpha *= 16;
					}

					if (alpha > 0) {
						boxA -= alpha;
						boxR -= toHdr[vBlurImage.data[(boxLeft + width*y)*4 + 0]] * alpha;
						boxG -= toHdr[vBlurImage.data[(boxLeft + width*y)*4 + 1]] * alpha;
						boxB -= toHdr[vBlurImage.data[(boxLeft + width*y)*4 + 2]] * alpha;
					}
					boxLeft++;

					alpha = vBlurImage.data[(boxLeft + width*y)*4 + 3] * remainingFraction;
					if (alpha > 0) {
						boxA -= alpha;
						boxR -= toHdr[vBlurImage.data[(boxLeft + width*y)*4 + 0]] * alpha;
						boxG -= toHdr[vBlurImage.data[(boxLeft + width*y)*4 + 1]] * alpha;
						boxB -= toHdr[vBlurImage.data[(boxLeft + width*y)*4 + 2]] * alpha;
					}
				}
			
				var boxSize = 16 * (boxRight - boxLeft - 1) + leftFraction + rightFraction;

				if (boxA > 0)
				{
					outputImage.data[(x + width*y)*4 + 0] = contrast * Math.log(boxR/boxA)*invLog2;
					outputImage.data[(x + width*y)*4 + 1] = contrast * Math.log(boxG/boxA)*invLog2;
					outputImage.data[(x + width*y)*4 + 2] = contrast * Math.log(boxB/boxA)*invLog2;
				}
				outputImage.data[(x + width*y)*4 + 3] = boxA / boxSize;
			}
		}

		outputContext.putImageData(outputImage, 0, 0);
		return output;
	};

	// transforms from low-contrast HDR to high-contrast image
	// (assumes hdrImageData and outputContext are the same dimensions)
	var drawPhoto = function(hdrImageData, outputContext, EV, noise, multiplier) {
		var outputImageData = outputContext.getImageData(0,0,hdrImageData.width,hdrImageData.height);

		var dynamicRange = 9; // num stops assumed to be in output image
		var logGain = - 128 * (multiplier - 1) + 256 * EV / dynamicRange;

		var limit = false;
		if ($.browser.opera)
		{
			limit = true;
		}

		var or, og, ob,
			orSmall, ogSmall, obSmall,
			r, g, b;

		console.time("loop");
		// Loop through data.
		for (var i = 0; i < hdrImageData.width * hdrImageData.height * 4; i+=4)
		{
			r = multiplier * hdrImageData.data[i];
			g = multiplier * hdrImageData.data[i+1];
			b = multiplier * hdrImageData.data[i+2];

			r -= noise * (Math.random() - 0.5);
			g -= noise * (Math.random() - 0.5);
			b -= noise * (Math.random() - 0.5);

			// Note: using Math.min and Math.max here took about 80ms
			// extra per 600x400 image 
			if (limit) {
				outputImageData.data[i  ] = Math.max(0, Math.min(255, r + logGain));
				outputImageData.data[i+1] = Math.max(0, Math.min(255, g + logGain));
				outputImageData.data[i+2] = Math.max(0, Math.min(255, b + logGain));
				outputImageData.data[i+3] = hdrImageData.data[i+3];
			}
			else {
				outputImageData.data[i  ] = r + logGain;
				outputImageData.data[i+1] = g + logGain;
				outputImageData.data[i+2] = b + logGain;
				outputImageData.data[i+3] = hdrImageData.data[i+3];
			}
		}
		console.timeEnd("loop");
		outputContext.putImageData(outputImageData, 0, 0);
	};

	return {
		drawPhoto : drawPhoto,
		fastBlur : fastBlur
	};
});

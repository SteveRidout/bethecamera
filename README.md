Be The Camera
===========

Realtime HTML5 Camera Simulation

Deploying for Development
-------------------------

This is a completely static site so:

1. Clone this repo.
2. Point your favourite static web server, e.g. NGINX or Apache, to the checked out directory.
3. Ensure caching is switched off in your web browser when making changes.

Deploying for Production
------------------------

To build an version with cache-busters on the URLs and optimised javascript:

1. Install Node JS.
2. Run `./build.sh`. This will generate a sibling `bethecamera.com` directory with the built version of the site.
3. Point your web server to the `bethecamera.com` directory.


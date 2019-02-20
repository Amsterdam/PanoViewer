# Panorama Viewer

A javascript library to view Amsterdam muncipality panorama images.

## Installing

You can download the [latest version](https://panoviewer.data.amsterdam.nl/dist/panoviewer.js). The library is released in 2 versions:
- Complete
- Core

Each version is also available in a minimized version.

### Complete
The complete release contains everything needed to integrate the panoviewer with your code base. This release has Marzipano included.

### Core
Does not include the dependecies. If your implementation already has Marzipano included, this is a better option.

## Integrating in your project
To show the viewer, it needs to be init and given a location

	const pv = new PanoViewer('#element_id');
	pv.loadPanorama(lat, lon);

where `element_id` is the id of the dom element the viewer will be attached to and lat and lon are the latitude and longtitude for the initial panorama location.

### Supported callbacks

- change: triggerd when the pov changes with `{ yaw, pitch, fov }` as parameter
- location : triggered after the location is changed,
  not generated via event listenenr
  called with `{ date, lat, lon }` as parameter

## Demo application
There is a demo implemetation available on the [Amsterdam data portal](https://panoviewer.data.amsterdam.nl).

### Running the Demo locally
To run the demo locally, the code need to be checked out an built. The build process is based on `npm`. See Technology Stack for more details.

	git clone git@github.com:Amsterdam/PanoViewer.git
	cd PanoViewer
	npm install
	npm run build
	npm start

Once the distribution has been built locally go to the demo directory and open the `index.html` file in your browser

### Development

	npm start

* the development version is in localhost:3002/test
* hot reloading is enabled

### Run the release version in docker
	docker-compose up --build
* go to localhost:5002/demo


## Technology Stack
Buidling the distribuition code is done by [webpack](webpack.js.org). [Babel](https://babeljs.io) is used to transpile the code from ES6 to ES5. All this is built on top of [npm](https://www.npmjs.com).

The PanoViewer library is built on top of [Marzipano](http://www.marzipano.net).

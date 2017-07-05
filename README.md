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

The PanoViewer accepts one of the following as the dom element identifier:

- A dom element
- An dom element identifier (with or without a hash)
- A class name (with or without the dot)

When a string is passed without a has or a dot, the PanoViewer tries to retrieve an element with that identifer. If it fails, it then attempts 
### Supported callbacks

- active
- inactive
- change ?
- location : triggered by location change, not generated via event listenenr
## Demo application
There is a demo implemetation available on the [Amsterdam data portal](https://panoviewer.data.amsterdam.nl).

### Running the Demo locally
To run the demo locally, the code need to be checked out an built. The build process is based on `npm`. See Technology Stack for more details.

	git clone git@github.com:DatapuntAmsterdam/PanoViewer.git
	cd PanoViewer
	npm install
	npm run build

Once the distribution has been built locally move to the demo directory and open the `index.html` file in your browser

## Technology Stack
Buidling the distribuition code is done by [webpack](webpack.js.org). [Babel](https://babeljs.io) is used to transpile the code from ES6 to ES5. All this is built on top of [npm](https://www.npmjs.com).

The PanoViewer library is built on top of [Marzipano](http://www.marzipano.net).

### Supported callbacks

- active
- inactive
- change ?

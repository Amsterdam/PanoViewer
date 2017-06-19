
function PanoViewer (opts) {
    const self = this;
    // Default Configuration
    const config = {
        API_ROOT: 'https://acc.api.data.amsterdam.nl/',
        PANO_URI: 'panorama/recente_opnames/alle/',
        RADIUS: 100,
        FOV: 80,
        MAX_FOV: 90,
        MAX_RESOLUTION: 12 * 1024,
        CAMERA_HEIGHT: 1.8,
        LEVEL_PROPERTIES_LIST: [
            {tileSize: 256, size: 256, fallbackOnly: true},
            {tileSize: 512, size: 512},
            {tileSize: 512, size: 1024},
            {tileSize: 512, size: 2048}
        ],
        ADD_CALLBACKS: false,  // Wether to add callbacks on changes
        CALLBACKS: {
            'active': console.log,
            'inactive': console.log
        }
    };

    const viewerOpts = {
        controls: {
            mouseViewMode: 'drag'    // drag|qtvr
        },
        stageType: null,
        stage: {
            preserveDrawingBuffer: true
        }
    };
    const degree_to_radian = Math.PI / 180;
    let viewer, view, scene;  // Will contain the viewer

    const loadScene = function (heading, pitch, fov, data) {
        const image = data.image;
        const hotspots = data.hotspots;
        try {
            const source = Marzipano.ImageUrlSource.fromString(
                image.pattern, {cubeMapPreviewUrl: image.preview}
            );
            const viewLimiter = Marzipano.RectilinearView.limit.traditional(
                config.MAX_RESOLUTION,
                degree_to_radian * config.MAX_FOV
            );

            view = new Marzipano.RectilinearView({}, viewLimiter);
            console.log(view);
            scene = viewer.createScene({
                source: source,
                geometry: new Marzipano.CubeGeometry(config.LEVEL_PROPERTIES_LIST),
                view: view,
                pinFirstLevel: true
            });

            self.addHotspots(hotspots, scene);
            view.setYaw(degree_to_radian * heading);
            view.setPitch(degree_to_radian * pitch);
            view.setFov(degree_to_radian * fov);

            scene.switchTo();

            // Adding event handling
            viewer.controls().addEventListener('active', function(evt, elem, bla) {
                const parameters = view.parameters();
                console.log('active', parameters);
            });
            viewer.controls().addEventListener('inactive', function(evt, elem, bla) {
                console.log('inactive', evt, elem, bla);
            });
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * Initialize the Marzipano viewer.
     * init is used to determine the insertion point
     */
    function init (insertion) {
        const panoElement = self.getElement(insertion);
        if (!panoElement) {
            // @TODO Error handling
            return 'ERROR!';
        }
        viewer = new Marzipano.Viewer(panoElement, viewerOpts);
    };

    /**
     * 
     * @param {float} lat - Latitude 
     * @param {float} lon - Longtitude
     * @param {int} cappedRadius - Max search radius (optional)
     * @param {float} heading - initial heading (optional)
     * @param {float} pitch - initial pitch (optional)
     * @param {float} fov - Field of vision (optional)
     * 
     * This is the main api interaction for loading the panorama view.
     * After this has been called navigating within the panorama via hotspots
     * is handled by FUNCTION_NAME
     */
    function loadPanorama (lat, lon, cappedRadius, heading, pitch, fov) {
        const url = config.API_ROOT + config.PANO_URI + '?lat=' +
                lat+ '&lon=' + lon + '&radius=' + config.RADIUS;

        // Setting defaults if not given
        fov = fov || config.FOV;
        heading = heading || 0;
        pitch = pitch || 0;

        return (self.getPanoramaData(url))
            .then(loadScene.bind(null, heading, pitch, fov));
    };

    const updatePanorama = function (pano_id) {
        const url = config.API_ROOT + config.PANO_URI + pano_id;

        const fov = 80,
            heading = 0,
            pitch = 0;
        return (self.getPanoramaData(url))
            .then(loadScene.bind(null, heading, pitch, fov));
    };

    function updateConfig (opts) {
        // @TODO only support certian known keys and handle then carefully
        for (opt of opts) {
            config[opt] = opts[opt];
        }
        // Finally adding callbacks if it is set to on
        if (config.ADD_CALLBACKS) {
            addCallbacks();
        }
    };

    function getConfigInfo (field) {
        return config[field];
    }

    function addCallbacks() {
        for (evt of config.CALLBACKS) {
            viwer.controls().addEventListener(evt, function() {
                const parameters = view.parameters();
                config.CALLBACKS[evt](parameters);
            })
        }
    }
    // Making sure opts is defined
    opts = opts || {};

    // Opening the API
    self.init = init;
    self.loadPanorama = loadPanorama;
    self.updatePanorama = updatePanorama;
    self.updateConfig = updateConfig;
    self.getConfigInfo = getConfigInfo;
}

PanoViewer.prototype = {
    isNumeric: function (obj) {
        return !isNaN(obj - parseFloat(obj));
    },
    getCenter: function (geoJSON) {
        const xValues = [],
            yValues = [];

        if (geoJSON.type === 'Point') {
            xValues.push(geoJSON.coordinates[0]);
            yValues.push(geoJSON.coordinates[1]);
        } else {
            getCoordinates(geoJSON.coordinates);
        }

        xValues.sort();
        yValues.sort();
        const  xMin = xValues[0],
            yMin = yValues[0],
            xMax = xValues[xValues.length - 1],
            yMax = yValues[yValues.length - 1];

        return [
            xMin + (xMax - xMin) / 2,
            yMin + (yMax - yMin) / 2
        ];

        function getCoordinates (coordinates) {
            const isCoordinate = coordinates.length === 2 &&
                this.isNumeric(coordinates[0]) && this.isNumeric(coordinates[1]);

            if (isCoordinate) {
                xValues.push(coordinates[0]);
                yValues.push(coordinates[1]);
            } else {
                // We have to go deeper recursively; two levels for Polygons, three levels for MultiPolygons
                coordinates.forEach(getCoordinates);
            }
        }
    },
    /**
     * Returns a dom element to insert the panorama viewer
     * supports DOM element, id and class both as name or
     * with # / . notation before. If no element could be
     * found returns undefined
     */
    getElement: function (insertion) {
        let element;
        // If its already a dom element its all good
        if (insertion) {
            if (insertion instanceof HTMLElement) {
                return insertion;
            }
            // checking if # or . is used
            if (insertion[0] === '#') {
                return document.getElementById(insertion.slice(1));
            } else if (insertion[0] === '.') {
                return document.getElementsByClassName(insertion.slice(1))[0];
            }
            // Trying id
            element = document.getElementById(insertion);
        }
        // If found return it, otherwise go with class name
        return (element)? element : document.getElementsByClassName(insertion)[0];
    },
    getPanoramaData: function(url) {
        const self = this;
        return self.getImage(url)
            .then(self.updatePanoData.bind(self));
    },
    updatePanoData: function(response) {
        const formattedGeometrie = {
            coordinates: [
                response.geometrie.coordinates[1],
                response.geometrie.coordinates[0]
            ],
            type: response.geometrie.type
        };
        const data = {
            date: new Date(response.timestamp),
            id: response.pano_id,
            hotspots: response.adjacent.map(function (item) {
                return {
                    id: item.pano_id,
                    heading: item.heading,
                    distance: item.distance,
                    year: item.year
                };
            }),
            location: this.getCenter(formattedGeometrie),
            image: response.image_sets.cubic
        };
        return {
            image: data.image,
            heading: response.heading,
            pitch: response.pitch,
            hotspots: data.hotspots
        }
    },
    getImage: function (url) {
        return new Promise(function (resolve, reject) {
            const request = new XMLHttpRequest();
            request.open('GET', url);
            request.onload = function() {
                if (request.status === 200) {
                    try {
                        response = JSON.parse(request.responseText);
                        resolve(response);
                    } catch (e) {
                        reject(Error(e) + request.responseText);
                    }
                } else {
                    reject(Error('API call returned error code:' + request.statusText));
                }
            };
            // Handling total request failure
            request.onerror = function() {
                reject(Error('There was a network error.'));
            };
            // Send the request
            request.send();
        });
    },
    addHotspots: function (hotspots, scene) {
        const self = this;
        const container = scene.hotspotContainer();
        try {
        hotspots.sort(function (hotspotA, hotspotB) {
                return hotspotB.distance - hotspotA.distance;
            }).forEach(function (hotspot) {
                hs = new Hotspot()
                hs.init(hotspot.id, self.getConfigInfo('CAMERA_HEIGHT'), hotspot.distance, hotspot.heading, hotspot.year);
                hs.element.firstChild.addEventListener('click', function () {
                    self.updatePanorama(hotspot.id);
                });
                container.createHotspot(hs.element, hs.position);
            }
        );
        } catch (e) {
            console.log(e);
        }
    }
}

function Hotspot() {
    const self = this;

    self.hotspotNodeType = 'div';
    self.scaleToDistance = true;
    self.pitchCorrection = Math.PI / 180 / 2;
    self.scale = '';

    function init(hotspotId, cameraHeight, distance, heading, year, hotspotNodeType, scaleToDistance) {
        // @TODO add sanity checks
        self.id = hotspotId;
        self.cameraHeight = cameraHeight;
        self.distance = distance;
        self.year = year;
        self.pitch = self.calculateHotspotPitch(cameraHeight, distance);
        self.position = {
            yaw: heading * Math.PI / 180,
            pitch: self.pitch
        };
        self.hotspotNodeType = hotspotNodeType || self.hotspotNodeType;
        self.scaleToDistance = scaleToDistance || self.scaleToDistance;
        // Create the element
        self.createDomElement();
    }

    function createDomElement () {
        const self = this;
        const element = document.createElement(self.hotspotNodeType);
        element.setAttribute('class', 'c-panoviewer-hotspot');
        element.setAttribute('scene-id', self.id);
        element.setAttribute('distance', self.distance);
        element.setAttribute('pitch', self.pitch);
        element.setAttribute('year', self.year);
        const innerDiv = document.createElement('button');
        innerDiv.setAttribute('class', 'c-panoviewer-hotspot__content')
        // Scale size if needed
        if (self.scaleToDistance) {
            const angle = Math.PI / 2 -  self.pitch - (self.pitchCorrection * self.distance);
            rotate = 'rotateX(' + angle + 'rad)';
            scale = 'scale(' + 10.0 / (self.distance) + ')';
            innerDiv.setAttribute('style', 'transform: '+ rotate + ' ' + scale + ';');
            element.appendChild(innerDiv);
        } else {
            console.log('No scaling needed');
        }
        self.element = element;
    }

    self.init = init;
    self.createDomElement = createDomElement;
}

Hotspot.prototype = {
    /**
     * Calculates the pitch to the hotspot based on the camera
     * height and the distance to the hotspot
     */
    calculateHotspotPitch: (cameraHeight, distance) => {
        return Math.atan(cameraHeight / distance);
    },
    render: () => {
        const self = this;
        if (!self.element) {
            self.createDomElement();
        }
        if (self.outerHTML) {
            return self.outerHTML;
        } else {
            console.log('Need manual rendereing');
        }
    }
}
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = PanoViewer;

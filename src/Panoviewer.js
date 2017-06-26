
import Marzipano from 'Marzipano';
import {getCenter, getElement, degree_to_radian} from './utils';
import Hotspot from './Hotspot';


// Default Configuration
const config = {
    API_ROOT: 'https://acc.api.data.amsterdam.nl/',
    PANO_URI: 'panorama/recente_opnames/alle/',
    RADIUS: 100,
    FOV: 80 * degree_to_radian,
    MAX_FOV: 90,
    MAX_RESOLUTION: 12 * 1024,
    CAMERA_HEIGHT: 1.8,
    LEVEL_PROPERTIES_LIST: [
        {tileSize: 256, size: 256, fallbackOnly: true},
        {tileSize: 512, size: 512},
        {tileSize: 512, size: 1024},
        {tileSize: 512, size: 2048}
    ],
    ADD_CALLBACKS: false,  // Whether to add callbacks on changes
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


class PanoViewer {

    constructor(insertion, opts) {
        this.view = null;
        this.scene = null;
        this.pov = {
            fov: config.FOV,
            yaw: 0,
            pitch: 0
        }

        const panoElement = getElement(insertion);
        if (!panoElement) {
            // @TODO Error handling
            return 'ERROR!';
        }
        this.viewer = new Marzipano.Viewer(panoElement, viewerOpts);

        // If configuration options are given, update the config
        if (opts) {
            this.updateConfig(opts);
        }
    }

    _loadScene (data) {
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

            this.view = new Marzipano.RectilinearView(
                this.pov,
                viewLimiter);

            this.scene = this.viewer.createScene({
                source: source,
                geometry: new Marzipano.CubeGeometry(config.LEVEL_PROPERTIES_LIST),
                view: this.view,
                pinFirstLevel: true
            });

            this._addHotspots(hotspots);

            // Tracking the POV changes
            this.viewer.controls().addEventListener('inactive', () => {
                 this.pov = this.view.parameters();
             });
            this.scene.switchTo();
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * 
     * @param {float} lat - Latitude 
     * @param {float} lon - Longtitude
     * @param {float} yaw - initial yaw (optional)
     * @param {float} pitch - initial pitch (optional)
     * @param {float} fov - Field of vision (optional)
     * 
     * This is the main api interaction for loading the panorama view.
     * After this has been called navigating within the panorama via hotspots
     * is handled by FUNCTION_NAME
     */
    loadPanorama (lat, lon, yaw, pitch, fov) {
        const url = config.API_ROOT + config.PANO_URI + '?lat=' +
                lat+ '&lon=' + lon + '&radius=' + config.RADIUS;

        // Updating POV if needed
        this.pov.fov = fov || this.pov.fov;
        this.pov.yaw = yaw || this.pov.yaw;
        this.pov.pitch = pitch || this.pov.pitch;
        return (this.constructor._getPanoramaData(url))
            .then((data) => this._loadScene(data));
    };

    _updatePanorama (pano_id) {
        const url = config.API_ROOT + config.PANO_URI + pano_id;

        return (this.constructor._getPanoramaData(url))
            .then((data) => this._loadScene(data));
    };

    updateConfig (opts) {
        // @TODO only support certian known keys and handle then carefully
        for (opt of opts) {
            config[opt] = opts[opt];
        }
        // Finally adding callbacks if it is set to on
        if (config.CALLBACKS) {
            this._addCallbacks();
        }
    };

    _addHotspots (hotspots) {
        const container = this.scene.hotspotContainer();
        let hs;
        try {
            hotspots.sort(function (hotspotA, hotspotB) {
                return hotspotB.distance - hotspotA.distance;
            }).forEach((hotspot) => {
                hs = new Hotspot(hotspot.id, config.CAMERA_HEIGHT, hotspot.distance, hotspot.yaw, hotspot.year)
                hs.element.firstChild.addEventListener('click', () => this._updatePanorama(hotspot.id));
                container.createHotspot(hs.element, hs.position);
            }
        );
        } catch (e) {
            console.log(e);
        }
    }

    _addCallbacks() {
        for (evt of config.CALLBACKS) {
            this.viewer.controls().addEventListener(evt, function() {
                const parameters = view.parameters();
                config.CALLBACKS[evt](parameters);
            })
        }
    }
  
    static _getPanoramaData (url) {
        return this._getImage(url)
            .then(this._updatePanoData);
    }

    static _updatePanoData (response) {
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
                    yaw: item.heading,
                    distance: item.distance,
                    year: item.year
                };
            }),
            location: getCenter(formattedGeometrie),
            image: response.image_sets.cubic
        };
        return {
            image: data.image,
            yaw: response.yaw,
            pitch: response.pitch,
            hotspots: data.hotspots
        }
    }

    static _getImage (url) {
        return new Promise(function (resolve, reject) {
            const request = new XMLHttpRequest();
            request.open('GET', url);
            request.onload = function() {
                if (request.status === 200) {
                    try {
                        const response = JSON.parse(request.responseText);
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
    }
}

export default PanoViewer;

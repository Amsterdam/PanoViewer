import Marzipano from 'marzipano';
import {getCenter, getElement, degreeToRadian} from './utils';
import Hotspot from './hotspot';


// Default Configuration
const config = {
    API_ROOT: 'https://acc.api.data.amsterdam.nl/',
    PANO_URI: 'panorama/recente_opnames/alle/',
    RADIUS: 100,
    FOV: 80 * degreeToRadian,
    MAX_FOV: 90,
    MAX_RESOLUTION: 12 * 1024,
    CAMERA_HEIGHT: 1.8,
    LEVEL_PROPERTIES_LIST: [
        {tileSize: 256, size: 256, fallbackOnly: true},
        {tileSize: 512, size: 512},
        {tileSize: 512, size: 1024},
        {tileSize: 512, size: 2048}
    ],
    CALLBACKS: null
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
            return Error('No dom element available');
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
                degreeToRadian * config.MAX_FOV
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

            // Finally adding callbacks if it is set to on
            if (config.CALLBACKS) {
                this._addCallbacks();
            }
            // Tracking the POV changes
            this.view.addEventListener('change', () => {
                 this.pov = this.view.parameters();
             });
            this.scene.switchTo();
        } catch (e) {
            console.error(`Error Loading scene: ${e}`);
        }
    }

    /**
     *
     * @param {float} lat - Latitude
     * @param {float} lon - Longtitude
     * @param {float} [yaw] - initial yaw
     * @param {float} [pitch] - initial pitch
     * @param {float} [fov] - Field of vision
     *
     * This is the main api interaction for loading the panorama view.
     * After this has been called navigating within the panorama via hotspots
     * is handled by _updatePanorama
     */
    loadPanorama (lat, lon, yaw, pitch, fov) {
        const url = `${config.API_ROOT + config.PANO_URI}?lat=${lat}&lon=${lon}&radius=${config.RADIUS}`;

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
        // @TODO Handle value carefully
        for (let opt of Object.keys(config)) {
            if (opts[opt]) {
                config[opt] = opts[opt];
            }
        }
    };

    _addHotspots (hotspots) {
        const container = this.scene.hotspotContainer();
        let hs;
        try {
            hotspots.sort((hotspotA, hotspotB) => {
                return hotspotB.distance - hotspotA.distance;
            }).forEach((hotspot) => {
                hs = new Hotspot(hotspot.id, config.CAMERA_HEIGHT, hotspot.distance, hotspot.yaw, hotspot.year)
                hs.element.firstChild.addEventListener('click', () => this._updatePanorama(hotspot.id));
                container.createHotspot(hs.element, hs.position);
            });
        } catch (e) {
            console.error(`Failed to init hotspots: ${e}`);
        }
    }

    _addCallbacks() {
        let eventRegister = null;
        for (let evt of Object.keys(config.CALLBACKS)) {
            if (evt === 'active' || evt === 'inactive') {
                eventRegister = this.viewer.controls();
            } else if (evt !== 'location') {
                eventRegister = this.view;
            } else {
                eventRegister = null;
            }
            if (eventRegister) {
                eventRegister.addEventListener(evt, () => {
                    const parameters = this.view.parameters();
                    config.CALLBACKS[evt](parameters);
                });
            }
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
            hotspots: response.adjacent.map((item) => {
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

        // Call location change callback, if one is given
        if (config.CALLBACKS && config.CALLBACKS.location) {
            const location = {
                date: data.date,
                lat: data.location[0],
                lon: data.location[1]
            };
            config.CALLBACKS.location(location);
        }

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
            // Make sure the browser does not set this to `text/html`
            // implicitly
            request.setRequestHeader('Accept', '*/*');
            request.onload = () => {
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
            request.onerror = () => {
                reject(Error('There was a network error.'));
            };
            // Send the request
            request.send();
        });
    }
}

export default PanoViewer;

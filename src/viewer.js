import { getElement, degreeToRadian } from './utils';
import {
    PANORAMA_CONFIG, getImageDataByLocation, getImageDataById
} from './services/panorama-api/panorama-api';
import { loadScene, initialize } from './services/marzipano/marzipano';

const config = {
    ...PANORAMA_CONFIG,
    FOV: 80 * degreeToRadian,
}

const _config = {
    API_ROOT: 'https://acc.api.data.amsterdam.nl/',
    PANO_URI: 'panorama/recente_opnames/alle/',
    RADIUS: 100,
    MAX_FOV: 90,
    MAX_RESOLUTION: 12 * 1024,
    CAMERA_HEIGHT: 1.8,
    LEVEL_PROPERTIES_LIST: [
        { tileSize: 256, size: 256, fallbackOnly: true },
        { tileSize: 512, size: 512 },
        { tileSize: 512, size: 1024 },
        { tileSize: 512, size: 2048 }
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
        this.tags = null;

        const panoElement = getElement(insertion);
        if (!panoElement) {
            return Error('No dom element available');
        }
        this.viewer = initialize(panoElement, viewerOpts);

        // If configuration options are given, update the config
        if (opts) {
            this.updateConfig(opts);
        }
    }

    _loadScene(data) {
        try {
            const image = data.image;
            const hotspots = data.hotspots;
            const { heading, pitch, fov } = this.pov;
            const click = () => {console.log('click');}
            loadScene(this.viewer, click, image, heading, pitch, fov, hotspots);
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
    loadPanorama(lat, lon, tags, yaw, pitch, fov) {
        // Updating POV if needed
        this.pov.fov = fov || this.pov.fov;
        this.pov.yaw = yaw || this.pov.yaw;
        this.pov.pitch = pitch || this.pov.pitch;
        this.tags = tags || this.tags;
        const location = [lat, lon];
        return (getImageDataByLocation(location, this.tags))
            .then((data) => this._loadScene(data));
    };

    _updatePanorama(panoId) {
        return (getImageDataById(panoId, this.tags))
            .then((data) => this._loadScene(data));
    };

    updateConfig(opts) {
        // @TODO Handle value carefully
        for (let opt of Object.keys(config)) {
            if (opts[opt]) {
                config[opt] = opts[opt];
            }
        }
    };
}

export default PanoViewer;

import { getElement } from './utils';
import {
  getImageDataByLocation,
  getImageDataById
} from './services/panorama-api/panorama-api';
import { loadScene, initialize } from './services/marzipano/marzipano';
import { radiansToDegrees } from './services/angle-conversion/angle-conversion';

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

  constructor(elementId) {
    this.pov = {
      fov: 80,
      yaw: 0,
      pitch: 0
    }
    this.tags = null;
    this.events = null;
    this.registeredEvents = [];

    const panoElement = getElement(elementId);
    if (!panoElement) {
      return Error('No dom element available');
    }
    this.viewer = initialize(panoElement, viewerOpts);

    this._loadScene = this._loadScene.bind(this);
    this._updatePanorama = this._updatePanorama.bind(this);
    this._updateLocation = this._updateLocation.bind(this);
    this._bindEvents = this._bindEvents.bind(this);
    this._unbindEvents = this._unbindEvents.bind(this);
  }

  _loadScene(data) {
    try {
      const image = data.image;
      const hotspots = data.hotspots;
      const { yaw, pitch, fov } = this.pov;
      const onClick = this._updatePanorama;
      this._unbindEvents();
      const scene = loadScene(this.viewer, onClick, image, yaw, pitch, fov, hotspots);
      const view = scene.view();
      this._updateLocation(data);
      this._bindEvents(view);
    } catch (e) {
      console.error(`Error Loading scene: ${e}`);
    }
  }

  _updateLocation(data) {
    const location = {
      date: data.date,
      lat: data.location[0],
      lon: data.location[1]
    };
    if (this.events && this.events.location) {
      this.events.location(location);
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

  _updatePanorama(panoId, tags) {
    this.tags = tags || this.tags;
    return (getImageDataById(panoId, this.tags))
      .then((data) => this._loadScene(data));
  };

  setEvents(events) {
    this.events = events;
  }

  _unbindEvents() {
    this.registeredEvents.forEach((event) => {
      event.target.removeEventListener(event.name, event.handler);
      console.log('unregister', event);
    })
    this.registeredEvents = [];
  }

  _bindEvents(view) {
    const updatePov = () => {
      const pov = view.parameters();
      this.pov = {
        yaw: radiansToDegrees(pov.yaw),
        pitch: radiansToDegrees(pov.pitch),
        fov: radiansToDegrees(pov.fov)
      };
    }

    for (let evt of Object.keys(this.events)) {
      let eventRegister = null;
      const handleEvent = () => {
        const parameters = view.parameters();
        this.events[evt](parameters);
      };

      switch (evt) {
        case 'active':
        case 'inactive':
        eventRegister = this.viewer.controls();
        this.registeredEvents.push({ target: eventRegister, name: evt, handler: handleEvent });

        break;
        case 'change':
        eventRegister = view;
        this.registeredEvents.push({ target: eventRegister, name: evt, handler: updatePov });
        this.registeredEvents.push({ target: eventRegister, name: evt, handler: handleEvent });
        break;

      }
    }

    this.registeredEvents.forEach((event) => {
      event.target.addEventListener(event.name, event.handler);
      console.log('register', event);
    })
  }


}

export default PanoViewer;

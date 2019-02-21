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
      yaw: 0,
      pitch: 0,
      fov: 80
    }
    this.tags = ['mission-bi'];
    this.eventCallbacks = null;
    this.registeredEvents = [];

    const panoElement = document.getElementById(elementId);
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
  loadPanorama(lat, lon, tags = this.tags,
    yaw = this.pov.yaw,
    pitch = this.pov.pitch,
    fov = this.pov.fov
  ) {

    // Updating POV if needed
    this.pov = { yaw, pitch, fov };
    const location = [lat, lon];
    console.log('load', tags);
    return (getImageDataByLocation(location, tags))
      .then((data) => this._loadScene(data));
  };

  setEventCallbacks(eventCallabacks) {
    this.eventCallbacks = eventCallabacks;
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
    if (this.eventCallbacks && this.eventCallbacks.location) {
      this.eventCallbacks.location(location);
    }
  }

  _updatePanorama(panoId) {
    return (getImageDataById(panoId, this.tags))
      .then((data) => this._loadScene(data));
  };

  _unbindEvents() {
    this.registeredEvents.forEach((event) => {
      event.target.removeEventListener(event.name, event.handler);
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

    for (let evt of Object.keys(this.eventCallbacks)) {
      let eventRegister = null;
      const handleEvent = () => {
        const parameters = view.parameters();
        this.eventCallbacks[evt](parameters);
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
    })
  }
}

export default PanoViewer;

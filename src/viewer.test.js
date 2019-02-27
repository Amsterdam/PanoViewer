import {
  getImageDataByLocation,
  getImageDataById
} from './shared-atlas/panorama-api/panorama-api';
import * as marzipanoService from './shared-atlas/marzipano/marzipano';
import { radiansToDegrees } from './shared-atlas/angle-conversion/angle-conversion';

import PanoViewer from './viewer';

jest.mock('marzipano');
jest.mock('./shared-atlas/panorama-api/panorama-api');

describe('The viewer', () => {
  describe('The constructor', () => {

    it('should create correctly', () => {

      global.document.getElementById = () => document.createElement('div');

      const panoviewer = new PanoViewer('panoId');
      expect(panoviewer).toMatchSnapshot();
    });

    it('should return error when the element is not found ', () => {

      global.document.getElementById = () => null;

      const panoviewer = new PanoViewer('panoId');
      expect(panoviewer).toMatchSnapshot();
    });
  });

  describe('The methods', () => {
    let panoviewer;
    let eventCallbacks;
    const targetElement = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }

    beforeEach(() => {
      global.document.getElementById = () => document.createElement('div');

      panoviewer = new PanoViewer('panoId');
      eventCallbacks = {
        active: jest.fn(),
        inactive: jest.fn(),
        location: jest.fn(),
        change: jest.fn(),
      }
      panoviewer.setEventCallbacks(eventCallbacks);
      panoviewer.viewer.controls = jest.fn(() => targetElement);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should set the eventCallbacks', () => {
      expect(panoviewer.eventCallbacks).toEqual(eventCallbacks);
    });

    describe('loadPanorama', () => {
      const resultMock = { location: [1, 2] };
      let _loadScene;

      beforeEach(() => {
        _loadScene = jest.spyOn(panoviewer, '_loadScene');
        _loadScene.mockImplementation(() => { });

        getImageDataByLocation.mockImplementation(() => Promise.resolve(resultMock));

      });

      it('should load the panorams without tags', () => {
        panoviewer.tags = ['test'];
        const promise = panoviewer.loadPanorama(5, 5).then((data) => {
          expect(getImageDataByLocation).toHaveBeenCalledWith([5, 5], ['test']);
          expect(_loadScene).toHaveBeenCalledWith(resultMock);
        });
        return promise;
      });

      it('should load the panorama with tags', () => {
        const promise = panoviewer.loadPanorama(10, 10, ['tags']).then((data) => {
          expect(getImageDataByLocation).toHaveBeenCalledWith([10, 10], ['tags']);
          expect(_loadScene).toHaveBeenCalledWith(resultMock);
        });
        return promise;
      });
    });

    describe('_loadScene', () => {
      const povMock = { yaw: 1, pitch: 2, fov: 3 };
      let viewMock;
      let sceneMock;
      let loadScene;

      beforeEach(() => {
        viewMock = {
          ...targetElement,
          parameters: jest.fn(() => ({ ...povMock }))
        };
        sceneMock = { view: jest.fn(() => ({ ...viewMock })) };
        loadScene = jest.spyOn(marzipanoService, 'loadScene');
      });

      afterEach(() => {
        jest.resetAllMocks();
      });

      it('should throw een error when the scene can\'t be loaded', () => {
        console.error = jest.fn();
        const dataMock = {
          location: [1, 2],
          image: '',
          hotspots: [],
          date: new Date('2019-01-01')
        };
        loadScene.mockImplementation(() => {
          throw new Error('network problem')
        });

        panoviewer._loadScene(dataMock);
        expect(console.error).toHaveBeenCalled();
      });

      describe('the scene events', () => {
        const dataMock = {
          location: [1, 2],
          image: '',
          hotspots: [],
          date: new Date('2019-01-01')
        };

        beforeEach(() => {
          loadScene.mockImplementation(() => {
            return sceneMock;
          });
          panoviewer._loadScene(dataMock);
        });

        it('should handle the active event', () => {
          panoviewer.registeredEvents
            .filter(e => e.name === 'active')
            .map(e => e.handler());
          expect(eventCallbacks.active).toHaveBeenCalled();
        });

        it('should handle the inactive event', () => {
          panoviewer.registeredEvents
            .filter(e => e.name === 'inactive')
            .map(e => e.handler());
          expect(eventCallbacks.inactive).toHaveBeenCalled();

        });

        it('should handle the change event', () => {
          const povExpected = Object.keys(povMock).reduce((acc, key) => ({
            ...acc,
            [key]: radiansToDegrees(povMock[key])
          }), {});
          expect(panoviewer.pov).toEqual({ fov: 80, pitch: 0, yaw: 0 });
          panoviewer.registeredEvents
            .filter(e => e.name === 'change')
            .map(e => e.handler());
          expect(panoviewer.pov).toEqual(povExpected);
          expect(eventCallbacks.change).toHaveBeenCalled();
        });

        it('should handle the _unbindEvents', () => {
          expect(panoviewer.registeredEvents.length).toBe(4);
          panoviewer._unbindEvents();
          expect(panoviewer.registeredEvents.length).toBe(0);
        });

        it('should update the location when the scene is loaded', () => {
          expect(panoviewer.eventCallbacks.location).toHaveBeenCalledWith(
            {
              date: new Date('2019-01-01'),
              lat: 1,
              lon: 2
            }
          );
        });
      });
    });

    describe('_updateLocation', () => {
      it('should ignore the location change when there is no callback handler', () => {
        const dataMock = {
          location: [1, 2],
          date: new Date('2019-01-01')
        };
        panoviewer.eventCallbacks = null;
        panoviewer._updateLocation(dataMock);
      });
    });

    describe('_updatePanorama', () => {
      it('should load the scene with the updated data', () => {
        const result = {
          location: [1, 2]
        };
        const _loadScene = jest.spyOn(panoviewer, '_loadScene');
        _loadScene.mockImplementation(() => { });
        getImageDataById.mockImplementation(() => Promise.resolve(result));

        const promise = panoviewer._updatePanorama(1000).then((data) => {
          expect(getImageDataById).toHaveBeenCalledWith(1000, panoviewer.tags);
          expect(_loadScene).toHaveBeenCalledWith(result);
        });
        return promise;
      });
    });

  });
});

import {
  getImageDataByLocation,
  getImageDataById
} from './shared-atlas/panorama-api/panorama-api';
import * as marzipanoService from './shared-atlas/marzipano/marzipano';

import PanoViewer from './viewer';

jest.mock('marzipano');
jest.mock('./shared-atlas/panorama-api/panorama-api');
// jest.mock('./shared-atlas/marzipano/marzipano');

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
    beforeEach(() => {
      global.document.getElementById = () => document.createElement('div');

      panoviewer = new PanoViewer('panoId');

    });

    it('should set the eventCallbacks', () => {
      const eventCallbacks = {
        callback: jest.fn()
      }
      panoviewer.setEventCallbacks(eventCallbacks);
      expect(panoviewer.eventCallbacks).toEqual(eventCallbacks);
    });

    describe('loadPanorama', () => {
      const dataMock = { location: [1, 2] };
      const sceneMock = { view: jest.fn() };
      let _loadScene;
      let loadScene;

      beforeEach(() => {
        _loadScene = jest.spyOn(panoviewer, '_loadScene');
        _loadScene.mockImplementation(() => { });
        // loadScene = jest.spyOn(marzipanoService, 'loadScene');
        // loadScene.mockImplementation(() => (sceneMock));

        getImageDataByLocation.mockImplementation(() => Promise.resolve(dataMock));

      });

      afterEach(() => {
        jest.resetAllMocks();
      });

      it('should load the panorams without tags', () => {

        panoviewer.tags = ['test'];
        panoviewer.loadPanorama(1, 1).then((data) => {
          expect(getImageDataByLocation).toHaveBeenCalledWith(dataMock.location, ['test']);
          expect(_loadScene).toHaveBeenCalled(dataMock);
        });
      });

      it('should load the panorama with tags', () => {
        panoviewer.loadPanorama(1, 1, ['tags']).then((data) => {
          expect(getImageDataByLocation).toHaveBeenCalledWith(dataMock.location, ['tags']);
          expect(_loadScene).toHaveBeenCalledWith(dataMock);
        });
      });
    });
  });
});

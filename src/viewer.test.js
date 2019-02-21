import PanoViewer from './viewer';

// import Marzipano from 'marzipano';
// import { PANORAMA_CONFIG } from '../panorama-api/panorama-api';
// import { degreesToRadians, radiansToDegrees } from '../angle-conversion/angle-conversion';
// import createHotspot from '../hotspot/hotspot';


jest.mock('marzipano');

describe('The viewer', () => {
  it('should create correctly', () => {

    global.document.getElementById = () => document.createElement('div');

    const panoviewer = new PanoViewer('panoId');
    expect(panoviewer).toMatchSnapshot();
  });
});

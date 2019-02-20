import Marzipano from 'marzipano';
import { PANORAMA_CONFIG } from '../panorama-api/panorama-api';
import { degreesToRadians, radiansToDegrees } from '../angle-conversion/angle-conversion';
import createHotspot from '../hotspot/hotspot';

/*
  Calculate height of the hotspots
  TODO: DP-6135 replace with height returned from the api
*/
function calculateHotspotPitch(height, distance) {
  return Math.atan(height / distance);
}

/*
  Create hotspot element that will be placed in the hotspot container
*/
function createHotspotTemplate(viewer, scene, view, hotspot, onClickHandler) {
  const hotspotPitch = calculateHotspotPitch(PANORAMA_CONFIG.CAMERA_HEIGHT, hotspot.distance);

  const realLifeHotspotSize = 0.6;
  const minDistance = 4;
  const maxDistance = 21;
  const viewport = 960;

  /*
    All hotspots are shown, the min- and maxDistance variables are only used to determine
    the minimum and maximum hotspot size.
  */
  const correctedDistance = Math.min(maxDistance, Math.max(minDistance, hotspot.distance));
  const viewAngle = Math.atan(realLifeHotspotSize / correctedDistance);

  /*
    The actual hotspot size is dependent on the width of the straatbeeld and the FOV. For
    this first version we're making assumptions about the viewport and FOV.
    Offset is a value between 7 and 10 degrees depending on the distance. it is subtracted from
    the angle of the hotspot x rotation to render hotspots better that are far away
  */
  const offset = (5 / (maxDistance - correctedDistance + 1)) + 8; // eslint-disable-line
  const angle = (90 - radiansToDegrees(hotspotPitch) - offset); // eslint-disable-line

  const size = Math.round((radiansToDegrees(viewAngle) * viewport) / PANORAMA_CONFIG.DEFAULT_FOV);
  const year = hotspot.year;

  /*
    Create hotspot element and render to static markup ReactdomElement
  */
  const hotspotElement = createHotspot(angle, hotspot.distance);

  // Add onClick event to hotspot
  hotspotElement.addEventListener('click', () => {
    onClickHandler(hotspot.id, hotspot.heading);
  });

  const position = {
    yaw: degreesToRadians(hotspot.heading),
    pitch: hotspotPitch
  };
console.log(hotspot, position);
  return scene.hotspotContainer().createHotspot(hotspotElement, position);
}

/*
  Set the initial Marzipano viewer that is tied to the ref in the PanoramaContainer
*/
export function initialize(domElement, options) {
  const viewer = new Marzipano.Viewer(domElement, options);

  return viewer;
}

/*
  Load the Marzipano viewer into its view components
*/
export function loadScene(viewer, onClickHandler, image, yaw, pitch, fov, hotspots) {
  const source = Marzipano.ImageUrlSource.fromString(
    image.pattern,
    { cubeMapPreviewUrl: image.preview }
  );

  const viewLimiter = Marzipano.RectilinearView.limit.traditional(
    PANORAMA_CONFIG.MAX_RESOLUTION,
    degreesToRadians(PANORAMA_CONFIG.MAX_FOV)
  );
  const view = new Marzipano.RectilinearView(null, viewLimiter);

  const scene = viewer.createScene({
    source,
    geometry: new Marzipano.CubeGeometry(PANORAMA_CONFIG.LEVEL_PROPERTIES_LIST),
    view,
    pinFirstLevel: true
  });

  // Do not mutate someone else's data collection!
  const hotspotsObject = JSON.parse(JSON.stringify(hotspots));

  hotspotsObject
    .sort((hotspotA, hotspotB) => hotspotB.distance - hotspotA.distance)
    .forEach((hotspot) => createHotspotTemplate(viewer, scene, view, hotspot, onClickHandler));

  view.setYaw(degreesToRadians(yaw));
  view.setPitch(degreesToRadians(pitch));
  view.setFov(degreesToRadians(fov));

  scene.switchTo();
  return scene;
}

/*
  Return the orientation values according to the view in Marzipano
*/
export function getOrientation(viewer) {
  const heading = radiansToDegrees(viewer.view().yaw());
  const pitch = radiansToDegrees(viewer.view().pitch());
  const fov = radiansToDegrees(viewer.view().fov());

  return {
    heading,
    pitch,
    fov
  };
}

export function getHeadingDegrees([x1, y1], [x2, y2]) {
  return (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
}

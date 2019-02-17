import {
  geoSearchType,
  dataSelectionType,
  detailPointType,
  panoramaPersonType,
  panoramaOrientationType
} from './icons.constant';

const markerConfig = {
  [geoSearchType]: { requestFocus: true },
  [dataSelectionType]: {},
  [detailPointType]: { requestFocus: true },
  [panoramaPersonType]: { requestFocus: true },
  [panoramaOrientationType]: { requestFocus: true }
};
export default markerConfig;

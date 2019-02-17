import { createSelector } from 'reselect';

import { getPanoramaLocation, getPanoramaMarkers } from '../../../panorama/ducks/selectors';
import { getGeoJson as getDetailGeoJson } from '../detail/map-detail';
import { geoSearchType } from '../../components/leaflet/services/icons.constant';
import { getDetail } from '../../../shared/ducks/detail/selectors';
import drawToolConfig from '../../services/draw-tool/draw-tool.config';
import { getDataSearchLocation } from '../../../shared/ducks/data-search/selectors';
import { isGeoSearch } from '../../../shared/ducks/selection/selection';
import { isPanoLayer } from './map';
import { areMarkersLoading } from '../../../shared/ducks/data-selection/selectors';
import { isPanoPage } from '../../../store/redux-first-router/selectors';

export const getMap = (state) => state.map;
export const getActiveBaseLayer = createSelector(getMap, (mapState) => mapState.baseLayer);
export const getMapZoom = createSelector(getMap, (mapState) => mapState.zoom);
export const isMapLoading = createSelector(getMap, areMarkersLoading,
  (mapState, dataSelectionLoading) => mapState.isLoading || dataSelectionLoading);

export const getMapOverlays = createSelector([getMap, isPanoPage],
  (mapState, isPano) => (
    mapState && isPano
      ? mapState.overlays
      : mapState.overlays.filter(
        (overlay) => !isPanoLayer(overlay)
      )
  ));

export const getMapCenter = createSelector(getMap, (mapState) => mapState && mapState.viewCenter);
export const getMapBoundingBox = createSelector(getMap, (mapState) => mapState.boundingBox);

export const getDrawingMode = createSelector(getMap, (mapState) => mapState.drawingMode);
export const isDrawingEnabled = createSelector(
  getMap,
  (mapState) => mapState.drawingMode !== drawToolConfig.DRAWING_MODE.NONE
);
export const getGeometry = createSelector(getMap, (mapState) => mapState.geometry);
export const getShapeMarkers = createSelector(getMap, (mapState) => mapState.shapeMarkers);
export const getShapeDistanceTxt = createSelector(getMap, (mapState) => mapState.shapeDistanceTxt);

export const getCenter = createSelector([getMapCenter, getPanoramaLocation],
  (mapCenter, panoramaLocation) => (
    panoramaLocation || mapCenter
  ));

export const getRdGeoJsons = createSelector(getDetailGeoJson, (geoJson) => [geoJson]);

export const getLocationId = createSelector(
  getDataSearchLocation,
  (shortSelectedLocation) => (
    (shortSelectedLocation) ?
      `${shortSelectedLocation.latitude},${shortSelectedLocation.longitude}` :
      null
  ));

export const getSearchMarker = createSelector(
  getDataSearchLocation, isGeoSearch,
  (location, geoSearch) => ((location && geoSearch) ?
      [{ position: [location.latitude, location.longitude], type: geoSearchType }] :
      []
  )
);

export const getMarkers = createSelector(
  getSearchMarker,
  getPanoramaMarkers,
  (searchMarkers, panoramaMarkers) => (
    [...searchMarkers, ...panoramaMarkers]
  ));

export const isMarkerActive = createSelector(getDetail, (detail) => !detail);
export const isMapPanelActive = createSelector(getMap, (map) => map.mapPanelActive);

import { latLngBounds } from 'leaflet';

export const isValidBounds = (bounds) => (
  bounds.isValid ? bounds.isValid() : false
);

export const getBounds = (element) => {
  // if activeElement is a shape
  if (element.getBounds) {
    const elementBounds = element.getBounds();
    if (isValidBounds(elementBounds)) {
      return elementBounds;
    }
  // if activeElement is a point
  } else if (element.getLatLng) {
    const latLng = element.getLatLng();
    return latLngBounds(latLng, latLng);
  }
  // else return a empty object
  return {};
};

export const isBoundsAPoint = (bounds) => (
  bounds.getNorthEast().equals(bounds.getSouthWest())
);

export const boundsToString = (elementBounds) => (
  elementBounds.toBBoxString ?
    elementBounds.toBBoxString() : elementBounds.toString()
);

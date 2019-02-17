import { divIcon, point } from 'leaflet';

const createClusterIcon = (cluster) => (
  divIcon({
    html: `<div
              aria-label="Cluster met ${cluster.getChildCount()} onderdelen"
              class="o-highlight-cluster__text">
            ${cluster.getChildCount()}
          </div>`,
    className: 'o-highlight-cluster',
    iconSize: point(39, 39),
    iconAnchor: point(19, 19)
  }));

export default createClusterIcon;

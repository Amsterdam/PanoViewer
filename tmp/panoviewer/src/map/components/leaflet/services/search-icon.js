import { Icon } from 'leaflet';

import ICON_CONFIG from './icon-config.constant';

const searchIcon = () => new Icon({
  ...ICON_CONFIG.SEARCH,
  popupAnchor: null,
  shadowUrl: null,
  shadowSize: null,
  shadowAnchor: null,
  className: 'dp-leaflet-search-icon'
});

export default searchIcon;

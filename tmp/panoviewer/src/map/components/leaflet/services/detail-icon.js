import { Icon } from 'leaflet';

import ICON_CONFIG from './icon-config.constant';

const detailIcon = () => new Icon({
  ...ICON_CONFIG.DETAIL,
  popupAnchor: null,
  shadowUrl: null,
  shadowSize: null,
  shadowAnchor: null,
  className: 'dp-leaflet-detail-item'
});

export default detailIcon;

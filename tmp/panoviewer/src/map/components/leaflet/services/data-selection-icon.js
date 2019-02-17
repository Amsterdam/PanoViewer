import { DivIcon } from 'leaflet';

import ICON_CONFIG from './icon-config.constant';

const dataSelectionIcon = ({ zoomLevel, count }) => {
  const zoomed = zoomLevel <= 14 ? 'out' : 'in';
  const size =
    (Math.floor(count / 100) && '100') ||
    (Math.floor(count / 10) && '10') ||
    (count - 1 && '1') ||
    'point';

  return new DivIcon({
    ...ICON_CONFIG.DATA_SELECTION[zoomed][size],
    popupAnchor: null,
    className: `
      data-selection-cluster
      data-selection-cluster--zoomed-${zoomed}
      data-selection-cluster--zoomed-${zoomed}-${size}
    `,
    html: `
      <div
        aria-label="Cluster met ${count} appartementen"
        class="data-selection-cluster__text"
      >${count > 1 ? count : ''}</div>
    `
  });
};

export default dataSelectionIcon;

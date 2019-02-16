import React from 'react';
import PropTypes from 'prop-types';
import './Hotspot.scss';

const Hotspot = ({ year, size, angle }) => (
  <div
    className="hotspot"
  >
    <button
      className={`c-hotspot c-hotspot--year-${year} qa-hotspot-button`}
    >
      <div
        className="qa-hotspot-rotation"
        style={{ width: `${size}px`, height: `${size}px`, transform: `rotateX(${angle}deg)` }}
      >
        <div
          className="c-hotspot__image"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      </div>

      <span className="u-sr-only">Navigeer naar deze locatie</span>
    </button>
  </div>
);

Hotspot.propTypes = {
  year: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  angle: PropTypes.number.isRequired
};

export default Hotspot;

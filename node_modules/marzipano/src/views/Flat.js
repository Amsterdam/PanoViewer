/*
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var eventEmitter = require('minimal-event-emitter');
var pixelRatio = require('../util/pixelRatio');
var real = require('../util/real');
var clamp = require('../util/clamp');
var mat4 = require('gl-matrix/src/gl-matrix/mat4');
var vec4 = require('gl-matrix/src/gl-matrix/vec4');

// Default viewport dimensions.
// Start with zero to ensure that those values are handled correctly.
var defaultWidth = 0;
var defaultHeight = 0;

// Default view parameters.
var defaultX = 0.5;
var defaultY = 0.5;
var defaultZoom = 1;

// Constant values used to simplify the frustum culling logic.
// planeAxes[i] indicates the coordinate value that defines a frustum plane.
// planeCmp[i] indicates how point and plane coordinates should be compared
// to determine whether the point is on the outer side of the plane.
var planeAxes = [
  1, // top
  0, // right
  1, // bottom
  0  // left
];
var planeCmp = [
  -1, // top
  -1, // right
   1, // bottom
   1  // left
];

// A zoom of exactly 0 breaks some computations, so we force a minimum positive
// value. We use 9 decimal places for the epsilon value since this is the
// maximum number of significant digits for a 32-bit floating-point number.
// Note that after a certain zoom level, rendering quality will be affected
// by the loss of precision in floating-point computations.
var zoomLimitEpsilon = 0.000000001;


/**
 * @class
 * @classdesc A view implementing an orthogonal projection for flat images.
 * @implements View
 *
 * @param {Object} params the initial view parameters.
 *
 * @param {number} params.mediaAspectRatio image aspect ratio.
 * When `mediaAspectRatio === 1`, the image width equals its height.
 * When `mediaAspectRatio < 1`, the image width is less than its height.
 * When `mediaAspectRatio > 1`, the image height is less than its width.
 *
 * @param {number} [params.x=0.5] horizontal coordinate of the image point at
 * the viewport center, in the [0, 1] range.
 * When `x === 0.5`, the image is centered horizontally.
 * When `x === 0`, the left edge of the image is at the viewport center.
 * When `x === 1`, the right edge of the image is at the viewport center.
 *
 * @param {number} [params.y=0.5] vertical coordinate of the image point at
 * the viewport center, in the [0, 1] range.
 * When `y === 0.5`, the image is centered vertically.
 * When `y === 0`, the top edge of the image is at the viewport center.
 * When `y === 1`, the bottom edge of the image is at the viewport center.
 *
 * @param {number} [params.zoom=1] the horizontal zoom, in the [0, ∞] range.
 * When `zoom === 1`, the image is exactly as wide as the viewport.
 * when `zoom < 1`, the image is zoomed in.
 * when `zoom > 1`, the image is zoomed out.
 *
 * @param {Function} limiter the view limiting function.
 */
function FlatView(params, limiter) {
  // Require an aspect ratio to be specified.
  if (!(params && params.mediaAspectRatio != null)) {
    throw new Error('mediaAspectRatio must be defined');
  }

  // The initial values for the view parameters.
  this._x = params && params.x != null ? params.x : defaultX;
  this._y = params && params.y != null ? params.y : defaultY;
  this._zoom = params && params.zoom != null ? params.zoom : defaultZoom;
  this._mediaAspectRatio = params.mediaAspectRatio;
  this._width = params && params.width != null ?
    params.width : defaultWidth;
  this._height = params && params.height != null ?
    params.height : defaultHeight;

  // The initial value for the view limiter.
  this._limiter = limiter || null;

  // The last calculated view frustum.
  this._viewFrustum = [
    0, // top
    0, // right
    0, // bottom
    0  // left
  ];

  // The last calculated projection matrix.
  this._projectionMatrix = mat4.create();

  // Whether the projection matrix needs to be updated.
  this._projectionChanged = true;

  // Temporary variables used for calculations.
  this._params = {};
  this._vertex = vec4.create();
  this._invProj = mat4.create();

  // Force view limiting on initial parameters.
  this._update();
}

eventEmitter(FlatView);


/**
 * Destructor.
 */
FlatView.prototype.destroy = function() {
  this._x = null;
  this._y = null;
  this._zoom = null;
  this._mediaAspectRatio = null;
  this._width = null;
  this._height = null;
  this._limiter = null;
  this._viewFrustum = null;
  this._projectionMatrix = null;
  this._projectionChanged = null;
  this._params = null;
  this._vertex = null;
  this._invProj = null;
};


/**
 * Get the x parameter.
 * @return {number}
 */
FlatView.prototype.x = function() {
  return this._x;
};


/**
 * Get the y parameter.
 * @return {number}
 */
FlatView.prototype.y = function() {
  return this._y;
};


/**
 * Get the zoom value.
 * @return {number}
 */
FlatView.prototype.zoom = function() {
  return this._zoom;
};


/**
 * Get the media aspect ratio.
 * @return {number}
 */
FlatView.prototype.mediaAspectRatio = function() {
  return this._mediaAspectRatio;
};


/**
 * Get the viewport width.
 * @return {number}
 */
FlatView.prototype.width = function() {
  return this._width;
};


/**
 * Get the viewport height.
 * @return {number}
 */
FlatView.prototype.height = function() {
  return this._height;
};


/**
 * Get the viewport dimensions. If an object argument is supplied, the object
 * is filled in with the result and returned. Otherwise, a fresh object is
 * returned.
 * @return {Object} obj
 * @return {number} obj.width
 * @return {number} obj.height
 */
FlatView.prototype.size = function(obj) {
  obj = obj || {};
  obj.width = this._width;
  obj.height = this._height;
  return obj;
};


/**
 * Get the view parameters. If an object argument is supplied, the object is
 * filled in with the result and returned. Otherwise, a fresh object is
 * returned.
 * @return {Object} obj
 * @return {number} obj.x
 * @return {number} obj.y
 * @return {number} obj.zoom
 * @return {number} obj.mediaAspectRatio
 */
FlatView.prototype.parameters = function(obj) {
  obj = obj || {};
  obj.x = this._x;
  obj.y = this._y;
  obj.zoom = this._zoom;
  obj.mediaAspectRatio = this._mediaAspectRatio;
  return obj;
};


/**
 * Get the view limiter.
 * @return {Function}
 */
FlatView.prototype.limiter = function() {
  return this._limiter;
};


/**
 * Set the x parameter.
 * @param {number} x
 */
FlatView.prototype.setX = function(x) {
  this._resetParams();
  this._params.x = x;
  this._update(this._params);
};


/**
 * Set the y parameter.
 * @param {number} y
 */
FlatView.prototype.setY = function(y) {
  this._resetParams();
  this._params.y = y;
  this._update(this._params);
};


/**
 * Set the zoom value.
 * @param {number} zoom
 */
FlatView.prototype.setZoom = function(zoom) {
  this._resetParams();
  this._params.zoom = zoom;
  this._update(this._params);
};


/**
 * Add xOffset to the x parameter.
 * @param {number} xOffset
 */
FlatView.prototype.offsetX = function(xOffset) {
  this.setX(this._x + xOffset);
};


/**
 * Add yOffset to the y parameter.
 * @param {number} yOffset
 */
FlatView.prototype.offsetY = function(yOffset)
{
  this.setY(this._y + yOffset);
};


/**
 * Add zoomOffset to the zoom value.
 * @param {number} zoomOffset
 */
FlatView.prototype.offsetZoom = function(zoomOffset) {
  this.setZoom(this._zoom + zoomOffset);
};


/**
 * Set the media aspect ratio.
 * @param {number} mediaAspectRatio
 */
FlatView.prototype.setMediaAspectRatio = function(mediaAspectRatio) {
  this._resetParams();
  this._params.mediaAspectRatio = mediaAspectRatio;
  this._update(this._params);
};


/**
 * Set the viewport dimensions.
 * @param {Object} obj
 * @param {number} obj.width
 * @param {number} obj.height
 */
FlatView.prototype.setSize = function(obj) {
  this._resetParams();
  this._params.width = obj.width;
  this._params.height = obj.height;
  this._update(this._params);
};


/**
 * Set the view parameters. Unspecified parameters are left unchanged.
 * @param {Object} obj
 * @param {number} obj.x
 * @param {number} obj.y
 * @param {number} obj.zoom
 * @param {number} obj.mediaAspectRatio
 */
FlatView.prototype.setParameters = function(obj) {
  this._resetParams();
  var params = this._params;
  params.x = obj.x;
  params.y = obj.y;
  params.zoom = obj.zoom;
  params.mediaAspectRatio = obj.mediaAspectRatio;
  this._update(params);
};


/**
 * Set the view limiter.
 * @param {Function} limiter
 */
FlatView.prototype.setLimiter = function(limiter) {
  this._limiter = limiter || null;
  this._update();
};


FlatView.prototype._resetParams = function() {
  var params = this._params;
  params.x = null;
  params.y = null;
  params.zoom = null;
  params.mediaAspectRatio = null;
  params.width = null;
  params.height = null;
};


FlatView.prototype._update = function(params) {

  // Avoid object allocation when no parameters are supplied.
  if (params == null) {
    this._resetParams();
    params = this._params;
  }

  // Save old parameters for later comparison.
  var oldX = this._x;
  var oldY = this._y;
  var oldZoom = this._zoom;
  var oldMediaAspectRatio = this._mediaAspectRatio;
  var oldWidth = this._width;
  var oldHeight = this._height;

  // Fill in object with the new set of parameters to pass into the limiter.
  params.x = params.x != null ? params.x : oldX;
  params.y = params.y != null ? params.y : oldY;
  params.zoom = params.zoom != null ? params.zoom : oldZoom;
  params.mediaAspectRatio = params.mediaAspectRatio != null ?
    params.mediaAspectRatio : oldMediaAspectRatio;
  params.width = params.width != null ? params.width : oldWidth;
  params.height = params.height != null ? params.height : oldHeight;

  // Apply view limiting when defined.
  if (this._limiter) {
    params = this._limiter(params);
    if (!params) {
      throw new Error('Bad view limiter');
    }
  }

  // Grab the limited parameters.
  var newX = params.x;
  var newY = params.y;
  var newZoom = params.zoom;
  var newMediaAspectRatio = params.mediaAspectRatio;
  var newWidth = params.width;
  var newHeight = params.height;

  // Consistency check.
  if (!real(newX) || !real(newY) || !real(newZoom) ||
      !real(newMediaAspectRatio) || !real(newWidth) || !real(newHeight)) {
    throw new Error('Bad view - suspect a broken limiter');
  }

  // Constrain zoom.
  newZoom = clamp(newZoom, zoomLimitEpsilon, Infinity);

  // Update parameters.
  this._x = newX;
  this._y = newY;
  this._zoom = newZoom;
  this._mediaAspectRatio = newMediaAspectRatio;
  this._width = newWidth;
  this._height = newHeight;

  // Check whether the parameters changed and emit the corresponding events.
  if (newX !== oldX || newY !== oldY || newZoom !== oldZoom ||
      newMediaAspectRatio !== oldMediaAspectRatio ||
      newWidth !== oldWidth || newHeight !== oldHeight) {
    this._projectionChanged = true;
    this.emit('change');
  }
  if (newWidth !== oldWidth || newHeight !== oldHeight) {
    this.emit('resize');
  }

};


FlatView.prototype._zoomX = function() {
  return this._zoom;
};


FlatView.prototype._zoomY = function() {
  var mediaAspectRatio = this._mediaAspectRatio;
  var aspect = this._width / this._height;
  var zoomX = this._zoom;
  var zoomY = zoomX * mediaAspectRatio / aspect;
  if (isNaN(zoomY)) {
    zoomY = zoomX;
  }
  return zoomY;
};


FlatView.prototype.updateWithControlParameters = function(parameters) {
  var scale = this.zoom();
  var zoomX = this._zoomX();
  var zoomY = this._zoomY();

  // TODO: should the scale be the same for both axes?
  this.offsetX(parameters.axisScaledX * zoomX + parameters.x * scale);
  this.offsetY(parameters.axisScaledY * zoomY + parameters.y * scale);
  this.offsetZoom(parameters.zoom * scale);
};


/**
 * Compute and return the projection matrix for the current view.
 * @returns {mat4}
 */
FlatView.prototype.projection = function() {

  var projectionMatrix = this._projectionMatrix;

  // Recalculate projection matrix when required.
  if (this._projectionChanged) {
    var x = this._x;
    var y = this._y;
    var zoomX = this._zoomX();
    var zoomY = this._zoomY();

    // Update view frustum.
    var frustum = this._viewFrustum;
    var top     = frustum[0] = (0.5 - y) + 0.5 * zoomY;
    var right   = frustum[1] = (x - 0.5) + 0.5 * zoomX;
    var bottom  = frustum[2] = (0.5 - y) - 0.5 * zoomY;
    var left    = frustum[3] = (x - 0.5) - 0.5 * zoomX;

    // Recalculate projection matrix.
    mat4.ortho(projectionMatrix, left, right, bottom, top, -1, 1);
    this._projectionChanged = false;
  }

  return projectionMatrix;

};


/**
 * Return whether the view frustum intersects the given rectangle.
 * This function may return false positives, but never false negatives.
 * It is used for frustum culling, i.e., excluding invisible tiles from the
 * rendering process.
 * @param {vec4[]} rectangle
 * @return whether the rectangle intersects the view frustum.
 */
FlatView.prototype.intersects = function(rectangle) {

  var frustum = this._viewFrustum;

  // Call projection() for the side effect of updating the frustum.
  this.projection();

  // Check whether the rectangle is on the outer side of any of the frustum
  // planes. This is a sufficient condition, though not necessary, for the
  // rectangle to be completely outside the fruouter
  for (var i = 0; i < frustum.length; i++) {
    var limit = frustum[i];
    var axis = planeAxes[i];
    var cmp = planeCmp[i];
    var inside = false;
    for (var j = 0; j < rectangle.length; j++) {
      var vertex = rectangle[j];
      if (cmp < 0 && vertex[axis] < limit || cmp > 0 && vertex[axis] > limit) {
        inside = true;
        break;
      }
    }
    if (!inside) {
      return false;
    }
  }
  return true;

};


/**
 * Select the level that should be used to render the view.
 * @param {Level[]} levelList the list of levels from which to select.
 * @return {Level} the selected level.
 */
FlatView.prototype.selectLevel = function(levels) {

  // Multiply the viewport width by the device pixel ratio to get the required
  // horizontal resolution in pixels.
  //
  // Calculate the fraction of the image that would be visible at the current
  // zoom value. Then, for each level, multiply by the level width to get the
  // width in pixels of the portion that would be visible.
  //
  // Search for the smallest level that satifies the the required width,
  // falling back on the largest level if none do.

  var requiredPixels = pixelRatio() * this.width();
  var zoomFactor = this._zoom;

  for (var i = 0; i < levels.length; i++) {
    var level = levels[i];
    if (zoomFactor * level.width() >= requiredPixels) {
      return level;
    }
  }

  return levels[levels.length - 1];

};


/**
 * Convert view coordinates into screen position. If a result argument is
 * supplied, the object is filled in with the result and returned. Otherwise,
 * a fresh object is returned.
 * @param {Object} coords
 * @param {number} coords.x
 * @param {number} coords.y
 * @return {Object} result
 * @return {number} result.x
 * @return {number} result.y
 */
FlatView.prototype.coordinatesToScreen = function(coords, result) {
  var ray = this._vertex;

  if (!result) {
    result = {};
  }

  var width = this._width;
  var height = this._height;

  // Undefined on a null viewport.
  if (width <= 0 || height <= 0) {
    result.x = null;
    result.y = null;
    return null;
  }

  // Extract coordinates from argument, filling in default values.
  var x = coords && coords.x != null ? coords.x : defaultX;
  var y = coords && coords.y != null ? coords.y : defaultY;

  // Project view ray onto clip space.
  vec4.set(ray, x - 0.5, 0.5 - y, -1, 1);
  vec4.transformMat4(ray, ray, this.projection());

  // Calculate perspective divide.
  for (var i = 0; i < 3; i++) {
    ray[i] /= ray[3];
  }

  // Convert to viewport coordinates and return.
  result.x = width * (ray[0] + 1) / 2;
  result.y = height * (1 - ray[1]) / 2;

  return result;
};


/**
 * Convert screen position into view coordinates. If a result argument is
 * supplied, the object is filled in with the result and returned. Otherwise,
 * a fresh object is returned.
 * @param {Object} screen
 * @param {number} screen.x
 * @param {number} screen.y
 * @return {Object} result
 * @return {number} result.x
 * @return {number} result.y
 */
FlatView.prototype.screenToCoordinates = function(screen, result) {
  var ray = this._vertex;
  var invProj = this._invProj;

  if (!result) {
    result = {};
  }

  var width = this._width;
  var height = this._height;

  // Calculate the inverse projection matrix.
  // TODO: cache result?
  mat4.invert(invProj, this.projection());

  // Convert viewport coordinates to clip space.
  var vecx = 2.0 * screen.x / width - 1.0;
  var vecy = 1.0 - 2.0 * screen.y / height;
  vec4.set(ray, vecx, vecy, 1, 1);

  // Project back to world space.
  vec4.transformMat4(ray, ray, invProj);

  // Convert to flat coordinates.
  result.x = 0.5 + ray[0];
  result.y = 0.5 - ray[1];

  return result;
};


/**
 * View limiting functions.
 * @namespace
 */
FlatView.limit = {

  /**
   * Return a view limiter that constrains the x parameter.
   * @param {number} min
   * @param {number} max
   * @return {Function} view limiter
   */
  x: function(min, max) {
    return function limitX(params) {
      params.x = clamp(params.x, min, max);
      return params;
    };
  },

  /**
   * Return a view limiter that constrains the y parameter.
   * @param {number} min the minimum y value.
   * @param {number} max the maximum y value.
   * @return {Function} view limiter
   */
  y: function(min, max) {
    return function limitY(params) {
      params.y = clamp(params.y, min, max);
      return params;
    };
  },

  /**
   * Return a view limiter than constrains the zoom parameter.
   * @param {number} min the minimum zoom value
   * @param {number} max the maximum zoom value
   * @return {Function} view limiter
   */
  zoom: function(min, max) {
    return function limitZoom(params) {
      params.zoom = clamp(params.zoom, min, max);
      return params;
    };
  },

  /**
   * Return a view limiter that prevents zooming in beyond the given
   * resolution.
   * @param {number} size the image width in pixels
   * @return {Function} view limiter
   */
  resolution: function(size) {
    return function limitResolution(params) {
      if(params.width <= 0 || params.height <= 0) {
        return params;
      }
      var width = params.width;
      var minZoom = pixelRatio() * width / size;
      params.zoom = clamp(params.zoom, minZoom, Infinity);
      return params;
    };
  },

  /**
   * Return a view limiter that constrains the values of the x parameter that
   * are inside the viewport.
   * @param {number} min the minimum x value
   * @param {number} max the maximum x value
   * @return {Function} view limiter
   */
  visibleX: function(min, max) {
    return function limitVisibleX(params) {
      // Calculate the zoom value that makes the specified range fully visible.
      var maxZoom = max - min;

      // Clamp zoom to the maximum value.
      if (params.zoom > maxZoom) {
        params.zoom = maxZoom;
      }

      // Bound X such that the image is visible up to the range edges.
      var minX = min + 0.5 * params.zoom;
      var maxX = max - 0.5 * params.zoom;
      params.x = clamp(params.x, minX, maxX);

      return params;
    };
  },

  /**
   * Return a view limiter that constrains the values of the y parameter that
   * are inside the viewport.
   * @param {number} min the minimum y value
   * @param {number} max the maximum y value
   * @return {Function} view limiter
   */
  visibleY: function(min, max) {
    return function limitVisibleY(params) {

      // Do nothing for a null viewport.
      if (params.width <= 0 || params.height <= 0) {
        return params;
      }

      // Calculate the X to Y conversion factor.
      var viewportAspectRatio = params.width / params.height;
      var factor = viewportAspectRatio / params.mediaAspectRatio;

      // Calculate the zoom value that makes the specified range fully visible.
      var maxZoom = (max - min) * factor;

      // Clamp zoom to the maximum value.
      if (params.zoom > maxZoom) {
        params.zoom = maxZoom;
      }

      // Bound Y such that the image is visible up to the range edges.
      var minY = min + 0.5 * params.zoom / factor;
      var maxY = max - 0.5 * params.zoom / factor;
      params.y = clamp(params.y, minY, maxY);

      return params;
    };
  },


  /**
   * Return a view limiter that constrains the zoom parameter such that
   * zooming out is prevented beyond the point at which the image is fully
   * visible. Unless the image and the viewport have the same aspect ratio,
   * this will cause bands to appear around the image.
   * @return {Function} view limiter
   */
  letterbox: function() {
    return function limitLetterbox(params) {
      if(params.width <= 0 || params.height <= 0) {
        return params;
      }
      var viewportAspectRatio = params.width / params.height;

      var fullWidthZoom = 1.0;
      var fullHeightZoom = viewportAspectRatio / params.mediaAspectRatio;

      // If the image is wider than the viewport, limit the horizontal zoom to
      // the image width.
      if (params.mediaAspectRatio >= viewportAspectRatio) {
        params.zoom = Math.min(params.zoom, fullWidthZoom);
      }

      // If the image is narrower than the viewport, limit the vertical zoom to
      // the image height.
      if (params.mediaAspectRatio <= viewportAspectRatio) {
        params.zoom = Math.min(params.zoom, fullHeightZoom);
      }

      // If the full image width is visible, limit x to the central point.
      // Else, bound x such that image is visible up to the horizontal edges.
      var minX, maxX;
      if (params.zoom > fullWidthZoom) {
        minX = maxX = 0.5;
      } else {
        minX = 0.0 + 0.5 * params.zoom / fullWidthZoom;
        maxX = 1.0 - 0.5 * params.zoom / fullWidthZoom;
      }

      // If the full image height is visible, limit y to the central point.
      // Else, bound y such that image is visible up to the vertical edges.
      var minY, maxY;
      if (params.zoom > fullHeightZoom) {
        minY = maxY = 0.5;
      } else {
        minY = 0.0 + 0.5 * params.zoom / fullHeightZoom;
        maxY = 1.0 - 0.5 * params.zoom / fullHeightZoom;
      }

      // Clamp x and y into the calculated bounds.
      params.x = clamp(params.x, minX, maxX);
      params.y = clamp(params.y, minY, maxY);

      return params;
    };
  }

};


FlatView.type = FlatView.prototype.type = 'flat';


module.exports = FlatView;

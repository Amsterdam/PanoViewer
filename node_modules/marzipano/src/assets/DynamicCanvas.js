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

/**
 * Dynamic asset containing a canvas.
 * @class
 * @implements Asset
 * @param {Element} element HTML Canvas element
 */
function DynamicCanvasAsset(element, opts) {
  opts = opts || {};

  this._opts = opts;

  this._element = element;
  this._timestamp = 1;
  this._lastUsedTime = null;

}

eventEmitter(DynamicCanvasAsset);

/**
 * @return {Element}
 */
DynamicCanvasAsset.prototype.element = function() {
  return this._element;
};

DynamicCanvasAsset.prototype.width = function() {
  return this._element.width;
};

DynamicCanvasAsset.prototype.height = function() {
  return this._element.height;
};

DynamicCanvasAsset.prototype.dynamic = true;

DynamicCanvasAsset.prototype.timestamp = function() {
  return this._timestamp;
};

/**
 * Notifies that the contained Canvas element was modified.
 * @fires {Asset#change}
 */
DynamicCanvasAsset.prototype.changed = function() {
  this._timestamp++;
  this.emit('change');
};

DynamicCanvasAsset.prototype.destroy = function() {
  if (this._opts.unload) {
    this._opts.unload();
  }
};

module.exports = DynamicCanvasAsset;
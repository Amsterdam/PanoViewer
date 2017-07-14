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

var Hammer = require('hammerjs');
var Map = require('../collections/Map');
var hash = require('../util/hash');
var browser = require('bowser');


/**
 * @class
 * @classdesc Manages Hammer.js instances. One instance is created for each
 * different combination of DOM element and pointer type.
 */
function HammerGestures() {
  this._managers = new Map(domElementEquals, domElementHash);
}


HammerGestures.prototype.get = function(element, type) {
  if (!this._managers.has(element)) {
    this._managers.set(element, {});
  }
  var elementManagers = this._managers.get(element);

  if (!elementManagers[type]) {
    elementManagers[type] = this._createManager(element, type);
  }
  var elementTypeManager = elementManagers[type];
  elementTypeManager.refs += 1;

  return new HammerGesturesHandle(this, elementTypeManager.manager, element, type);
};


HammerGestures.prototype._createManager = function(element, type) {
  var manager = new Hammer.Manager(element);

  // Managers are created with different parameters for different pointer
  // types.
  if (type === 'mouse') {
    manager.add(new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 }));
  }
  else if (type === 'touch' || type === 'pen' || type === 'kinect') {
    // On touch one wants to have both panning and pinching. The panning
    // recognizer needs a threshold to allow the pinch to be recognized.
    manager.add(new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 20, pointers: 1 }));
    if (!(browser.msie && parseFloat(browser.version) < 10)) {
      // Do not add pinch to IE8-9 to prevent focus issues which prevent wheel scrolling from
      // working.
      manager.add(new Hammer.Pinch());
    }
  }

  return {
    manager: manager,
    refs: 0
  };
};


HammerGestures.prototype._releaseHandle = function(element, type) {
  var elementTypeManager = this._managers.get(element)[type];
  elementTypeManager.refs -= 1;
  if(elementTypeManager.refs <= 0) {
    elementTypeManager.manager.destroy();
    this._managers.get(element)[type] = null;
  }
};


function domElementEquals(e1, e2) {
  return e1 === e2;
}


function domElementHash(e) {
  var elementStr = e.id || e.toString();
  while (elementStr.length < 5) {
    elementStr += '0';
  }
  return hash(elementStr.charCodeAt(0), elementStr.charCodeAt(1), elementStr.charCodeAt(2), elementStr.charCodeAt(3), elementStr.charCodeAt(4));
}


function HammerGesturesHandle(hammerGestures, manager, element, type) {
  this._manager = manager;
  this._element = element;
  this._type = type;
  this._hammerGestures = hammerGestures;
  this._eventHandlers = [];
}


HammerGesturesHandle.prototype.on = function(events, handler) {
  var type = this._type;
  var handlerFilteredEvents = function(e) {
    if (type === e.pointerType) {
      handler(e);
    }
  };

  this._eventHandlers.push({ events: events, handler: handlerFilteredEvents });
  this._manager.on(events, handlerFilteredEvents);
};


HammerGesturesHandle.prototype.release = function() {
  for (var i = 0; i < this._eventHandlers.length; i++) {
    var eventHandler = this._eventHandlers[i];
    this._manager.off(eventHandler.events, eventHandler.handler);
  }

  this._hammerGestures._releaseHandle(this._element, this._type);
  this._manager = null;
  this._element = null;
  this._type = null;
  this._hammerGestures = null;
};


HammerGesturesHandle.prototype.manager = function() {
  return this._manager;
};


module.exports = new HammerGestures();
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

/**
 * @class
 * @classdesc Changes the cursor when a {@link ControlMethod) is active.
 * By default this is used with the drag control method.
 *
 * @param {Controls} controls Controls instance containing the control method.
 * @param {string} id ID of the control method. 
 * @param {Element} element DOM element where the cursor should change.
 * @param {Object} opts
 * @param {Array<string>} [opts.active=[ 'move' ]] Cursors to use when active.
 * @param {Array<string>} [opts.inactive=[ 'default' ]] Cursors to use when
 * inactive.
 * @param {Array<string>} [opts.disabled=[ 'null' ]] Cursors to use when
 * disabled.
 */
function DragCursor(controls, id, element, opts) {
  opts = opts || {};
  opts.active = [ 'move' ];
  opts.inactive = [ 'default' ];
  opts.disabled = [ null ];

  this._controls = controls;
  this._id = id;

  this._attached = false;

  this._setActiveCursor = setCursor.bind(null, element, opts.active);
  this._setInactiveCursor = setCursor.bind(null, element, opts.inactive);
  this._setDisabledCursor = setCursor.bind(null, element, opts.disabled);


  if(controls.method(id).enabled) {
    this._attachCursor(controls.method(id));
  }


  this._enableChangeHandler = this._updateAttach.bind(this);

  controls.addEventListener('methodEnabled', this._enableChangeHandler);
  controls.addEventListener('methodDisabled', this._enableChangeHandler);
  controls.addEventListener('enabled', this._enableChangeHandler);
  controls.addEventListener('disabled', this._enableChangeHandler);
}

/**
 * Destroy the instance
 */
DragCursor.prototype.destroy = function() {
  this._detachCursor(this._controls.method(this._id));
  this._controls.removeEventListener('methodEnabled', this._enableChangeHandler);
  this._controls.removeEventListener('methodDisabled', this._enableChangeHandler);
  this._controls.removeEventListener('enabled', this._enableChangeHandler);
  this._controls.removeEventListener('disabled', this._enableChangeHandler);
};

DragCursor.prototype._updateAttach = function() {
  var controls = this._controls;
  var id = this._id;
  if(controls.enabled() && controls.method(id).enabled) {
    this._attachCursor(controls.method(id));
  }
  else {
    this._detachCursor(controls.method(id));
  }
};

DragCursor.prototype._attachCursor = function(dragControlMethod) {
  if(!this._attached) {
    dragControlMethod.instance.addEventListener('active', this._setActiveCursor);
    dragControlMethod.instance.addEventListener('inactive', this._setInactiveCursor);

    if(dragControlMethod.active) {
      this._setActiveCursor();
    }
    else {
      this._setInactiveCursor();
    }

    this._attached = true;
    
  }
};

DragCursor.prototype._detachCursor = function(dragControlMethod) {
  if(this._attached) {
    dragControlMethod.instance.removeEventListener('active', this._setActiveCursor);
    dragControlMethod.instance.removeEventListener('inactive', this._setInactiveCursor);
    this._setDisabledCursor();

    this._attached = false;
  }
};


function setCursor(element, cursors) {
  cursors.forEach(function(cursor) {
    element.style.cursor = cursor;
  });
}

module.exports = DragCursor;
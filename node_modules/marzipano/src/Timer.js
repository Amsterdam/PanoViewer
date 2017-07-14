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
var defaults = require('./util/defaults');
var clock = require('./util/clock');

var defaultOptions = {
  duration: Infinity
};


function Timer(opts) {

  opts = defaults(opts || {}, defaultOptions);

  this._duration = opts.duration;

  this._startTime = null;

  this._handle = null;

  this._check = this._check.bind(this);

}

eventEmitter(Timer);


Timer.prototype.start = function() {
  this._startTime = clock();
  if (this._handle == null && this._duration < Infinity) {
    this._setup(this._duration);
  }
};


Timer.prototype.started = function() {
  return this._startTime != null;
};


Timer.prototype.stop = function() {
  this._startTime = null;
  if (this._handle != null) {
    clearTimeout(this._handle);
    this._handle = null;
  }
};


Timer.prototype.reset = function() {
  this.start();
};


Timer.prototype._setup = function(interval) {
  this._handle = setTimeout(this._check, interval);
};


Timer.prototype._check = function() {
  var currentTime = clock();
  var elapsed = currentTime - this._startTime;
  var remaining = this._duration - elapsed;

  this._handle = null;

  if (remaining <= 0) {
    this.emit('timeout');
    this._startTime = null;
  } else if (remaining < Infinity) {
    this._setup(remaining);
  }
};


Timer.prototype.duration = function() {
  return this._duration;
};


Timer.prototype.setDuration = function(duration) {

  this._duration = duration;

  if (this._startTime != null) {
    if (this._handle != null) {
      clearTimeout(this._handle);
      this._handle = null;
    }
    this._check();
  }

};


module.exports = Timer;
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
 * @class
 * @classdesc A RenderLoop causes a {@link Stage} to be rendered on the next
 *            frame when it reports that its contents are invalid. The loop
 *            may be manually started/stopped and begins in the stopped state.
 * @param {Stage} stage
 */
function RenderLoop(stage) {

  var self = this;

  // The stage wrapped by the loop.
  this._stage = stage;

  // Whether the loop is running.
  this._running = false;

  // Whether the loop is currently rendering.
  this._rendering = false;

  // The current requestAnimationFrame handle.
  this._requestHandle = null;

  // The callback passed into requestAnimationFrame.
  this._boundLoop = this._loop.bind(this);

  // Handler for renderInvalid events emitted by the stage.
  this._renderInvalidHandler = function() {
    // If we are already rendering, there's no need to schedule a new render
    // on the next frame.
    if (!self._rendering) {
      self.renderOnNextFrame();
    }
  };

  // Handle renderInvalid events emitted by the stage.
  this._stage.addEventListener('renderInvalid', this._renderInvalidHandler);

}

eventEmitter(RenderLoop);


/**
 * Destructor.
 */
RenderLoop.prototype.destroy = function() {
  this.stop();
  this._stage.removeEventListener('renderInvalid', this._renderInvalidHandler);
  this._stage = null;
  this._running = null;
  this._rendering = null;
  this._requestHandle = null;
  this._boundLoop = null;
};


/**
 * Get the underlying stage.
 * @return {Stage}
 */
RenderLoop.prototype.stage = function() {
  return this._stage;
};


/**
 * Start the render loop.
 */
RenderLoop.prototype.start = function() {
  this._running = true;
  this.renderOnNextFrame();
};


/**
 * Stop the render loop.
 */
RenderLoop.prototype.stop = function() {
  if (this._requestHandle) {
    window.cancelAnimationFrame(this._requestHandle);
    this._requestHandle = null;
  }
  this._running = false;
};


/**
 * Request a render on the next frame, even if the stage contents remain valid.
 * Does nothing if the loop is stopped.
 */
RenderLoop.prototype.renderOnNextFrame = function() {
  if (this._running && !this._requestHandle) {
    this._requestHandle = window.requestAnimationFrame(this._boundLoop);
  }
};


RenderLoop.prototype._loop = function() {
  if (!this._running) {
    throw new Error('Render loop running while in stopped state');
  }
  this._requestHandle = null;
  this._rendering = true;
  this.emit('beforeRender');
  this._rendering = false;
  this._stage.render();
  this.emit('afterRender');
};


module.exports = RenderLoop;

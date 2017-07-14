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

var assert = require('proclaim');
var sinon = require('sinon');

var eventEmitter = require('minimal-event-emitter');

var defer = require('../../src/util/defer');
var cancelize = require('../../src/util/cancelize');

var RenderLoop = require('../../src/RenderLoop');

function MockStage() {
  this.render = sinon.spy();
}

eventEmitter(MockStage);

suite('RenderLoop', function() {

  test('initial state', function(done) {
    var stage = new MockStage();
    var loop = new RenderLoop(stage);
    stage.emit('renderInvalid');
    setTimeout(function() {
      assert(stage.render.notCalled);
      done();
    }, 20);
  });

  test('start', function(done) {
    var stage = new MockStage();
    var loop = new RenderLoop(stage);
    loop.start();
    stage.emit('renderInvalid');
    setTimeout(function() {
      assert(stage.render.called);
      done();
    }, 20);
  });

  test('stop', function(done) {
    var stage = new MockStage();
    var loop = new RenderLoop(stage);
    loop.start();
    loop.stop();
    stage.emit('renderInvalid');
    setTimeout(function() {
      assert(stage.render.notCalled);
      done();
    }, 20);
  });

  test('renderOnNextFrame', function(done) {
    var stage = new MockStage();
    var loop = new RenderLoop(stage);
    loop.start();
    loop.renderOnNextFrame();
    setTimeout(function() {
      assert(stage.render.called);
      done();
    }, 20);
  });

});

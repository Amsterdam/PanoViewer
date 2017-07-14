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

var defer = require('../../../src/util/defer');

var error = new Error('err');

suite('defer', function() {

  test('without arguments', function(done) {
    var spy = sinon.spy();
    defer(spy);
    setTimeout(function() {
      assert(spy.calledOnce);
      done();
    }, 10);
  });

  test('with arguments', function(done) {
    var spy = sinon.spy();
    defer(spy, [1, 2, 3]);
    setTimeout(function() {
      assert(spy.calledWith(1, 2, 3));
      done();
    }, 10);
  });

});
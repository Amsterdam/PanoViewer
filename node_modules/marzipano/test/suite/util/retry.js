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

var retry = require('../../../src/util/retry');
var defer = require('../../../src/util/defer');
var cancelize = require('../../../src/util/cancelize');

var error = new Error('err');

function flaky(nfail) {
  return function fn(x, done) {
    if (nfail--) {
      defer(function() {
        done(true);
      });
    } else {
      defer(function() {
        done(null, 2*x);
      });
    }
  };
}

suite('retry', function() {

  test('zero failures', function(done) {
    var doneSpy = sinon.spy();
    var fn = retry(cancelize(flaky(0)));
    fn(2, doneSpy);
    setTimeout(function() {
      assert(doneSpy.calledOnce);
      assert(doneSpy.calledWith(null, 4));
      done();
    }, 50);
  });

  test('one failure', function(done) {
    var doneSpy = sinon.spy();
    var fn = retry(cancelize(flaky(1)));
    fn(2, doneSpy);
    setTimeout(function() {
      assert(doneSpy.calledOnce);
      assert(doneSpy.calledWith(null, 4));
      done();
    }, 50);
  });

  test('two failures', function(done) {
    var doneSpy = sinon.spy();
    var fn = retry(cancelize(flaky(2)));
    fn(2, doneSpy);
    setTimeout(function() {
      assert(doneSpy.calledOnce);
      assert(doneSpy.calledWith(null, 4));
      done();
    }, 50);
  });

  test('cancel', function(done) {
    var doneSpy = sinon.spy();
    var fn = retry(cancelize(flaky(0)));
    var cancel = fn(2, doneSpy);
    cancel(error);
    setTimeout(function() {
      assert(doneSpy.calledOnce);
      assert(doneSpy.calledWith(error));
      done();
    }, 50);
  });

});

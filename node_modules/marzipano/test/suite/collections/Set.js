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

var assert = require('../../assert');

var deepEqual = require('deep-equal');

var Set = require('../../../src/collections/Set');

// Finite numbers hash to their absolute value; everything else hashes to zero.
var hash = function(x) {
  return typeof x === 'number' && isFinite(x) ? Math.floor(Math.abs(x)) : 0;
};

suite('Set', function() {

  suite('add', function() {

    test('single element', function() {
      var set = new Set(deepEqual, hash);
      assert(set.add(42) === null);
      assert(set.has(42));
    });

    test('two elements with same hash', function() {
      var set = new Set(deepEqual, hash);
      assert(set.add({}) === null);
      assert(set.add("") === null);
      assert(set.has({}));
      assert(set.has(""));
    });

    test('existing element', function() {
      var set = new Set(deepEqual, hash);
      assert(set.add(42) === null);
      assert(set.add(42) !== null);
      assert(set.has(42));
    });

  });

  suite('remove', function() {

    test('existing element', function() {
      var set = new Set(deepEqual, hash);
      var elem = {};
      assert(set.add(elem) === null);
      assert(set.remove({}) === elem);
      assert(!set.has(elem));
    });

    test('nonexisting element', function() {
      var set = new Set(deepEqual, hash);
      set.add(42);
      assert(set.remove(37) === null);
    });

    test('existing element with same hash', function() {
      var set = new Set(deepEqual, hash);
      set.add({});
      set.add("");
      assert(set.remove("") === "");
      assert(!set.has(""));
      assert(set.has({}));
    });

    test('nonexisting element with same hash', function() {
      var set = new Set(deepEqual, hash);
      set.add({});
      assert(set.remove("") === null);
      assert(set.has({}));
    });

  });

  suite('size', function() {

    test('empty', function() {
      var set = new Set(deepEqual, hash);
      assert(set.size() === 0);
    });

    test('single element', function() {
      var set = new Set(deepEqual, hash);
      set.add(42);
      assert(set.size() === 1);
    });

    test('more elements than buckets', function() {
      var set = new Set(deepEqual, hash, 16);
      for (var i = 0; i < 32; i++) {
        set.add(i);
      }
      assert(set.size() === 32);
    });

  });

  suite('clear', function() {

    test('clear', function() {
      var set = new Set(deepEqual, hash);
      for (var i = 0; i < 10; i++) {
        set.add(i);
      }
      set.clear();
      assert(set.size() === 0);
    });

  });

  suite('each', function() {

    test('each', function() {
      var set = new Set(deepEqual, hash);
      for (var i = 0; i < 10; i++) {
        set.add(i);
      }

      var seen = [];
      var count = set.each(function(i) {
        seen.push(i);
      });

      assert(count === 10);

      for (var i = 0; i < 10; i++) {
        assert(seen.indexOf(i) >= 0);
      }
    });

  });

});

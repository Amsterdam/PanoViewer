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

var Map = require('../../../src/collections/Map');

// Finite numbers hash to their absolute value; everything else hashes to zero.
var hash = function(x) {
  return typeof x === 'number' && isFinite(x) ? Math.floor(Math.abs(x)) : 0;
};

suite('Map', function() {

  suite('get', function() {

    test('existing key', function() {
      var map = new Map(deepEqual, hash);
      assert(map.set(42, 'abc') === null);
      assert(map.get(42) === 'abc');
    });

    test('nonexisting key', function() {
      var map = new Map(deepEqual, hash);
      assert(map.get(42) === null);
    });

    test('nonexisting key with same hash as existing key', function() {
      var map = new Map(deepEqual, hash);
      assert(map.set({}, 'abc') === null);
      assert(map.get("") === null);
    });

  });

  suite('set', function() {

    test('nonexisting key', function() {
      var map = new Map(deepEqual, hash);
      assert(map.set(42, 'abc') === null);
      assert(map.has(42));
    });

    test('key with same hash as existing key', function() {
      var map = new Map(deepEqual, hash);
      assert(map.set({}, 'abc') === null);
      assert(map.set("", 'xyz') === null);
      assert(map.has({}));
      assert(map.has(""));
    });

    test('existing key', function() {
      var map = new Map(deepEqual, hash);
      assert(map.set(42, 'abc') === null);
      assert(map.set(42, 'xyz') !== null);
      assert(map.has(42));
      assert(map.get(42) === 'xyz');
    });

  });

  suite('del', function() {

    test('existing key', function() {
      var map = new Map(deepEqual, hash);
      var elem = {};
      assert(map.set(elem, 'abc') === null);
      assert(map.del({}) === 'abc');
      assert(!map.has(elem));
    });

    test('nonexisting key', function() {
      var map = new Map(deepEqual, hash);
      map.set(42, 'abc');
      assert(map.del(37) === null);
    });

    test('existing key with same hash as existing key', function() {
      var map = new Map(deepEqual, hash);
      map.set({}, 'abc');
      map.set("", 'xyz');
      assert(map.del("") === 'xyz');
      assert(!map.has(""));
      assert(map.has({}));
      assert(map.get({}) === 'abc');
    });

    test('nonexisting key with same hash as existing key', function() {
      var map = new Map(deepEqual, hash);
      map.set({}, 'abc');
      assert(map.del("") === null);
      assert(map.has({}));
      assert(map.get({}) === 'abc');
    });

  });

  suite('size', function() {

    test('empty', function() {
      var map = new Map(deepEqual, hash);
      assert(map.size() === 0);
    });

    test('single element', function() {
      var map = new Map(deepEqual, hash);
      map.set(42, 'abc');
      assert(map.size() === 1);
    });

    test('more elements than buckets', function() {
      var map = new Map(deepEqual, hash, 16);
      for (var i = 0; i < 32; i++) {
        map.set(i, 2*i);
      }
      assert(map.size() === 32);
    });

  });

  suite('clear', function() {

    test('clear', function() {
      var map = new Map(deepEqual, hash);
      for (var i = 0; i < 10; i++) {
        map.set(i, 2*i);
      }
      map.clear();
      assert(map.size() === 0);
    });

  });

  suite('each', function() {

    test('each', function() {
      var map = new Map(deepEqual, hash);
      for (var i = 0; i < 10; i++) {
        map.set(i, 2*i);
      }

      var seen = {};
      var count = map.each(function(key, val) {
        seen[key] = val;
      });

      assert(count === 10);

      for (var i = 0; i < 10; i++) {
        assert(i in seen && seen[i] === 2*i);
      }
    });

  });

});

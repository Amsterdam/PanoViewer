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

var LruSet = require('../../../src/collections/LruSet');

// Finite numbers hash to their absolute value; everything else hashes to zero.
var hash = function(x) {
  return typeof x === 'number' && isFinite(x) ? Math.floor(Math.abs(x)) : 0;
};

suite('LruSet', function() {

  suite('add', function() {

    test('single element', function() {
      var set = new LruSet(deepEqual, hash, 16);
      assert(set.add(42) === null);
      assert(set.has(42));
    });

    test('two elements with same hash', function() {
      var set = new LruSet(deepEqual, hash, 16);
      assert(set.add({}) === null);
      assert(set.add("") === null);
      assert(set.has({}));
      assert(set.has(""));
    });

    test('existing element', function() {
      var set = new LruSet(deepEqual, hash, 16);
      assert(set.add({}) === null);
      assert(set.add({}) === null);
      assert(set.has({}));
    });

    test('existing element at full size', function() {
      var set = new LruSet(deepEqual, hash, 16);
      var oldest;
      for (var i = 0; i < 16; i++) {
        var obj = { prop: i };
        if (i === 0) {
          oldest = obj;
        }
        assert(set.add(obj) === null);
      }
      assert(set.add({ prop: 0 }) === null);
      assert(set.has(oldest));
      assert(set.size() === 16);
    });

    test('nonexisting element at full size', function() {
      var set = new LruSet(deepEqual, hash, 16);
      var oldest;
      for (var i = 0; i < 16; i++) {
        var obj = { prop: i };
        if (i === 0) {
          oldest = obj;
        }
        assert(set.add(obj) === null);
      }
      assert(set.add({ prop: 42 }) === oldest);
      assert(set.has({ prop: 42 }));
      assert(!set.has(oldest));
      assert(set.size() === 16);
    });

    test('on a set with zero maximum size', function() {
      var set = new LruSet(deepEqual, hash, 0);
      assert(set.add(42) === 42);
      assert(!set.has(42));
    });

  });

  suite('remove', function() {

    test('existing element', function() {
      var set = new LruSet(deepEqual, hash, 16);
      var elem = {};
      assert(set.add(elem) === null);
      assert(set.remove({}) === elem);
      assert(!set.has(elem));
    });

    test('nonexisting element', function() {
      var set = new LruSet(deepEqual, hash, 16);
      set.add(42);
      assert(set.remove(37) === null);
    });

    test('existing element with same hash as existing element', function() {
      var set = new LruSet(deepEqual, hash, 16);
      set.add({});
      set.add("");
      assert(set.remove("") === "");
      assert(!set.has(""));
      assert(set.has({}));
    });

    test('nonexisting element with same hash as existing element', function() {
      var set = new LruSet(deepEqual, hash, 16);
      set.add({});
      assert(set.remove("") === null);
      assert(set.has({}));
    });

    test('first element on a full set', function() {
      var set = new LruSet(deepEqual, hash, 16);
      for (var i = 0; i < 16; i++) {
        set.add(i);
      }
      assert(set.remove(0) === 0);
      assert(!set.has(0));
    });

  });

  suite('size', function() {

    test('empty', function() {
      var set = new LruSet(deepEqual, hash, 16);
      assert(set.size() === 0);
    });

    test('single element', function() {
      var set = new LruSet(deepEqual, hash, 16);
      set.add(42);
      assert(set.size() === 1);
    });

    test('full', function() {
      var set = new LruSet(deepEqual, hash, 16);
      for (var i = 0; i < 16; i++) {
        set.add(i);
      }
      assert(set.size() === 16);
    });

  });

  suite('clear', function() {

    test('clear', function() {
      var set = new LruSet(deepEqual, hash, 16);
      for (var i = 0; i < 10; i++) {
        set.add(i);
      }
      set.clear();
      assert(set.size() === 0);
    });

  });

  suite('each', function() {

    test('each', function() {
      var set = new LruSet(deepEqual, hash, 16);
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

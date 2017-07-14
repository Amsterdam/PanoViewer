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


var mod = require('../util/mod');


// Creates a new LRU map given an equality predicate, hash function and
// maximum size. An LRU map holds up to a maximum number of items, ordered
// by their age. When the addition of an item would cause the maximum size
// to be exceeded, the new item replaces the oldest item in the map.
// As a special case, an LRU map with maximum size 0 always rejects the
// insertion of an item.
function LruMap(equals, hash, maxsize) {

  if (typeof equals !== 'function') {
    throw new Error('LruMap: bad equals function');
  }
  this._equals = equals;

  if (typeof hash !== 'function') {
    throw new Error('LruMap: bad hash function');
  }
  this._hash = hash;

  if (typeof maxsize != 'number' || isNaN(maxsize) || maxsize < 0) {
    throw new Error('LruMap: bad maximum size');
  }
  this._maxsize = maxsize;

  // Keys and values are stored in circular arrays ordered by decreasing age.
  // Pivot is the index where the next insertion will take place.
  this._keys = [];
  this._values = [];
  this._pivot = 0;
}


LruMap.prototype._modulus = function() {
  if (this._maxsize > this._keys.length) {
    return this._keys.length + 1;
  }
  return this._maxsize;
};


// Returns the value associated to the specified key, or null if not found.
LruMap.prototype.get = function(key) {
  for (var i = 0; i < this._keys.length; i++) {
    var elemKey = this._keys[i];
    if (this._equals(key, elemKey)) {
      var elemValue = this._values[i];
      return elemValue;
    }
  }
  return null;
};


// Sets the specified key to the specified value, replacing either an existing
// item with the same key, or the oldest item when the maximum size would be
// exceeded; the added item becomes the newest. Returns the replaced key if it
// does not equal the inserted key, otherwise null.
//
// If the maximum size is 0, do nothing and return the key.
LruMap.prototype.set = function(key, value) {

  var oldest = null;
  var found = false;

  if (this._maxsize === 0) {
    return key;
  }

  for (var i = 0; i < this._keys.length; i++) {
    var elemKey = this._keys[i];
    if (this._equals(key, elemKey)) {
      var j = i;
      var modulus = this._modulus();
      while (j !== this._pivot) {
        var k = mod(j + 1, modulus);
        this._keys[j] = this._keys[k];
        this._values[j] = this._values[k];
        j = k;
      }
      found = true;
      break;
    }
  }

  if (!found) {
    oldest = this._pivot < this._keys.length ? this._keys[this._pivot] : null;
  }

  this._keys[this._pivot] = key;
  this._values[this._pivot] = value;
  this._pivot = mod(this._pivot + 1, this._modulus());

  return oldest;
};


// Removes the item associated with the specified key.
// Returns the removed value, or null if not found.
LruMap.prototype.del = function(key) {
  for (var i = 0; i < this._keys.length; i++) {
    var elemKey = this._keys[i];
    if (this._equals(key, elemKey)) {
      var elemValue = this._values[i];
      for (var j = i; j < this._keys.length - 1; j++) {
        this._keys[j] = this._keys[j + 1];
        this._values[j] = this._values[j + 1];
      }
      this._keys.length = this._keys.length - 1;
      this._values.length = this._values.length - 1;
      if (i < this._pivot) {
        this._pivot = mod(this._pivot - 1, this._modulus());
      }
      return elemValue;
    }
  }
  return null;
};


// Returns whether there is a value associated with the specified key.
LruMap.prototype.has = function(key) {
  for (var i = 0; i < this._keys.length; i++) {
    var elemKey = this._keys[i];
    if (this._equals(key, elemKey)) {
      return true;
    }
  }
  return false;
};


// Returns the number of items in the map.
LruMap.prototype.size = function() {
  return this._keys.length;
};


// Removes all items from the map.
LruMap.prototype.clear = function() {
  this._keys.length = 0;
  this._values.length = 0;
  this._pivot = 0;
};


// Calls fn(key, value) for each item in the map, in an undefined order.
// Returns the number of times fn was called.
// The result is undefined if the map is mutated during iteration.
LruMap.prototype.each = function(fn) {
  var count = 0;
  for (var i = 0; i < this._keys.length; i++) {
    var key = this._keys[i];
    var value = this._values[i];
    fn(key, value);
    count += 1;
  }
  return count;
};


module.exports = LruMap;

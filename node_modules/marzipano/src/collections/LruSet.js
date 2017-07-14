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


// Creates a new LRU set given an equality predicate, hash function and
// maximum size. An LRU set holds up to a maximum number of items, ordered
// by their age. When the addition of an item would cause the maximum size
// to be exceeded, the new item replaces the oldest item in the set.
// As a special case, an LRU set with maximum size 0 always rejects the
// insertion of an item.
function LruSet(equals, hash, maxsize) {

  if (typeof equals !== 'function') {
    throw new Error('LruSet: bad equals function');
  }
  this._equals = equals;

  if (typeof hash !== 'function') {
    throw new Error('LruSet: bad hash function');
  }
  this._hash = hash;

  if (typeof maxsize != 'number' || isNaN(maxsize) || maxsize < 0) {
    throw new Error('LruSet: bad maximum size');
  }
  this._maxsize = maxsize;

  // Items are stored in a circular array ordered by decreasing age.
  // Pivot is the index where the next insertion will take place.
  this._items = [];
  this._pivot = 0;
}


LruSet.prototype._modulus = function() {
  if (this._maxsize > this._items.length) {
    return this._items.length + 1;
  }
  return this._maxsize;
};


// Adds an item, replacing either an existing equal item, or the oldest item
// when the maximum size would be exceeded; the added item becomes the newest.
// Returns the replaced item if it does not equal the inserted item, otherwise
// null.
//
// If the maximum size is 0, do nothing and return the item.
LruSet.prototype.add = function(item) {

  var oldest = null;
  var found = false;

  if (this._maxsize === 0) {
    return item;
  }

  for (var i = 0; i < this._items.length; i++) {
    var elem = this._items[i];
    if (this._equals(item, elem)) {
      var j = i;
      var modulus = this._modulus();
      while (j !== this._pivot) {
        var k = mod(j + 1, modulus);
        this._items[j] = this._items[k];
        j = k;
      }
      found = true;
      break;
    }
  }

  if (!found) {
    oldest = this._pivot < this._items.length ? this._items[this._pivot] : null;
  }

  this._items[this._pivot] = item;
  this._pivot = mod(this._pivot + 1, this._modulus());

  return oldest;
};


// Removes an item.
// Returns the removed item, or null if the item was not found.
LruSet.prototype.remove = function(item) {
  for (var i = 0; i < this._items.length; i++) {
    var elem = this._items[i];
    if (this._equals(item, elem)) {
      for (var j = i; j < this._items.length - 1; j++) {
        this._items[j] = this._items[j + 1];
      }
      this._items.length = this._items.length - 1;
      if (i < this._pivot) {
        this._pivot = mod(this._pivot - 1, this._modulus());
      }
      return elem;
    }
  }
  return null;
};


// Returns whether an item is in the set.
LruSet.prototype.has = function(item) {
  for (var i = 0; i < this._items.length; i++) {
    var elem = this._items[i];
    if (this._equals(item, elem)) {
      return true;
    }
  }
  return false;
};


// Returns the number of items in the set.
LruSet.prototype.size = function() {
  return this._items.length;
};


// Removes all items from the set.
LruSet.prototype.clear = function() {
  this._items.length = 0;
  this._pivot = 0;
};


// Calls fn(item) for each item in the set, in an undefined order.
// Returns the number of times fn was called.
// The result is undefined if the set is mutated during iteration.
LruSet.prototype.each = function(fn) {
  var count = 0;
  for (var i = 0; i < this._items.length; i++) {
    var item = this._items[i];
    fn(item);
    count += 1;
  }
  return count;
};


module.exports = LruSet;

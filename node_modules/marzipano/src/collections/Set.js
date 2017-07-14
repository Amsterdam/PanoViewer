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


var defaultBuckets = 32;


// Creates a new set given an equality predicate and hash function.
function Set(equals, hash, nbuckets) {

  if (typeof equals !== 'function') {
    throw new Error('Set: bad equals function');
  }
  this._equals = equals;

  if (typeof hash !== 'function') {
    throw new Error('Set: bad hash function');
  }
  this._hash = hash;

  if (nbuckets != null) {
    if (typeof nbuckets != 'number' || isNaN(nbuckets) || nbuckets < 1) {
      throw new Error('Set: bad number of buckets');
    }
    this._nbuckets = nbuckets;
  } else {
    this._nbuckets = defaultBuckets;
  }

  this._buckets = [];
  for (var i = 0; i < this._nbuckets; i++) {
    this._buckets.push([]);
  }

}


Set.prototype._hashmod = function(x) {
  return this._hash(x) % this._nbuckets;
};


// Adds an item, replacing an existing item.
// Returns the replaced item, or null if no item was replaced.
Set.prototype.add = function(item) {
  var h = this._hashmod(item);
  var bucket = this._buckets[h];
  for (var i = 0; i < bucket.length; i++) {
    var elem = bucket[i];
    if (this._equals(item, elem)) {
      bucket[i] = item;
      return elem;
    }
  }
  bucket.push(item);
  return null;
};


// Removes an item.
// Returns the removed item, or null if the item was not found.
Set.prototype.remove = function(item) {
  var h = this._hashmod(item);
  var bucket = this._buckets[h];
  for (var i = 0; i < bucket.length; i++) {
    var elem = bucket[i];
    if (this._equals(item, elem)) {
      // Splice manually to avoid Array#splice return value allocation.
      for (var j = i; j < bucket.length - 1; j++) {
        bucket[j] = bucket[j+1];
      }
      bucket.length = bucket.length - 1;
      return elem;
    }
  }
  return null;
};


// Returns whether an item is in the set.
Set.prototype.has = function(item) {
  var h = this._hashmod(item);
  var bucket = this._buckets[h];
  for (var i = 0; i < bucket.length; i++) {
    var elem = bucket[i];
    if (this._equals(item, elem)) {
      return true;
    }
  }
  return false;
};


// Returns the number of items in the set.
Set.prototype.size = function() {
  var size = 0;
  for (var i = 0; i < this._nbuckets; i++) {
    var bucket = this._buckets[i];
    size += bucket.length;
  }
  return size;
};


// Removes all items.
Set.prototype.clear = function() {
  for (var i = 0; i < this._nbuckets; i++) {
    var bucket = this._buckets[i];
    bucket.length = 0;
  }
};


// Calls fn(item) for each item in the set, in an undefined order.
// Returns the number of times fn was called.
// The result is undefined if the set is mutated during iteration.
Set.prototype.each = function(fn) {
  var count = 0;
  for (var i = 0; i < this._nbuckets; i++) {
    var bucket = this._buckets[i];
    for (var j = 0; j < bucket.length; j++) {
      var item = bucket[j];
      fn(item);
      count += 1;
    }
  }
  return count;
};


module.exports = Set;

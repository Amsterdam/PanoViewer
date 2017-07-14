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


// Creates a new map given an equality predicate and hash function.
function Map(equals, hash, nbuckets) {

  if (typeof equals !== 'function') {
    throw new Error('Map: bad equals function');
  }
  this._equals = equals;

  if (typeof hash !== 'function') {
    throw new Error('Map: bad hash function');
  }
  this._hash = hash;

  if (nbuckets != null) {
    if (typeof nbuckets != 'number' || isNaN(nbuckets) || nbuckets < 1) {
      throw new Error('Map: bad number of buckets');
    }
    this._nbuckets = nbuckets;
  } else {
    this._nbuckets = defaultBuckets;
  }

  this._keyBuckets = [];
  this._valBuckets = [];
  for (var i = 0; i < this._nbuckets; i++) {
    this._keyBuckets.push([]);
    this._valBuckets.push([]);
  }

}


Map.prototype._hashmod = function(x) {
  return this._hash(x) % this._nbuckets;
};


// Returns the value associated to the specified key, or null if not found.
Map.prototype.get = function(key) {
  var h = this._hashmod(key);
  var keyBucket = this._keyBuckets[h];
  for (var i = 0; i < keyBucket.length; i++) {
    var elemKey = keyBucket[i];
    if (this._equals(key, elemKey)) {
      var valBucket = this._valBuckets[h];
      var elemValue = valBucket[i];
      return elemValue;
    }
  }
  return null;
};


// Sets the specified key to the specified value, replacing the previous value.
// Returns the replaced value, or null if no value was replaced.
Map.prototype.set = function(key, val) {
  var h = this._hashmod(key);
  var keyBucket = this._keyBuckets[h];
  var valBucket = this._valBuckets[h];
  for (var i = 0; i < keyBucket.length; i++) {
    var elemKey = keyBucket[i];
    if (this._equals(key, elemKey)) {
      var elemVal = valBucket[i];
      keyBucket[i] = key;
      valBucket[i] = val;
      return elemVal;
    }
  }
  keyBucket.push(key);
  valBucket.push(val);
  return null;
};


// Removes the item associated with the specified key.
// Returns the removed value, or null if not found.
Map.prototype.del = function(key) {
  var h = this._hashmod(key);
  var keyBucket = this._keyBuckets[h];
  var valBucket = this._valBuckets[h];
  for (var i = 0; i < keyBucket.length; i++) {
    var elemKey = keyBucket[i];
    if (this._equals(key, elemKey)) {
      var elemVal = valBucket[i];
      // Splice manually to avoid Array#splice return value allocation.
      for (var j = i; j < keyBucket.length - 1; j++) {
        keyBucket[j] = keyBucket[j+1];
        valBucket[j] = valBucket[j+1];
      }
      keyBucket.length = keyBucket.length - 1;
      valBucket.length = valBucket.length - 1;
      return elemVal;
    }
  }
  return null;
};


// Returns whether there is a value associated with the specified key.
Map.prototype.has = function(key) {
  var h = this._hashmod(key);
  var keyBucket = this._keyBuckets[h];
  for (var i = 0; i < keyBucket.length; i++) {
    var elemKey = keyBucket[i];
    if (this._equals(key, elemKey)) {
      return true;
    }
  }
  return false;
};


// Returns the number of items in the map.
Map.prototype.size = function() {
  var size = 0;
  for (var i = 0; i < this._nbuckets; i++) {
    var keyBucket = this._keyBuckets[i];
    size += keyBucket.length;
  }
  return size;
};


// Removes all items from the map.
Map.prototype.clear = function() {
  for (var i = 0; i < this._nbuckets; i++) {
    var keyBucket = this._keyBuckets[i];
    var valBucket = this._valBuckets[i];
    keyBucket.length = 0;
    valBucket.length = 0;
  }
};


// Calls fn(key, value) for each item in the map, in an undefined order.
// Returns the number of times fn was called.
// The result is undefined if the map is mutated during iteration.
Map.prototype.each = function(fn) {
  var count = 0;
  for (var i = 0; i < this._nbuckets; i++) {
    var keyBucket = this._keyBuckets[i];
    var valBucket = this._valBuckets[i];
    for (var j = 0; j < keyBucket.length; j++) {
      var key = keyBucket[j];
      var val = valBucket[j];
      fn(key, val);
      count += 1;
    }
  }
  return count;
};


module.exports = Map;

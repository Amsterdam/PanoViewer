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


var Set = require('./collections/Set');


// Creates a new GraphFinder given an node equality and hash function
// for the graph nodes.
function GraphFinder(equals, hash) {
  this._equals = equals;
  this._hash = hash;

  // The queue of nodes to be explored.
  this._queue = [];

  // The set of nodes already explored.
  this._visited = new Set(equals, hash);

  // Functions to be set by start().
  this._neighborsFun = null;
  this._exploreFun = null;
}


// Start a breadth-first search beginning at firstNode.
// neighborsFun(node) returns a list of neighbors for a node.
// continueFun(node) returns whether a node should be explored.
GraphFinder.prototype.start = function(firstNode, neighborsFun, exploreFun) {

  // Throw if there's a search already in progress.
  if (this._neighborsFun || this._exploreFun) {
    throw new Error('GraphFinder: search already in progress');
  }

  // Reset search state.
  this.reset();

  // Store the functions for use in next().
  this._neighborsFun = neighborsFun;
  this._exploreFun = exploreFun;

  // Push first node into the queue.
  this._queue.push(firstNode);

};


// Reset search state, aborting any search already in progress.
GraphFinder.prototype.reset = function() {
  this._neighborsFun = null;
  this._exploreFun = null;
  this._queue.length = 0;
  this._visited.clear();
};


// Return the next node for the current search, or null if no more nodes.
GraphFinder.prototype.next = function() {

  var queue = this._queue;
  var visited = this._visited;
  var neighborsFun = this._neighborsFun;
  var exploreFun = this._exploreFun;

  // Throw if no search is in progress.
  if (!neighborsFun || !exploreFun) {
    throw new Error('GraphFinder: no search in progress');
  }

  // Explore nodes until there are none left to explore.
  while (queue.length > 0) {

    // Get next node from queue.
    var node = this._queue.shift();

    // Skip already visited nodes.
    if (visited.has(node)) {
      continue;
    }

    // Skip nodes that should not be explored.
    if (!exploreFun(node)) {
      continue;
    }

    // Mark node as visited.
    visited.add(node);

    // Add the neighbors of the node into the queue.
    var neighbors = neighborsFun(node);
    for (var i = 0; i < neighbors.length; i++) {
      queue.push(neighbors[i]);
    }

    // Return the node.
    return node;
  }

  // Nothing left to explore.
  // Reset search state and signal end of search.
  this.reset();
  return null;
};


module.exports = GraphFinder;

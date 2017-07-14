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

var GraphFinder = require('../../src/GraphFinder');

var equals = function(a, b) {
  return a === b;
};

var hash = function(x) {
  return x;
};

var yesFun = function() {
  return true;
};

var noFun = function() {
  return false;
};

var evenFun = function(x) {
  return x % 2 === 0;
};

var neighborsFun = function(adjList, node) {
  return adjList[node] || [];
};

var empty = {};

var konigsberg = {
  0: [ 1, 2, 3 ],
  1: [ 0, 3 ],
  2: [ 0, 3 ],
  3: [ 0, 1, 2 ]
};

suite('GraphFinder', function() {

  test('empty graph', function() {
    var finder = new GraphFinder(equals, hash);
    var neighFun = neighborsFun.bind(null, empty);
    finder.start(0, neighFun, yesFun);
    assert(finder.next() === 0);
    assert(finder.next() === null);
  });

  test('explore all', function() {
    var finder = new GraphFinder(equals, hash);
    var neighFun = neighborsFun.bind(null, konigsberg);
    finder.start(0, neighFun, yesFun);
    var node, nodeList = [];
    while ((node = finder.next()) !== null) {
      nodeList.push(node);
    }
    for (var i = 0; i < 4; i++) {
      assert(nodeList.indexOf(i) >= 0);
    }
  });

  test('explore none', function() {
    var finder = new GraphFinder(equals, hash);
    var neighFun = neighborsFun.bind(null, konigsberg);
    finder.start(0, neighFun, noFun);
    var node, nodeList = [];
    while ((node = finder.next()) !== null) {
      nodeList.push(node);
    }
    assert(nodeList.length === 0);
  });

  test('explore even', function() {
    var finder = new GraphFinder(equals, hash);
    var neighFun = neighborsFun.bind(null, konigsberg);
    finder.start(0, neighFun, evenFun);
    var node, nodeList = [];
    while ((node = finder.next()) !== null) {
      nodeList.push(node);
    }
    assert(nodeList.indexOf(0) >= 0);
    assert(nodeList.indexOf(2) >= 0);
    assert(nodeList.length === 2);
  });

  test('state reset after search', function() {
    // Depends on internals
    var finder = new GraphFinder(equals, hash);
    var neighFun = neighborsFun.bind(empty);
    finder.start(0, neighFun, yesFun);
    finder.next();
    finder.next();
    assert(finder._neighborsFun === null);
    assert(finder._exploreFun === null);
    assert(finder._queue.length === 0);
    assert(finder._visited.size() === 0);
  });

  test('throw when start is called with search in progress', function() {
    var finder = new GraphFinder(equals, hash);
    var neighFun = neighborsFun.bind(empty);
    var explFun = yesFun;
    finder.start(0, neighFun, explFun);
    assert.throws(function() { finder.start(0, neighFun, explFun); });
  });

  test('throw when next is called with no search in progress', function() {
    var finder = new GraphFinder(equals, hash);
    assert.throws(function() { finder.next(); });
  });

});

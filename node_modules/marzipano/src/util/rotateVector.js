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

var vec3 = require('gl-matrix/src/gl-matrix/vec3');
var mat4 = require('gl-matrix/src/gl-matrix/mat4');

// Constant identity matrix.
var identity = mat4.identity(mat4.create());

// Rotation matrix shared by all invocations to rotateVector().
var matrix = mat4.create();

// Rotate a vector around the coordinate axes in YXZ order.
function rotateVector(out, vec, y, x, z) {

  mat4.copy(matrix, identity);

  if (y) {
    mat4.rotateY(matrix, matrix, y);
  }

  if (x) {
    mat4.rotateX(matrix, matrix, x);
  }

  if (z) {
    mat4.rotateZ(matrix, matrix, z);
  }

  vec3.transformMat4(out, vec, matrix);

  return out;
}

module.exports = rotateVector;

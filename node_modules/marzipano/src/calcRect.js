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

// TODO: Think about other possibilities for an API to define the Rect.

function calcRect(totalWidth, totalHeight, spec, result) {

  result = result || {};

  var width;
  if (spec != null && spec.absoluteWidth != null) {
    width = spec.absoluteWidth;
  } else if (spec != null && spec.relativeWidth != null) {
    width = spec.relativeWidth * totalWidth;
  } else {
    width = totalWidth;
  }

  var height;
  if (spec && spec.absoluteHeight != null) {
    height = spec.absoluteHeight;
  } else if (spec != null && spec.relativeHeight != null) {
    height = spec.relativeHeight * totalHeight;
  } else {
    height = totalHeight;
  }

  var x;
  if (spec != null && spec.absoluteX != null) {
    x = spec.absoluteX;
  } else if (spec != null && spec.relativeX != null) {
    x = spec.relativeX * totalWidth;
  } else {
    x = 0;
  }

  var y;
  if (spec != null && spec.absoluteY != null) {
    y = spec.absoluteY;
  } else if (spec != null && spec.relativeY != null) {
    y = spec.relativeY * totalHeight;
  } else {
    y = 0;
  }

  result.height = height;
  result.width = width;
  result.left = x;
  result.top = y;
  result.right = x + width;
  result.bottom = y + height;
  result.totalWidth = totalWidth;
  result.totalHeight = totalHeight;

  return result;
}

module.exports = calcRect;
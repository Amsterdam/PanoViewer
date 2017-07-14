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

var browser = require('bowser');

// Detect CSS pointer-events support.
function checkCssPointerEventsSupported() {

  // Check for existence of CSS property.
  var style = document.createElement('a').style;
  style.cssText = 'pointer-events:auto';
  var hasCssProperty = style.pointerEvents === 'auto';

  // The above result is spurious on emulation mode for IE 8-10.
  var isOldIE = browser.msie && parseFloat(browser.version) < 11;

  return hasCssProperty && !isOldIE;
}

// Cache result.
var supported;
function cssPointerEventsSupported() {
  if (supported !== undefined) {
    return supported;
  }
  return (supported = checkCssPointerEventsSupported());
}

module.exports = cssPointerEventsSupported;

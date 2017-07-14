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

var prefixProperty = require('../util/dom').prefixProperty;

// Detect CSS 3D transforms support. Adapted from Modernizr.
function checkCssSupported() {
  // First, check if the 'perspective' CSS property or a vendor-prefixed
  // variant is available.
  var perspectiveProperty = prefixProperty('perspective');
  var el = document.createElement('div');
  var supported = typeof el.style[perspectiveProperty] !== 'undefined';

  // Certain versions of Chrome disable 3D transforms even though the CSS
  // property exists. In those cases, we use the following media query,
  // which only succeeds if the feature is indeed enabled.
  if (supported && perspectiveProperty === 'WebkitPerspective') {
    var id = '__marzipano_test_css3d_support__';
    var st = document.createElement('style');
    st.textContent = '@media(-webkit-transform-3d){#' + id + '{height: 3px;})';
    document.getElementsByTagName('head')[0].appendChild(st);
    el.id = id;
    document.body.appendChild(el);
    // The offsetHeight seems to be different than 3 at some zoom levels on
    // Chrome (and maybe other browsers). Test for > 0 instead.
    supported = el.offsetHeight > 0;
    st.parentNode.removeChild(st);
    el.parentNode.removeChild(el);
  }

  return supported;
}

// Cache result.
var supported;
function cssSupported() {
  if (supported !== undefined) {
    return supported;
  }
  return (supported = checkCssSupported());
}

module.exports = cssSupported;

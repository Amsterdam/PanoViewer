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

var NetworkError = require('../NetworkError');
var once = require('../util/once');

var FlashImageAsset = require('../assets/FlashImage');

function loadImageFlash(stage, url, rect, done) {
  var flashElement = stage._flashElement;

  var x = rect && rect.x || 0;
  var y = rect && rect.y || 0;
  var width = rect && rect.width || 1;
  var height = rect && rect.height || 1;

  var imageId = flashElement.loadImage(url, width, height, x, y);

  done = once(done);

  // TODO: use a single callback for all imageLoaded events.

  function callback(err, callbackId) {
    // There is a single callback for all load events, so make sure this
    // is the right one.
    if (callbackId !== imageId) {
      return;
    }

    stage._offCallback('imageLoaded', callback);

    // TODO: is there any way to distinguish a network error from other
    // kinds of errors? For now we always return NetworkError since this
    // prevents images to be retried continuously while we are offline.
    if (err) {
      done(new NetworkError('Network error: ' + url));
    } else {
      done(null, new FlashImageAsset(flashElement, imageId));
    }
  }

  stage._onCallback('imageLoaded', callback);

  function cancel() {
    flashElement.cancelImage(imageId);
    stage._offCallback('imageLoaded', callback);
    done.apply(null, arguments);
  }

  return cancel;

}

module.exports = loadImageFlash;
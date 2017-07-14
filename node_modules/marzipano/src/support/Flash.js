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

// Detect supported Flash version. Returns [major, minor, rev] or null.
// Adapted from https://code.google.com/p/swfobject
function detectFlashVersion() {
  var playerVersion = null;

  var plugins = navigator.plugins;
  var mimeTypes = navigator.mimeTypes;

  var d = null;

  if (plugins && plugins['Shockwave Flash'] && mimeTypes &&
      mimeTypes['application/x-shockwave-flash'] &&
      mimeTypes['application/x-shockwave-flash'].enabledPlugin) {
    d = plugins['Shockwave Flash'].description;
    d = d.replace(/^.*\s+(\S+\s+\S+$)/, '$1');
    playerVersion = [0, 0, 0];
    playerVersion[0] = parseInt(d.replace(/^(.*)\..*$/, '$1'), 10);
    playerVersion[1] = parseInt(d.replace(/^.*\.(.*)\s.*$/, '$1'), 10);
    playerVersion[2] = /[a-zA-Z]/.test(d) ? parseInt(d.replace(/^.*[a-zA-Z]+(.*)$/, '$1'), 10) : 0;
  }
  else if (window.ActiveXObject) {
    try {
      var a = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
      if (a && (d = a.GetVariable('$version'))) {
        d = d.split(' ')[1].split(',');
        playerVersion = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
      }
    }
    catch (e) {}
  }

  return playerVersion;
}

// Flash support detection.
function checkFlashSupported() {
  var version = detectFlashVersion();
  // Only support 10.1 and above. Flash 10.0 does not work for some reason.
  return version && (version[0] >= 11 || (version[0] === 10 && version[1] >= 1));
}

// Cache result.
var supported;
function flashSupported() {
  if (supported !== undefined) {
    return supported;
  }
  return (supported = checkFlashSupported());
}

module.exports = flashSupported;

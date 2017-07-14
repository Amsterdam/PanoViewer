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

var mat4 = Marzipano.dependencies.glMatrix.mat4;
var quat = Marzipano.dependencies.glMatrix.quat;

var degToRad = Marzipano.util.degToRad;

var viewerElement = document.querySelector("#pano");
var enterVrElement = document.querySelector("#enter-vr");
var noVrElement = document.querySelector("#no-vr");

// Create stage and register renderers.
var stage = new Marzipano.WebGlStage();
Marzipano.registerDefaultRenderers(stage);

// Insert stage into the DOM.
viewerElement.appendChild(stage.domElement());

// Update the stage size whenever the window is resized.
function updateSize() {
  stage.setSize({ width: viewerElement.clientWidth, height: viewerElement.clientHeight });
}
updateSize();
window.addEventListener('resize', updateSize);

// Create and start the render loop.
var renderLoop = new Marzipano.RenderLoop(stage);
renderLoop.start();

// Create geometry.
var geometry = new Marzipano.CubeGeometry([
  { tileSize: 256, size: 256, fallbackOnly: true },
  { tileSize: 512, size: 512 },
  { tileSize: 512, size: 1024 },
  { tileSize: 512, size: 2048 },
  { tileSize: 512, size: 4096 }
]);

// Create view.
var limiter = Marzipano.RectilinearView.limit.traditional(4096, 110*Math.PI/180);
var viewLeft = new Marzipano.RectilinearView(null, limiter);
var viewRight = new Marzipano.RectilinearView(null, limiter);

// Create layers.
var layerLeft = createLayer(stage, viewLeft, geometry, 'left',
  { relativeWidth: 0.5, relativeX: 0 });
var layerRight = createLayer(stage, viewRight, geometry, 'right',
  { relativeWidth: 0.5, relativeX: 0.5 });

// Add layers into stage.
stage.addLayer(layerLeft);
stage.addLayer(layerRight);

// Query browser for VR devices.
var vrDevices = null;
getHMD().then(function(detectedDevices) {
  vrDevices = detectedDevices;

  // Set the projection center.
  if (vrDevices.hmd) {
    setProjectionCenter(viewLeft, vrDevices.hmd.getEyeParameters("left"));
    setProjectionCenter(viewRight, vrDevices.hmd.getEyeParameters("right"));
  }

  // Update view on movements.
  if (vrDevices.positionSensor) {
    requestAnimationFrame(syncViewWithPositionSensor);
  }

  enterVrElement.style.display = vrDevices.hmd ? 'block' : 'none';
  noVrElement.style.display = vrDevices.hmd ? 'none' : 'block';
});

// Lock the screen orientation.
if (screen.orientation && screen.orientation.lock) {
  screen.orientation.lock('landscape');
}

// Prevent display from sleeping on mobile devices.
var wakeLock = new WakeLock();
wakeLock.request();

// Enter fullscreen mode when available.
enterVrElement.addEventListener('click', function() {
  if (viewerElement.mozRequestFullScreen) {
    viewerElement.mozRequestFullScreen({ vrDisplay: vrDevices.hmd });
  }
  else if (viewerElement.webkitRequestFullscreen) {
    console.log("vrDisplay", vrDevices.hmd);
    viewerElement.webkitRequestFullscreen({ vrDisplay: vrDevices.hmd });
  }
});

function createLayer(stage, view, geometry, eye, rect) {
  var urlPrefix = "//www.marzipano.net/media/music-room";
  var source = new Marzipano.ImageUrlSource.fromString(
    urlPrefix + "/" + eye + "/{z}/{f}/{y}/{x}.jpg",
    { cubeMapPreviewUrl: urlPrefix + "/" + eye + "/preview.jpg" });

  var textureStore = new Marzipano.TextureStore(geometry, source, stage);
  var layer = new Marzipano.Layer(stage, source, geometry, view, textureStore,
    { effects: { rect: rect }});

  layer.pinFirstLevel();

  return layer;
}

function setProjectionCenter(view, eyeParameters) {
  var fovs = eyeParameters.recommendedFieldOfView;

  var left = degToRad(fovs.leftDegrees),
      right = degToRad(fovs.rightDegrees),
      up = degToRad(fovs.upDegrees),
      down = degToRad(fovs.downDegrees);

  var hfov = left + right;
  var offsetAngleX = left - hfov/2;
  var projectionCenterX = Math.tan(offsetAngleX) / (2 * Math.tan(hfov/2));

  var vfov = up + down;
  var offsetAngleY = up - vfov/2;
  var projectionCenterY = Math.tan(offsetAngleY) / (2 * Math.tan(vfov/2));

  view.setParameters({
    projectionCenterX: projectionCenterX,
    projectionCenterY: projectionCenterY,
    fov: vfov
  });
}

var positionSensorQuartenion = quat.create();
var positionSensorMatrix = mat4.create();
var positionSensorParameters = {};

function syncViewWithPositionSensor() {
  var state = vrDevices.positionSensor.getState();

  if (state.hasOrientation) {
    if (state.orientation) {
      var o = state.orientation;
      quat.set(positionSensorQuartenion, o.x, o.y, o.z, o.w);
      mat4.fromQuat(positionSensorMatrix, positionSensorQuartenion);

      eulerFromMat4(positionSensorMatrix, positionSensorParameters);

      var parameters = {
        yaw: -positionSensorParameters._y,
        pitch: -positionSensorParameters._x,
        roll: -positionSensorParameters._z
      };

      viewLeft.setParameters(parameters);
      viewRight.setParameters(parameters);
    }
  }
  requestAnimationFrame(syncViewWithPositionSensor);
}

function getHMD() {
  return new Promise(function(resolve, reject) {
    var detectedHmd = null;
    var detectedPositionSensor = null;

    navigator.getVRDevices().then(function(devices) {
      var i;
      for (i = 0; i < devices.length; i++) {
        if (devices[i] instanceof HMDVRDevice) {
          detectedHmd = devices[i];
          break;
        }
      }
      for (i = 0; i < devices.length; i++) {
        if (devices[i] instanceof PositionSensorVRDevice) {
          detectedPositionSensor = devices[i];
          break;
        }
      }
      resolve({ hmd: detectedHmd, positionSensor: detectedPositionSensor });
    }, function() {
      resolve({});
    });
  });
}

// Adapted from Three.js
// https://github.com/mrdoob/three.js/blob/master/src/math/Euler.js
// Assumes the upper 3x3 of m is a pure (unscaled) rotation matrix.
function eulerFromMat4(m, result) {
  var m11 = m[0], m12 = m[4], m13 = m[8];
  var m21 = m[1], m22 = m[5], m23 = m[9];
  var m31 = m[2], m32 = m[6], m33 = m[10];

  var m23clamped = ((m23 < -1) ? -1 : ((m23 > 1) ? 1 : m23));
  result._x = Math.asin(-m23clamped);
  if (Math.abs(m23) < 0.99999 ) {
    result._y = Math.atan2(m13, m33);
    result._z = Math.atan2(m21, m22);
  } else {
    result._y = Math.atan2(-m31, m11);
    result._z = 0;
  }
};

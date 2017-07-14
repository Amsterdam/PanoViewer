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

// These are used to set the WebGl depth for a tile.
var MAX_LAYERS = 256; // Max number of layers per stage.
var MAX_LEVELS = 256; // Max number of levels per layer.

var pixelRatio = require('../util/pixelRatio');
var clamp = require('../util/clamp');
var vec4 = require('gl-matrix/src/gl-matrix/vec4');
var vec3 = require('gl-matrix/src/gl-matrix/vec3');
var mat4 = require('gl-matrix/src/gl-matrix/mat4');


function createShader(gl, type, src) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw gl.getShaderInfoLog(shader);
  }
  return shader;
}


function createShaderProgram(gl, vertexSrc, fragmentSrc, attribList, uniformList) {

  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSrc);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);

  var shaderProgram = gl.createProgram();

  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw gl.getProgramInfoLog(shaderProgram);
  }

  for (var i = 0; i < attribList.length; i++) {
    var attrib = attribList[i];
    shaderProgram[attrib] = gl.getAttribLocation(shaderProgram, attrib);
    gl.enableVertexAttribArray(shaderProgram[attrib]);
  }

  for (var j = 0; j < uniformList.length; j++) {
    var uniform = uniformList[j];
    shaderProgram[uniform] = gl.getUniformLocation(shaderProgram, uniform);
  }

  return shaderProgram;
}


function destroyShaderProgram(gl, shaderProgram) {
  var shaderList = gl.getAttachedShaders(shaderProgram);
  for (var i = 0; i < shaderList.length; i++) {
    var shader = shaderList[i];
    gl.detachShader(shaderProgram, shader);
    gl.deleteShader(shader);
  }
  gl.deleteProgram(shaderProgram);
}


function createConstantBuffer(gl, target, usage, value) {
  var buffer = gl.createBuffer();
  gl.bindBuffer(target, buffer);
  gl.bufferData(target, value, usage);
  return buffer;
}


function createConstantBuffers(gl, vertexIndices, vertexPositions, textureCoords) {
  return {
    vertexIndices: createConstantBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW, new Uint16Array(vertexIndices)),
    vertexPositions: createConstantBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, new Float32Array(vertexPositions)),
    textureCoords: createConstantBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, new Float32Array(textureCoords))
  };
}


function destroyConstantBuffers(gl, constantBuffers) {
  gl.deleteBuffer(constantBuffers.vertexIndices);
  gl.deleteBuffer(constantBuffers.vertexPositions);
  gl.deleteBuffer(constantBuffers.textureCoords);
}


function setTexture(gl, shaderProgram, texture) {
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture._texture);
  gl.uniform1i(shaderProgram.uSampler, 0);
}


function setDepth(gl, shaderProgram, layerZ, tileZ) {
  var depth = (((layerZ + 1) * MAX_LEVELS) - tileZ) / (MAX_LEVELS * MAX_LAYERS);
  gl.uniform1f(shaderProgram.uDepth, depth);
}

var defaultOpacity = 1.0;
var defaultColorOffset = vec4.create();
var defaultColorMatrix = mat4.create();
mat4.identity(defaultColorMatrix);

function setupPixelEffectUniforms(gl, effects, uniforms) {
  var opacity = defaultOpacity;
  if (effects && effects.opacity != null) {
    opacity = effects.opacity;
  }
  gl.uniform1f(uniforms.opacity, opacity);

  var colorOffset = defaultColorOffset;
  if (effects && effects.colorOffset) {
    colorOffset = effects.colorOffset;
  }
  gl.uniform4fv(uniforms.colorOffset, colorOffset);

  var colorMatrix = defaultColorMatrix;
  if (effects && effects.colorMatrix) {
    colorMatrix = effects.colorMatrix;
  }
  gl.uniformMatrix4fv(uniforms.colorMatrix, false, colorMatrix);
}



// This function returns a matrix that the vertex shader can use to compensate
// the viewpoer clamping

var viewportParameters = {};

function setViewport(gl, layer, rect, viewportMatrix) {
  var ratio = pixelRatio();
  // Setting a negative offset on the viewport causes rendering problems
  // Using a negative offset, the viewport size is larger than it should and
  // rendering occurs outside the rect area
  // This happens on all browsers as of 2015-04

  // To solve this, one must clamp the viewport and compensate the clamping
  // on the vertex shader by offsetting and scaling the vertexes.

  // Offsets larger than the total size and sizes which cause the viewport to
  // be larger than the canvas do not seem to cause any rendering problems.
  // However, this may still have a performance impact. Therefore, the maximum
  // values are also clamped.

  rectToViewport(rect, viewportParameters, viewportMatrix);
  gl.viewport(ratio * viewportParameters.offsetX,
              ratio * viewportParameters.offsetY,
              ratio * viewportParameters.width,
              ratio * viewportParameters.height);
}

// Temporary vectors for rectToViewport
var translateVector = vec3.create();
var scaleVector = vec3.create();

function rectToViewport(rect, resultParameters, resultViewportMatrix) {
  // Horizontal axis.
  var offsetX = rect.left;
  var totalWidth = rect.totalWidth;
  var clampedOffsetX = clamp(offsetX, 0, totalWidth);

  var widthWithoutDiscarded = rect.width - (clampedOffsetX - offsetX);
  var maxWidth = totalWidth - clampedOffsetX;

  var clampedWidth = clamp(widthWithoutDiscarded, 0, maxWidth);

  resultParameters.offsetX = clampedOffsetX;
  resultParameters.width = clampedWidth;

  // Vertical axis.
  var offsetY = rect.totalHeight - rect.bottom;
  var totalHeight = rect.totalHeight;
  var clampedOffsetY = clamp(offsetY, 0, totalHeight);

  var heightWithoutDiscarded = rect.height - (clampedOffsetY - offsetY);
  var maxHeight = totalHeight - clampedOffsetY;

  var clampedHeight = clamp(heightWithoutDiscarded, 0, maxHeight);

  resultParameters.offsetY = clampedOffsetY;
  resultParameters.height = clampedHeight;

  // Compensation matrix for shader.
  // This matrix is used to scale and offset the vertices by the necessary
  // amount to compensate the viewport clamping.

  // Scaling is easy. Just revert the scaling that a smaller viewport would
  // cause.
  scaleVector[0] = rect.width / clampedWidth;
  scaleVector[1] = rect.height / clampedHeight;
  scaleVector[2] = 1;

  // Translating is more complicated. The center of the view will be at
  // the center of the viewport, but it should actually be offset according
  // to rect. One translation is be required to compensate for clamping at the
  // beginning of the viewport and another for clamping at the end of the
  // viewport. The two are calculated and subtracted.

  // Horizontal axis translation compensation.
  var leftClampCompensation = clampedOffsetX - offsetX;

  var rightmost = offsetX + rect.width;
  var clampedRightmost = clampedOffsetX + clampedWidth;
  var rightClampCompensation = rightmost - clampedRightmost;

  // Vertical axis translation compensation.
  var bottomClampCompensation = clampedOffsetY - offsetY;

  var topmost = offsetY + rect.height;
  var clampedTopmost = clampedOffsetY + clampedHeight;
  var topClampCompensation = topmost - clampedTopmost;

  // Divide by the viewport size to convert from pixels to viewport coordinates.
  translateVector[0] = (rightClampCompensation - leftClampCompensation)/clampedWidth;
  translateVector[1] = (topClampCompensation - bottomClampCompensation)/clampedHeight;
  translateVector[2] = 0;

  var viewportMatrix = resultViewportMatrix;
  mat4.identity(viewportMatrix);
  mat4.translate(viewportMatrix, viewportMatrix, translateVector);
  mat4.scale(viewportMatrix, viewportMatrix, scaleVector);
}


module.exports = {
  createShaderProgram: createShaderProgram,
  destroyShaderProgram: destroyShaderProgram,
  createConstantBuffers: createConstantBuffers,
  destroyConstantBuffers: destroyConstantBuffers,
  setTexture: setTexture,
  setDepth: setDepth,
  setViewport: setViewport,
  setupPixelEffectUniforms: setupPixelEffectUniforms
};

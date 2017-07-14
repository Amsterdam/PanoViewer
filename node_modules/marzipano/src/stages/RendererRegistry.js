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

/**
 * A RendererRegistry maps ({@link Geometry}, {@link View}) pairs into
 * {@link Renderer}. It is used by the {@Stage} implementations to determine
 * the appropriate renderer for a {@link Layer}. The initialization logic is
 * in `src/renderers/registerDefaultRenderers`.
 */
function RendererRegistry() {
  this._renderers = {};
}

RendererRegistry.prototype.set = function(geometryType, viewType, Renderer) {
  if (!this._renderers[geometryType]) {
    this._renderers[geometryType] = {};
  }
  this._renderers[geometryType][viewType] = Renderer;
};

RendererRegistry.prototype.get = function(geometryType, viewType) {
  var Renderer = this._renderers[geometryType] && this._renderers[geometryType][viewType];
  return Renderer || null;
};

module.exports = RendererRegistry;

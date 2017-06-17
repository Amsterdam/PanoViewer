/**
 * ## Private
 * - A way to make ajax calls
 * - determine url
 * - fetch panorama
 * ## Public
 * - Pano object
 * - config update
 * - load pano with location fov, skew, yan
 * - callback on change
 */
(function (window, undefined) {
    'use strict';

    var pano,
        viewer,
        scene,
        view;

    const degree_to_radian = Math.PI / 180;

    // Configuration
    const config = {
        API_ROOT: 'https://api.data.amsterdam.nl/',
        PANO_URI: 'panorama/recente_opnames/alle/',
        DEFAULT_FOV: 80,
        MAX_FOV: 90,
        MAX_RESOLUTION: 12 * 1024,
        CAMERA_HEIGHT: 1.8,
        LEVEL_PROPERTIES_LIST: [
            {tileSize: 256, size: 256, fallbackOnly: true},
            {tileSize: 512, size: 512},
            {tileSize: 512, size: 1024},
            {tileSize: 512, size: 2048}
        ]
    };

    // Private
    const ajax = function(url, success_callback, error_callback) {
        let request = new XMLHttpRequest();
 
        request.onreadystatechange = function() {
            let response;
            if(request.readyState === XMLHttpRequest.DONE) {
                // Loading the response and trying to parse it
                try {
                    response = JSON.parse(request.responseText);
                }  catch (e) {
                    response = {
                        response: request.responseText,
                        error: e
                    };
                }
                if(request.status === 200) {
                    success_callback(response);
                } else {
                    error_callback(response, request.status);
                } 
            }
        }
        request.open('GET', url);
        request.send();
    };

    // Public
    const updateConfig = function (configUpdate) {
        
    }
    const init = function (element_id) {
        const panoElement = document.getElementById('pano');
        const viewerOpts = {
            controls: {
                mouseViewMode: 'drag'    // drag|qtvr
            },
            stageType: null,
            stage: {
                preserveDrawingBuffer: true
            }
        };

        viewer = new Marzipano.Viewer(panoElement, viewerOpts);
        getImageDataByLocation([52.3730353, 4.8932471], 100);
    }

    const getImageDataByLocation = function (location, cappedRadius, callback) {
        var url = config.API_ROOT + config.PANO_URI + '?lat=' +
                location[0] + '&lon=' + location[1] + '&radius=' + cappedRadius;
        
        const updatePanoData = function (response) {
            console.log('Success callback', response);
            const formattedGeometrie = {
                coordinates: [
                    response.geometrie.coordinates[1],
                    response.geometrie.coordinates[0]
                ],
                type: response.geometrie.type
            };
            const data = {
                date: new Date(response.timestamp),
                id: response.pano_id,
                hotspots: response.adjacent.map(function (item) {
                    return {
                        id: item.pano_id,
                        heading: item.heading,
                        distance: item.distance,
                        year: item.year
                    };
                }),
                location: getCenter(formattedGeometrie),
                image: response.image_sets.cubic
            };
            loadScene(data.image, response.heading, response.pitch, config.DEFAULT_FOV, data.hotspots);
        }
        const errorReport = function (data) {
            console.log(data);
        }
        ajax(url, updatePanoData, errorReport);
    }

    function createHotspotTemplate (sceneId, distance, pitch, year) {
            var q,
                html,
                element,
                scope;

            q = $q.defer();

            element = $document[0].createElement('dp-hotspot');
            element.setAttribute('scene-id', 'sceneId');
            element.setAttribute('distance', 'distance');
            element.setAttribute('pitch', 'pitch');
            element.setAttribute('year', 'year');

            scope = $rootScope.$new();
            scope.sceneId = sceneId;
            scope.distance = distance;
            scope.pitch = pitch;
            scope.year = year;

            html = $compile(element)(scope)[0];

            scope.$applyAsync(function () {
                q.resolve(html);
            });

            return q.promise;
        }

    function loadScene (image, heading, pitch, fov, hotspots) {
        const source = Marzipano.ImageUrlSource.fromString(
            image.pattern, {cubeMapPreviewUrl: image.preview}
        );
        console.log(image.pattern);
        const viewLimiter = Marzipano.RectilinearView.limit.traditional(
            config.MAX_RESOLUTION,
            degree_to_radian * config.MAX_FOV
        );

        view = new Marzipano.RectilinearView({}, viewLimiter);

        scene = viewer.createScene({
            source: source,
            geometry: new Marzipano.CubeGeometry(config.LEVEL_PROPERTIES_LIST),
            view: view,
            pinFirstLevel: true
        });

        hotspots.sort(function (hotspotA, hotspotB) {
                return hotspotB.distance - hotspotA.distance;
            }).forEach(function (hotspot) {
                const hotspotPitch = calculateHotspotPitch(STRAATBEELD_CONFIG.CAMERA_HEIGHT, hotspot.distance);

                createHotspotTemplate(hotspot.id, hotspot.distance, hotspotPitch, hotspot.year)
                    .then(function (template) {
                        var position = {
                            yaw: angleConversion.degreesToRadians(hotspot.heading),
                            pitch: hotspotPitch
                        };

                        scene.hotspotContainer().createHotspot(
                            template,
                            position
                        );
                    });
            });

        view.setYaw(degree_to_radian * heading);
        view.setPitch(degree_to_radian * pitch);
        view.setFov(degree_to_radian * fov);

        scene.switchTo();
        console.log('Scene loaded');
    }

    //=========
    // Utility
    //=========
    function isNumeric(obj) {
        return !isNaN(obj - parseFloat(obj));
    }

    function getCenter (geoJSON) {
        var xValues = [],
            yValues = [],
            xMin,
            yMin,
            xMax,
            yMax;

        if (geoJSON.type === 'Point') {
            xValues.push(geoJSON.coordinates[0]);
            yValues.push(geoJSON.coordinates[1]);
        } else {
            getCoordinates(geoJSON.coordinates);
        }

        xValues.sort();
        yValues.sort();

        xMin = xValues[0];
        yMin = yValues[0];

        xMax = xValues[xValues.length - 1];
        yMax = yValues[yValues.length - 1];

        return [
            xMin + (xMax - xMin) / 2,
            yMin + (yMax - yMin) / 2
        ];

        function getCoordinates (coordinates) {
            var isCoordinate = coordinates.length === 2 &&
                isNumeric(coordinates[0]) &&
                isNumeric(coordinates[1]);

            if (isCoordinate) {
                xValues.push(coordinates[0]);
                yValues.push(coordinates[1]);
            } else {
                // We have to go deeper recursively; two levels for Polygons, three levels for MultiPolygons
                coordinates.forEach(getCoordinates);
            }
        }
    }

    window.Pano = {
        init,
        updateConfig,
        getImageDataByLocation,
        viewer,
        view,
        scene
    };

})(window);

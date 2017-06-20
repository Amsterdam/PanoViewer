
const degree_to_radian = Math.PI / 180;

function isNumeric (obj) {
    return !isNaN(obj - parseFloat(obj));
}

function getCenter (geoJSON) {
    const xValues = [],
        yValues = [];

    if (geoJSON.type === 'Point') {
        xValues.push(geoJSON.coordinates[0]);
        yValues.push(geoJSON.coordinates[1]);
    } else {
        processCoordinates(geoJSON.coordinates);
    }

    xValues.sort();
    yValues.sort();
    const  xMin = xValues[0],
        yMin = yValues[0],
        xMax = xValues[xValues.length - 1],
        yMax = yValues[yValues.length - 1];

    return [
        xMin + (xMax - xMin) / 2,
        yMin + (yMax - yMin) / 2
    ];

    function processCoordinates (coordinates) {
        const isCoordinate = coordinates.length === 2 &&
            this.isNumeric(coordinates[0]) && this.isNumeric(coordinates[1]);

        if (isCoordinate) {
            xValues.push(coordinates[0]);
            yValues.push(coordinates[1]);
        } else {
            // We have to go deeper recursively; two levels for Polygons, three levels for MultiPolygons
            coordinates.forEach(processCoordinates);
        }
    }
}

/**
 * Returns a dom element to insert the panorama viewer
 * supports DOM element, id and class both as name or
 * with # / . notation before. If no element could be
 * found returns undefined
 */
function getElement (insertion) {
    let element;
    // If its already a dom element its all good
    if (insertion) {
        if (insertion instanceof HTMLElement) {
            return insertion;
        }
        // checking if # or . is used
        if (insertion[0] === '#') {
            return document.getElementById(insertion.slice(1));
        } else if (insertion[0] === '.') {
            return document.getElementsByClassName(insertion.slice(1))[0];
        }
        // Trying id
        element = document.getElementById(insertion);
    }
    // If found return it, otherwise go with class name
    return (element)? element : document.getElementsByClassName(insertion)[0];
}

export {isNumeric, getCenter, getElement, degree_to_radian};

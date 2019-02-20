
const degreeToRadian = Math.PI / 180;

function isNumeric(obj) {
    return !isNaN(obj - parseFloat(obj));
}

/**
 * Returns a dom element to insert the panorama viewer
 * Supports DOM element, id and class both as name or
 * with # / . notation before. If no element could be
 * found returns undefined
 */
function getElement(elementId) {
    let element;
    if (elementId) {
        // If its already a dom element its all good
        if (elementId instanceof HTMLElement) {
            return elementId;
        }
        // checking if # or . is used
        if (elementId[0] === '#') {
            return document.getElementById(elementId.slice(1));
        } else if (elementId[0] === '.') {
            return document.getElementsByClassName(elementId.slice(1))[0];
        }
        // Trying id
        element = document.getElementById(elementId);
    }
    // If found return it, otherwise go with class name
    return element || document.getElementsByClassName(elementId)[0];
}

export { isNumeric, getElement, degreeToRadian };

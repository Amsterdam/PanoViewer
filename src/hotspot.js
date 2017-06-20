const scaleFactor = 10.0;

class Hotspot {
    
    constructor (hotspotId, cameraHeight, distance, heading, year, hotspotNodeType, scaleToDistance) {
        this.hotspotNodeType = 'div';
        this.scaleToDistance = true;
        this.pitchCorrection = Math.PI / 180 / 2;
        this.scale = '';

        // @TODO add sanity checks
        this.id = hotspotId;
        this.cameraHeight = cameraHeight;
        this.distance = distance;
        this.year = year;
        this.pitch = this.constructor._calculateHotspotPitch(cameraHeight, distance);
        this.position = {
            yaw: heading * Math.PI / 180,
            pitch: this.pitch
        };
        this.hotspotNodeType = hotspotNodeType || this.hotspotNodeType;
        this.scaleToDistance = scaleToDistance || this.scaleToDistance;
        // Create the element
        this.createDomElement();
    }

    createDomElement () {
        const element = document.createElement(this.hotspotNodeType);
        element.setAttribute('class', 'c-panoviewer-hotspot');
        element.setAttribute('data-scene-id', this.id);
        element.setAttribute('data-distance', this.distance);
        element.setAttribute('data-pitch', this.pitch);
        element.setAttribute('data-year', this.year);
        const innerDiv = document.createElement('button');
        innerDiv.setAttribute('class', 'c-panoviewer-hotspot__content')
        // Scale size if needed
        if (this.scaleToDistance) {
            const angle = Math.PI / 2 -  this.pitch - (this.pitchCorrection * this.distance);
            const rotate = 'rotateX(' + angle + 'rad)';
            const scale = 'scale(' + scaleFactor / (this.distance) + ')';
            innerDiv.setAttribute('style', 'transform: '+ rotate + ' ' + scale + ';');
            element.appendChild(innerDiv);
        } else {
            console.log('No scaling needed');
        }
        this.element = element;
    }

    render () {
        if (!this.element) {
            this.createDomElement();
        }
        if (this.outerHTML) {
            return this.outerHTML;
        } else {
            console.log('Need manual rendering');
        }
    }

    /**
     * Calculates the pitch to the hotspot based on the camera
     * height and the distance to the hotspot
     */
    static _calculateHotspotPitch (cameraHeight, distance) {
        return Math.atan(cameraHeight / distance);
    }
}

export default Hotspot;

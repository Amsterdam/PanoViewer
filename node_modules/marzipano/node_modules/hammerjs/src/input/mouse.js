var MOUSE_INPUT_MAP = {
    mousedown: INPUT_START,
    mousemove: INPUT_MOVE,
    mouseup: INPUT_END
};

var MOUSE_ELEMENT_EVENTS = 'mousedown';
var MOUSE_WINDOW_EVENTS = 'mousemove mouseup';

var isIE8 = window.navigator.userAgent.indexOf('MSIE 8') > 0;

/**
 * Mouse events input
 * @constructor
 * @extends Input
 */
function MouseInput() {
    this.evEl = MOUSE_ELEMENT_EVENTS;

    if (isIE8) {
        // mousemove and moveup don't bubble to the window in IE8 - attach events to the document.body instead
        this.evDoc = MOUSE_WINDOW_EVENTS;
    } else {
        this.evWin = MOUSE_WINDOW_EVENTS;
    }

    this.allow = true; // used by Input.TouchMouse to disable mouse events
    this.pressed = false; // mousedown state

    Input.apply(this, arguments);
}

inherit(MouseInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function MEhandler(ev) {
        var eventType = MOUSE_INPUT_MAP[ev.type];

        // IE8 uses non-standard button indices:
        // http://msdn.microsoft.com/en-us/library/ie/ms533544(v=vs.85).aspx
        // left button is 1
        //
        // Standard is here:
        // http://msdn.microsoft.com/en-us/library/ie/ff974877(v=vs.85).aspx
        // left button is 0
        var leftMouseButton = 0;
        if (isIE8) {
            leftMouseButton = 1;
        }

        // on start we want to have the left mouse button down
        if (eventType & INPUT_START && ev.button === leftMouseButton) {
            this.pressed = true;
        }

        if (eventType & INPUT_MOVE && ev.button !== leftMouseButton) {
            eventType = INPUT_END;
        }

        // mouse must be down, and mouse events are allowed (see the TouchMouse input)
        if (!this.pressed || !this.allow) {
            return;
        }

        if (eventType & INPUT_END) {
            this.pressed = false;
        }

        this.callback(this.manager, eventType, {
            pointers: [ev],
            changedPointers: [ev],
            pointerType: INPUT_TYPE_MOUSE,
            srcEvent: ev
        });
    }
});

class ControlEvent {
    constructor(type, index, direction, mousePosition) {
        this.type = type;
        this.index = index;
        this.direction = direction;
        this.mousePosition = [...mousePosition];
    }
}

export default class Controls {
    static {
        this.instance = new this();
    }

    constructor() {
        this.registerEvents();
        this.hudActive = false;
        this.mousePosition = [0, 0];
        this.mouseHeld = {};
        this.keyHeld = {};
        this.listenerNextId = 0;
        this.listeners = {};
    }

    addListener(listener, type = undefined, direction = undefined, index = undefined) {
        let listenerId = this.listenerNextId;
        this.listenerNextId++;
        this.listeners[listenerId] = {
            'listener': listener,
            'type': type,
            'index': index,
            'direction': direction,
        };
        return listenerId;
    }

    removeListener(index) {
        delete this.listeners[index];
    }

    registerEvents() {
        document.addEventListener('mousedown', event => this.mouseDown(event) );
        document.addEventListener('mouseup', event => this.mouseUp(event) );
        document.addEventListener('mousemove', event => this.mouseMove(event) );
        document.addEventListener('wheel', event => this.mouseWheel(event) );
        document.addEventListener('keydown', event => this.keyDown(event) );
        document.addEventListener('keyup', event => this.keyUp(event) );
        window.addEventListener('blur', event => this.focusOut(event) );
        // Disable right click menu
        document.addEventListener('contextmenu', event => event.preventDefault() );
    }

    mouseDown(event) {
        if (this.hudActive) return;
        this.mouseHeld[event.button] = true;
        this.distributeEvent('mouse', event.button.toString(), 'down');
    }

    mouseUp(event) {
        if (this.hudActive) return;
        delete this.mouseHeld[event.button];
        this.distributeEvent('mouse', event.button.toString(), 'up');
    }

    mouseMove(event) {
        this.mousePosition = [event.x, event.y];
        this.distributeEvent('mouseMove', null, null);
    }

    mouseWheel(event) {
        if (this.hudActive) return;
        this.distributeEvent('mouse', event.deltaY < 0 ? 'wheelUp' : 'wheelDown', 'down');
    }

    keyDown(event) {
        if (this.hudActive || event.repeat) return;
        this.keyHeld[event.code] = true;
        this.distributeEvent('key', event.code, 'down');
    }

    keyUp(event) {
        if (this.hudActive || event.repeat) return;
        delete this.keyHeld[event.code];
        this.distributeEvent('key', event.code, 'up');
    }

    distributeEvent(type, index, direction) {
        const event = new ControlEvent(type, index, direction, this.mousePosition);
        for (let listenerId in this.listeners) {
            let listener = this.listeners[listenerId];
            if (
                (listener['type'] === undefined || listener['type'] === type)
                && (listener['index'] === undefined || listener['index'] === index)
                && (listener['direction'] === undefined || listener['direction'] === listener)
            ) {
                listener['listener'](event);
            }
        }
    }

    focusOut(event) {
        // Remove every held button on focus loss, distribute up event
        for (let index in this.mouseHeld) {
            this.distributeEvent('mouse', index, 'up');
            delete this.mouseHeld[index];
        }
        for (let index in this.keyHeld) {
            this.distributeEvent('key', index, 'up');
            delete this.keyHeld[index];
        }
    }
}
const keyGroups = [ 'start', 'dpad', 'abxy', 'trig' ];
const axisGroups = [ 'steering', 'tilt' ];
const presets = [
    { // Mayflash GameCube adapter
        names: [
            "MAYFLASH GameCube Controller Adapter (Vendor: 0079 Product: 1843)", // Chrome and Edge
            "0079-1843-MAYFLASH GameCube Controller Adapter" // Firefox
        ],
        start: [9],
        dpad: [12, 13, 14, 15],
        abxy: [1, 2, 0, 3],
        trig: [4, 5],
        steering: {id: 0, deadzone: 0.15, max: 0.7},
        tilt: {id: 1, deadzone: 0.15, max: 0.7},
    },
    { // Xbox Controller
        names: [
            "Xbox 360 Controller (XInput STANDARD GAMEPAD)", // Chrome and Edge on Windows
            "xinput", // Firefox on Windows
            "Microsoft Controller (STANDARD GAMEPAD Vendor: 045e Product: 02ea)" // Chrome on Linux
        ],
        start: [9],
        dpad: [12, 13, 14, 15],
        abxy: [0, 1, 2, 3],
        trig: [6, 7],
        steering: {id: 0, deadzone: 0.1, max: 0.95},
        tilt: {id: 1, deadzone: 0.1, max: 0.95},
    },
    { // Xbox Controller on Linux Firefox
        names: [
            "045e-02ea-Microsoft X-Box One S pad" // Firefox on Linux
        ],
        start: [6],
        dpad: [{id: 7, val: -1}, {id: 7, val: 1}, {id: 6, val: -1}, {id: 6, val: 1}],
        abxy: [0, 1, 2, 3],
        trig: [{id: 2, val: 1}, {id: 5, val: 1}],
        steering: {id: 0, deadzone: 0.1, max: 0.95},
        tilt: {id: 1, deadzone: 0.1, max: 0.95},
    }
];
const xboxDefault = presets[1];

export default class GamepadManager {
    constructor() {
        this.connected = [];
        window.addEventListener("gamepadconnected", e => {
            this.connected[e.gamepad.index] = this.findBinding(e.gamepad);
        });
        window.addEventListener("gamepaddisconnected", e => {
            delete this.connected[e.gamepad.index];
        });
    }

    // Find preset for the given gamepad based on gamepad.id
    findBinding(gamepad) {
        for (let binding of presets) {
            if (binding.names.includes(gamepad.id)) {
                return structuredClone(binding);
            }
        }
        return xboxDefault;
    }

    // Translate all active controls into more internal info
    getStatus() {
        const result = {};
        const gamepads = navigator.getGamepads();
        for (let index in this.connected) {
            const status = result[index] = {};
            const binding = this.connected[index];
            const gamepad = gamepads[index];
            if (!gamepad) {
                continue;
            }
            // Assign digital button groups from current status
            for (let group of keyGroups) {
                const groupStatus = status[group] = [];
                for (let buttonIn in binding[group]) {
                    const button = binding[group][buttonIn];
                    // Read gamepad button based on id in binding
                    // If button is represented by an axis (typical of some triggers and dpads)
                    if (typeof button === 'object') {
                        groupStatus[buttonIn] = gamepad.axes[button.id] === button.val;
                    } else {
                        groupStatus[buttonIn] = gamepad.buttons[button].value >= 1;
                    }
                }
            }
            // Assign steering and tilt
            for (let target of axisGroups) {
                const axisBinding = binding[target];
                const value = gamepad.axes[axisBinding.id];
                if (value > -axisBinding.deadzone && value < axisBinding.deadzone) {
                    // Stick is within deadzone
                    status[target] = 0;
                } else {
                    // If absolute value of the axis > max, it should be one, we multiply as such and bound between -1 and 1
                    status[target] = Math.min(1, Math.max(-1, value / axisBinding.max));
                }
            }
        }
        return result;
    }
}
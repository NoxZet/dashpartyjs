export default class PlayerManager {
    constructor(gamepadManager) {
        this.gamepadManager = gamepadManager;
        this.gamepadStatus = {};
        this.gamepadAssociation = {};
        this.playerKarts = {};
    }

    refresh() {
        const newGamepadStatus = this.gamepadManager.getStatus();
        for (let index in this.playerKarts) {
            if (index < 1000 && newGamepadStatus[index]) {
                const kart = this.playerKarts[index];
                const gamepad = newGamepadStatus[index];
                kart.steering = gamepad.steering;
                kart.throttle = gamepad.abxy[0];
                kart.brakeKey = gamepad.abxy[1];
                kart.driftKey = gamepad.trig[0] || gamepad.trig[1];
            }
        }
    }

    bindPlayerKart(identifier, kart) {
        this.playerKarts[identifier] = kart;
    }

    unbindPlayerKart(identifier) {
        delete this.playerKarts[identifier];
    }

    resetPlayerKarts() {
        this.playerKarts = {};
    }
}
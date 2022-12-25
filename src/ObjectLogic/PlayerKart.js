import { absoluteValue, addVectors, crossProduct, dotProduct, mpVector, printHudConsole, rotateVector } from "utils";

export default class PlayerKart {
    constructor() {
        this.pos = [ 10, 10, 0 ];
        this.momentum = [ 0, 0, 0 ];
        this.modelHeading = [ 1, 0, 0 ];
        this.miniturbo = 0;
        this.floored = true;
        this.driftDuration = 0;
        this.driftCooldown = 0;
        this.driftRight = true;
        this.mtSteadiness = 0;
        // Kart stats
        this.kartSpeed = 0.1;
        this.mtAcc = this.kartSpeed * 0.03;
        this.kartThrottleAcc = this.kartSpeed * 0.005;
        this.kartSlowdown = this.kartSpeed * 0.012;
        this.kartmtCharge = 60;
        this.kartmtDuration = 30;
        this.driftOffset = 45 / 180 * Math.PI;
        this.kartTurnspeed = 1 / 180 * Math.PI; // about 0.174
        this.avgMomentumTurnspeed = this.kartTurnspeed / 10;
        this.maxMomentumTurnspeed = this.kartTurnspeed * 2;
        // Hitbox
        this.hitboxRadius = 0.8;
        this.hitboxHeight = 1;
        // Controls
        this.steering = 0;
        this.throttle = false;
        this.brakeKey = false;
        this.driftKey = false;
    }

    get maxSpeed() {
        // Todo terrain slowdown
        return this.kartSpeed * ((this.miniturbo > 0) ? 1.3 : 1);
    }

    updateHeading() {
        let rotationAngle = 0;
        if (this.miniturbo > 0) {
            this.miniturbo--;
        }
        // Check if drift can be initiated
        if (this.driftDuration <= 0) {
            if (this.driftCooldown > 0) {
                this.driftCooldown--;
            } else {
                // No drift and no cooldown
                if (this.driftKey && (this.steering < -0.4 || this.steering > 0.4)) {
                    this.driftDuration = 1;
                    this.driftRight = this.steering > 0;
                    // Reset MT
                    this.miniturbo = 0;
                }
            }
        }
        // Process if drift is in action
        if (this.driftDuration > 0) {
            // Stop the drift from low speed (don't MT from this)
            if (absoluteValue(this.momentum) < this.kartSpeed * 0.4) {
                this.driftDuration = 0;
                this.driftCooldown = 12;
            }
            // Stop the drift
            else if (!this.driftKey) {
                if (this.driftDuration >= this.kartmtCharge) {
                    this.miniturbo = this.kartmtDuration;
                }
                this.driftDuration = 0;
                this.driftCooldown = 12;
            }
            else {
                let steerCoefficient, dirMp;
                if (this.driftRight) {
                    steerCoefficient = (1 + this.steering) / 2;
                    dirMp = 1;
                } else {
                    steerCoefficient = (1 - this.steering) / 2;
                    dirMp = -1;
                }
                // At the beginning of a drift, turn sharper
                let driftStartBonus = (this.driftDuration < 7 ? (7 - this.driftDuration) : 0) / 4;
                // Drift less sharp with steadiness
                driftStartBonus *= (5.5 - Math.sqrt(this.mtSteadiness)) / 5.5;
                rotationAngle = dirMp * this.kartTurnspeed * (0.2 + steerCoefficient * 1.0 + driftStartBonus);
                this.driftDuration++;
            }
        }
        // Rotate without drift
        if (this.driftDuration <= 0) {
            rotationAngle = this.steering * this.kartTurnspeed;
        }
        this.modelHeading = rotateVector(this.modelHeading, [0, 0, 1], rotationAngle);
    }

    get throttleHeading() {
        if (
            // Alter throttle heading in drift
            this.driftDuration > 0 ||
            // Sideway boost
            (this.mt > 0 && ((this.driftRight && this.steering < 0.2) || (!this.driftRight && this.steering > 0.2)))
        ) {
            return rotateVector(this.modelHeading, [ 0, 0, 1 ], this.driftOffset * (5.5 - Math.sqrt(this.mtSteadiness)) / 5.5 * (this.driftRight ? -1 : 1));
        } else {
            return this.modelHeading;
        }
    }

    updateMomentum() {
        let momentum = this.momentum;
        let origAbsMomentum = absoluteValue(this.momentum);
        if (this.floored) {
            const throttleHeading = this.throttleHeading;
            if (this.throttle) {
                // Throttle momentum increase
                if (origAbsMomentum < this.kartThrottleAcc) {
                    momentum = addVectors(momentum, throttleHeading, this.kartThrottleAcc);
                } else if (origAbsMomentum < this.maxSpeed) {
                    momentum = mpVector(momentum, Math.min(this.maxSpeed, origAbsMomentum + this.kartThrottleAcc) / origAbsMomentum);
                }
            } else if (origAbsMomentum > 0) {
                const slowdown = (this.brakeKey ? 2.2 : 1) * this.kartSlowdown;
                momentum = mpVector(momentum, Math.max(0, origAbsMomentum - this.kartThrottleAcc) / origAbsMomentum);
            }
            // Throttle momentum direction change
            let angleDiff = Math.atan2(
                dotProduct(crossProduct(throttleHeading, momentum), [0, 0, 1]),
                dotProduct(momentum, throttleHeading)
            );
            // During miniturbo without throttle, don't turn angle
            if (this.throttle || this.miniturbo <= 0) {
                let angleNormalized = Math.sqrt(Math.abs(angleDiff / (this.throttle ? 3 : 9) / this.avgMomentumTurnspeed))
                    * this.avgMomentumTurnspeed * Math.sign(angleDiff);
                momentum = rotateVector(momentum, [ 0, 0, 1 ], angleNormalized);
            }
            if (this.miniturbo > 0) {
                // "a-tech", releasing throttle in MT causes the kart to be more stable
                if (!this.throttle) {
                    this.mtSteadiness++;
                }
                momentum = addVectors(momentum, this.momentum, this.mtAcc);
            }
        }
        // The speed kart mustn't be over after this frame - real max speed + gradual decrease if over
        let frameMaxSpeed = Math.max(this.maxSpeed, origAbsMomentum - this.kartSlowdown);
        let absMomentum = absoluteValue(momentum);
        if (absMomentum > frameMaxSpeed) {
            momentum = mpVector(momentum, frameMaxSpeed / absMomentum);
        }
        this.momentum = momentum;
        // steadiness falls off nonlinearly
        this.mtSteadiness = Math.max(0, this.mtSteadiness * 0.99 - 0.1);
    }

    updatePosition() {
        this.pos = addVectors(this.pos, this.momentum);
    }

    update() {
        this.updateHeading();
        this.updateMomentum();
        this.updatePosition();
        printHudConsole({absmomen: absoluteValue(this.momentum), momentum: this.momentum, mt: this.miniturbo, driftDuration: this.driftDuration, icyness: this.mtSteadiness});
    }
}
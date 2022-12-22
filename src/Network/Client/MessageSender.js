export default class MessageSender {
    constructor() {
        this.tick = 0;
        this.sendObjects = [];
    }

    sendObject(object, calculateAhead) {
        let pos = [...object.pos];
        let speed = [...object.speed];
        let acceleration = [...object.acceleration];
        let speedModifier = 1 - object.relativeSlowdown * calculateAhead;
        speed[0] *= speedModifier;
        speed[1] *= speedModifier;
        speed[0] += acceleration[0] * calculateAhead;
        speed[1] += acceleration[1] * calculateAhead;
        pos[0] += speed[0] * calculateAhead;
        pos[1] += speed[1] * calculateAhead;
        
    }

    update(frameRate) {
        this.tick += frameRate;
        if (this.tick >= 1.0) {
            this.tick--;
            let calculateAhead = 0.5 - this.tick;
            for (let object of this.sendObjects) {
                this.sendObjects(object, calculateAhead);
            }
        }
    }
}
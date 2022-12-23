import { Object3D } from "three";

export default class Kart {
    constructor(kart, model, sparkSources, sparkFactory) {
        this.object3d = new Object3D;
        this.kart = kart;
        this.model = model;
        this.sparkSources = sparkSources;
        this.sparkFactory = sparkFactory;
        this.initialize();
    }

    initialize() {
        this.sparks = [];
        this.object3d.add(this.model);
    }

    update() {
        
    }

    addToScene(scene) {
        scene.add(this.object3d);
    }

    removeFromScene() {
        this.object3d.removeFromParent();
    }
}
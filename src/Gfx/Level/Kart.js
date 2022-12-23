import { Object3D, Vector3 } from "three";

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
        this.update();
    }

    update() {
        // Set position to kart
        this.object3d.position.set(...this.kart.pos).divideScalar(10);
        // Adjust camera to be opposite of average of kart model heading and momentum
        const modelHeading = new Vector3(...this.kart.modelHeading);
        const momentum = new Vector3(...this.kart.momentum);
        if (momentum.length() >= 0.01) {
            momentum.normalize();
            momentum.add(modelHeading);
            if (momentum.length() > 0) {
                this.cameraHeading = momentum.multiplyScalar(-1).normalize();
            }
        } else {
            this.cameraHeading = modelHeading.clone().multiplyScalar(-1).normalize();
        }
        // Adjust object rotation to match kart heading
        const headingTarget = modelHeading.clone().multiplyScalar(-1).add(this.object3d.position);
        this.object3d.up.set(0, 0, 1).normalize();
        this.object3d.lookAt(headingTarget);
    }

    addToScene(scene) {
        scene.add(this.object3d);
    }

    removeFromScene() {
        this.object3d.removeFromParent();
    }
}
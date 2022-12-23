import * as THREE from 'three';
//import RaycastPlane from 'Gfx/RaycastPlane';

const CAMERA_OFFSET = new THREE.Vector3(0, 30, -50);
const textureLoader = new THREE.TextureLoader();

/**
 * @property {THREE.Scene} scene
 * @property {THREE.PerspectiveCamera} camera
 * @property {THREE.WebGLRenderer} renderer
 */
export default class Level {
    constructor() {
        this.scene = new THREE.Scene();
        //this.scene.background = textureLoader.load('res/ocean.png');
        this.setupCamera();
        this.setupCanvas();
        //this.raycastPlane = new RaycastPlane(this.camera, this.scene);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(45, 1, 1, 1000);
        this.camera.position.copy(CAMERA_OFFSET);
        this.camera.up.copy(new THREE.Vector3(0, CAMERA_OFFSET.z, -CAMERA_OFFSET.y).normalize());
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.camera.updateProjectionMatrix();
    }

    setupCanvas() {
        this.renderer = new THREE.WebGLRenderer({
            'canvas': document.getElementById('three-canvas'),
        });
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.autoClear = false;
    }

    updateCamera() {
        // Set camera behind kart
        const kart3d = this.trackObject.object3d;
        this.camera.position.copy(new THREE.Vector3(kart3d.position.x, kart3d.position.y - 6, kart3d.position.z + 2));
        this.camera.up.copy(new THREE.Vector3(0, 0, 1));
        this.camera.lookAt(new THREE.Vector3(kart3d.position.x, kart3d.position.y, kart3d.position.z + 1));
        this.camera.updateProjectionMatrix();
    }

    render() {
        document.getElementById('three-canvas').width = window.innerWidth;
        document.getElementById('three-canvas').height = window.innerHeight;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.updateCamera();

        this.renderer.render(this.scene, this.camera);
    }
}
